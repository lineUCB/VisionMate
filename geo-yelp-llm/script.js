// Don't push api keys to repo
const yelpApiKey = '';
const googleApiKey = '';

// You can treat this as the main function
function getLocation() {
    if (navigator.geolocation) {
        // showPosition is a callback function
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Callback
function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    getRestaurants(lat, lon);
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

// Passing in Yelp JSON results and current address to LLM. Please replace with a different noggin.
// It's also pretty expensive right now to do a singe run on GPT-4o. Maybe try GPT-4o mini or 3.5?
async function getRestaurants(lat, lon) {
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lon}&categories=restaurants&limit=10`;
    const options = {
        headers: {
            Authorization: `Bearer ${yelpApiKey}`,
        },
    };
    
    const currentAddress = await getCurrentAddress(lat, lon);

    try {
        const response1 = await fetch(url, options);
        const data = await response1.json();

        displayRestaurantData(data.businesses);

        // import fetch from 'node-fetch'; // for node.js

        // Convert JSON data to a readable string format
        const yelpJsonString = JSON.stringify(data, null, 2);

        const response2 = await fetch(
          'https://noggin.rea.gent/embarrassing-badger-2621',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer rg_v1_xcd49ad4oeltuef92n95lqc418avpcfv8xi3_ngk',
            },
            body: JSON.stringify({
              "user_location": "",
              "yelp_recommendation": yelpJsonString,
              "user_destination": "",
              "store_type": "",
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
