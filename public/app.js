const recordButton = document.getElementById('recordButton');
const status = document.getElementById('status');
const memosDiv = document.getElementById('memos');

let mediaRecorder;
let recordedChunks = [];
let currentPosition = null;

// Geolocation updates every 5 seconds
function updateGeolocation() {
    navigator.geolocation.getCurrentPosition((position) => {
        currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
    });
}

updateGeolocation();
setInterval(updateGeolocation, 5000);

recordButton.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordButton.textContent = 'Record';
        status.textContent = 'Press "Record" to start recording...';
    } else {
        recordedChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', blob, 'memo.wav');
            formData.append('location', JSON.stringify(currentPosition));

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            addMemo(result.transcription, result.time, result.location);
        };

        mediaRecorder.start();
        recordButton.textContent = 'Stop';
        status.textContent = 'Recording...';
    }
});

function addMemo(transcription, time, location) {
    const memoDiv = document.createElement('div');
    memoDiv.className = 'memo';
    memoDiv.innerHTML = `
        <p>Transcription: ${transcription}</p>
        <p>Time: ${new Date(time).toLocaleString()}</p>
        <p>Location: ${location.latitude}, ${location.longitude}</p>
    `;
    memosDiv.appendChild(memoDiv);

    // Check if there's a previously transcribed memo at the same location
    document.querySelectorAll('.memo').forEach(memo => {
        const memoLocation = JSON.parse(memo.getAttribute('data-location'));
        if (memoLocation.latitude === location.latitude && memoLocation.longitude === location.longitude) {
            alert(`Previous memo found at this location: ${memo.querySelector('p').textContent}`);
        }
    });
}
