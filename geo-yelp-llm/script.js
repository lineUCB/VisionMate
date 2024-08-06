// Don't push api keys to repo
const yelpApiKey = 'TRGeoPcMrvrTtTRxvpwYgNxTAq-hJIxE8tQHudu7wtVkAdxlXt8CO_ddEc3Z0jmhZDQviYg2Z45OnUAEF3NJe1CxvDifa-VdFo67cZVqDzgBkPrIO4-QLBQ-v_qrZnYx';
const googleApiKey = 'AIzaSyCmj2C87-DaHmF0CnNV5nfxqm-DVUlCpME';

// You can treat this as the main function
function respond(userInput) {
    if (navigator.geolocation) {
        // showPosition is a callback function
        navigator.geolocation.getCurrentPosition(function(position) {
            showPosition(position, userInput);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Callback
function showPosition(position, userInput) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    identifyIntentFirst(userInput).then(triggerCommand => {
        console.log('triggerCommand:', triggerCommand);
        getRestaurants(lat, lon, triggerCommand);
    });
}

// This function identifies a user's intent by taking in the user's transcribed audio input
// then identifying whether the data is for a new rec or a continued
// conversation. If it is a new rec, then the user will get a restaurant 
// recommendation using yelp data. Otherwise, the user will get a response based on the 
// comtinued dialogue while using saved localStorage recommendation data from before.
// Identifies the user's intent and outputs either 'first' or 'continued'
async function identifyIntentFirst(userInput) {
    // import fetch from 'node-fetch'; // for node.js

    const response = await fetch(
        'https://noggin.rea.gent/desperate-echidna-9253',
        {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer rg_v1_ikqio64in5964woesbbzllecm42kyxvyz1ry_ngk',
        },
        body: JSON.stringify({
            // fill variables here.
            "user_input": userInput,
        }),
        }
    ).then(response => response.text());
    console.log(response);
    return response;
}

// Returns the current addres for Qiongwen's requirement of current location info
async function getCurrentAddress(lat, lon) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}&language=en`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const address = data.results[0].formatted_address;
            displayCurrentAddress(address);
            return address;
        } else {
            console.error('No address found for the given coordinates.');
        }
    } catch (error) {
        console.error('Error fetching data from Google Maps API:', error);
    }
}

// Passing in Yelp JSON results and current address to LLM. It also responds differently based 
// on whether it is a continued conversation.
async function getRestaurants(lat, lon, triggerCommand) {

    const currentAddress = await getCurrentAddress(lat, lon);

    try {
        let data;
        if (triggerCommand == 'first') {
            const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lon}&categories=restaurants&limit=10`;
            const options = {
                headers: {
                    Authorization: `Bearer ${yelpApiKey}`,
                },
            };
            const response1 = await fetch(url, options);
            data = await response1.json();
            console.log(lat);
            console.log(lon);
            console.log(data);
            localStorage.setItem('storedData', JSON.stringify(data));
        } else {
            // Make sure that the data is deleted once the user exits the html page. Just
            // add this line when needed: localStorage.removeItem('storedData');
            data = JSON.parse(localStorage.getItem('storedData'));
            console.log(data);
        }

        if (data && data.businesses) {
            displayRestaurantData(data.businesses);
        } else {
            console.error('No businesses found in the response.');
        }

        // import fetch from 'node-fetch'; // for node.js

        // Convert JSON data to a readable string format
        const yelpJsonString = JSON.stringify(data, null, 2);

        const response2 = await fetch(
          'https://noggin.rea.gent/bitter-tortoise-5338',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer rg_v1_dkjyuqpzq8qyxxgou9epkkm9wj6jnlnofmyj_ngk',
            },
            body: JSON.stringify({
              "user_location": currentAddress,
              "yelp_recommendation": yelpJsonString,
              "user_input":"",
            }),
          }
        ).then(response2 => response2.text());

        displayLLMResponse(response2);
    } catch (error) {
        console.error('Error fetching data from Yelp API:', error);
    }
}

// These display functions below are used for my own programming reference, 
// displayLLMResponse might still be useful for outputting LLM responses to our UI
function displayLLMResponse(response) {
    const llmDiv = document.createElement('div');
    llmDiv.innerHTML = `<h2>LLM Response</h2><p>${response}</p>`;
    document.body.appendChild(llmDiv);
}

function displayCurrentAddress(address) {
    const currentLocationDiv = document.createElement('div');
    currentLocationDiv.innerHTML = `<h2>Current Location</h2><p>${address}</p>`;
    document.body.appendChild(currentLocationDiv);
}

function displayRestaurantData(restaurants) {
    const restaurantDiv = document.getElementById('restaurants');
    restaurantDiv.innerHTML = '';

    restaurants.forEach((restaurant) => {
        const restaurantElement = document.createElement('div');
        restaurantElement.innerHTML = `
            <h2>${restaurant.name}</h2>
            <p>${restaurant.url}</p>
            <p>${restaurant.location.address1}, ${restaurant.location.city}</p>
            <p>Rating: ${restaurant.rating}</p>
            <p>Review Count: ${restaurant.review_count}</p>
        `;
        restaurantDiv.appendChild(restaurantElement);
    });
}
