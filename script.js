// script.js

// Functionality for CSV file parsing
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const data = text.split('\n').map(row => row.split(','));
            resolve(data);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

// Functionality for uploading CSV files
function uploadCSV(event) {
    const file = event.target.files[0];
    parseCSV(file).then(data => {
        localStorage.setItem('musicData', JSON.stringify(data));
        console.log('Data uploaded to local storage');
    }).catch(error => console.error('Error parsing CSV:', error));
}

// Search and filter functionality
function searchMusic(keyword) {
    const data = JSON.parse(localStorage.getItem('musicData')) || [];
    return data.filter(item =>
        item.some(field => field.toLowerCase().includes(keyword.toLowerCase()))
    );
}

// Handling album artwork
function displayArtwork(artworkUrl) {
    const img = document.createElement('img');
    img.src = artworkUrl;
    img.alt = 'Album Artwork';
    document.body.appendChild(img);
}

// Record editing
function editRecord(index, newData) {
    let data = JSON.parse(localStorage.getItem('musicData')) || [];
    data[index] = newData;
    localStorage.setItem('musicData', JSON.stringify(data));
}

// Record deletion
function deleteRecord(index) {
    let data = JSON.parse(localStorage.getItem('musicData')) || [];
    data.splice(index, 1);
    localStorage.setItem('musicData', JSON.stringify(data));
}

// Discovery features
function discoverMusic() {
    const data = JSON.parse(localStorage.getItem('musicData')) || [];
    // Implementation for discovery can include random selection, etc.
    return data[Math.floor(Math.random() * data.length)];
}

// Event listeners for file upload
document.querySelector('#csvUpload').addEventListener('change', uploadCSV);