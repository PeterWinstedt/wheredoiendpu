// Note: When using the proxy server, we don't need to include the API key in the frontend code
// as the proxy will handle that securely

// Get user's current location
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      error => reject(error),
      { enableHighAccuracy: true }
    );
  });
}

// Find nearby stops using our proxy server
async function findNearbyStops(lat, lng, radius = 1000, maxResults = 10) {
  try {
    const url = `/api/nearby-stops?lat=${lat}&lng=${lng}&radius=${radius}&maxResults=${maxResults}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.StopLocation || [];
  } catch (error) {
    console.error("Error finding nearby stops:", error);
    throw error;
  }
}

// Initialize the map with user's location
async function initMap() {
  try {
    // Get user's current location
    const userLocation = await getUserLocation();
    
    // Create map centered on user's location
    const map = L.map('map').setView([userLocation.lat, userLocation.lng], 15);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker for user's location
    const userMarker = L.marker([userLocation.lat, userLocation.lng])
      .addTo(map)
      .bindPopup("You are here")
      .openPopup();
    
    // Find nearby stops
    const nearbyStops = await findNearbyStops(userLocation.lat, userLocation.lng);
    
    // Add markers for each nearby stop
    nearbyStops.forEach(stop => {
      L.marker([stop.lat, stop.lon])
        .addTo(map)
        .bindPopup(`<b>${stop.name}</b><br>Distance: ${stop.dist}m<br>ID: ${stop.id}`);
    });
    
    // Show list of stops
    displayStopsList(nearbyStops);
    
  } catch (error) {
    console.error("Error initializing map:", error);
    document.getElementById('error').textContent = `Error: ${error.message}`;
  }
}

// Display list of nearby stops
function displayStopsList(stops) {
  const stopsList = document.getElementById('stops-list');
  stopsList.innerHTML = '';
  
  if (stops.length === 0) {
    stopsList.innerHTML = '<p>No stops found nearby</p>';
    return;
  }
  
  const ul = document.createElement('ul');
  
  stops.forEach(stop => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${stop.name}</strong>
      <br>Distance: ${stop.dist} meters
      <br>ID: ${stop.id}
      <button onclick="showDepartures('${stop.id}', '${stop.name}')">Show departures</button>
    `;
    ul.appendChild(li);
  });
  
  stopsList.appendChild(ul);
}

// Show departures for a selected stop
async function showDepartures(stopId, stopName) {
  try {
    const departuresList = document.getElementById('departures');
    departuresList.innerHTML = `<h3>Departures from ${stopName}</h3><p>Loading departures...</p>`;
    
    // Using our proxy endpoint
    const url = `/api/departures?stopId=${stopId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Clear loading message
    departuresList.innerHTML = `<h3>Departures from ${stopName}</h3>`;
    
    if (!data.Departure || data.Departure.length === 0) {
      departuresList.innerHTML += '<p>No departures found</p>';
      return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
      <tr>
        <th>Line</th>
        <th>Destination</th>
        <th>Time</th>
        <th>Type</th>
      </tr>
    `;
    
    data.Departure.forEach(dep => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${dep.ProductAtStop?.num || '-'}</td>
        <td>${dep.direction}</td>
        <td>${dep.time}</td>
        <td>${dep.ProductAtStop?.catOutL || dep.ProductAtStop?.name || '-'}</td>
      `;
      table.appendChild(row);
    });
    
    departuresList.appendChild(table);
  } catch (error) {
    console.error("Error fetching departures:", error);
    document.getElementById('departures').innerHTML = `<h3>Departures from ${stopName}</h3><p>Error loading departures: ${error.message}</p>`;
  }
}

// Make function available to the global scope for the onclick handlers
window.showDepartures = showDepartures;

// Initialize when the page loads
window.onload = function() {
  initMap();
}; 