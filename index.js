// Note: When using the proxy server, we don't need to include the API key in the frontend code
// as the proxy will handle that securely

// Global variables
let map;
let closestStopMarker = null; // Track the closest stop marker

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
    return data;
  } catch (error) {
    console.error("Error finding nearby stops:", error);
    throw error;
  }
}

// Get departures for a stop
async function getDepartures(stopId, maxResults = 10) {
  try {
    const url = `/api/departures?stopId=${stopId}&maxResults=${maxResults}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting departures:", error);
    throw error;
  }
}

// Find the next departing bus from the closest stop and show in popup
async function showNextBusDestination() {
  try {
    // Show loading indicator for next bus
    const loadingElement = document.getElementById('loading-next-bus');
    if (loadingElement) {
      loadingElement.style.display = 'inline-block';
    }
    
    // Get user location
    const position = await getUserLocation();
    
    // Save current map center and zoom
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    // Find nearby stops
    const stopsData = await findNearbyStops(position.lat, position.lng);
    
    if (!stopsData.stopLocationOrCoordLocation || stopsData.stopLocationOrCoordLocation.length === 0) {
      throw new Error('No stops found nearby');
    }
    
    // Get the closest stop
    const closestStop = stopsData.stopLocationOrCoordLocation[0].StopLocation;
    
    // Get departures for the closest stop
    const departures = await getDepartures(closestStop.extId);
    
    if (!departures.Departure || departures.Departure.length === 0) {
      throw new Error('No departures found for this stop');
    }
    
    // Get the next departure
    const nextDeparture = departures.Departure[0];
    
    // Calculate valid stop coordinates
    const stopLat = closestStop.lat / 1000000;
    const stopLon = closestStop.lon / 1000000;
    
    // Validate coordinates before using them
    const validCoords = isValidCoordinate(stopLat, stopLon);
    
    // If coordinates are invalid, use user position instead
    const popupLatLng = validCoords ? 
      [stopLat, stopLon] : 
      [position.lat, position.lng];
    
    // Show popup with next bus info
    const popupContent = `
      <div class="next-bus-popup">
        <h3>Next Departure</h3>
        <p><strong>From:</strong> ${closestStop.name}</p>
        <p><strong>To:</strong> ${nextDeparture.direction}</p>
        <p><strong>Line:</strong> ${nextDeparture.Product.line} (${nextDeparture.Product.name})</p>
        <p><strong>Departing:</strong> ${nextDeparture.time}</p>
        <button onclick="showStopDepartures('${closestStop.extId}', '${closestStop.name}')">Show All Departures</button>
      </div>
    `;
    
    const popup = L.popup()
      .setLatLng(popupLatLng)
      .setContent(popupContent)
      .openOn(map);
    
    // Restore original map view
    map.setView(currentCenter, currentZoom);
    
    // Hide loading indicator
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  } catch (error) {
    // Hide loading indicator
    const loadingElement = document.getElementById('loading-next-bus');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    document.getElementById('error').textContent = `Error: ${error.message}`;
    console.error('Error showing next bus:', error);
  }
}

// Validate coordinates to make sure they're reasonable
function isValidCoordinate(lat, lon) {
  // Check if values are numbers
  if (isNaN(lat) || isNaN(lon)) return false;
  
  // Check if latitude is between -90 and 90
  if (lat < -90 || lat > 90) return false;
  
  // Check if longitude is between -180 and 180
  if (lon < -180 || lon > 180) return false;
  
  // Check if coordinates are not (0,0) which is in the ocean
  if (lat === 0 && lon === 0) return false;
  
  return true;
}

// Helper to normalize coordinates (handle both decimal and microdegrees)
function normalizeCoord(val) {
  if (Math.abs(val) < 0.2) return val * 1e6; // If value is very small, it's likely already divided
  if (Math.abs(val) > 180) return val / 1e6; // If value is very large, it's microdegrees
  return val; // Otherwise, use as-is
}

// Initialize the application
async function init() {
  try {
    // Show loading indicator
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'inline-block';
    }
    
    document.getElementById('error').textContent = '';
    
    // Get user's location
    const position = await getUserLocation();
    
    // Initialize map centered on user's location
    map = L.map('map').setView([position.lat, position.lng], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add user marker
    const userMarker = L.marker([position.lat, position.lng], {
      icon: L.divIcon({
        className: 'user-marker',
        html: '<div class="user-dot"></div>',
        iconSize: [20, 20]
      })
    }).addTo(map);
    userMarker.bindPopup('Your location').openPopup();
    
    // Find nearby stops
    const stopsData = await findNearbyStops(position.lat, position.lng);
    
    // Display nearby stops on map only (no list)
    if (stopsData.stopLocationOrCoordLocation && stopsData.stopLocationOrCoordLocation.length > 0) {
      displayStopsOnMap(stopsData.stopLocationOrCoordLocation, position);
    } else {
      document.getElementById('error').textContent = 'No stops found nearby.';
    }
    
    // Hide loading indicator
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Add button for showing next bus destination
    const nextBusButton = L.control({position: 'topright'});
    nextBusButton.onAdd = function() {
      const div = L.DomUtil.create('div', 'next-bus-button-container');
      div.innerHTML = `
        <button id=\"next-bus-btn\" class=\"leaflet-control-button go-somewhere-btn\">Go somewhere</button>
      `;
      return div;
    };
    nextBusButton.addTo(map);
    
    // Add click handler for the button
    setTimeout(() => {
      const btnElement = document.getElementById('next-bus-btn');
      if (btnElement) {
        btnElement.addEventListener('click', showNextBusDestination);
      }
    }, 100);
    
  } catch (error) {
    // Hide loading indicator
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    document.getElementById('error').textContent = `Error: ${error.message}`;
    console.error('Initialization error:', error);
  }
}

// Display stops just on the map (only the closest stop)
function displayStopsOnMap(stops, userPosition) {
  console.log('Nearby stops data:', stops);
  // Find and highlight the closest stop
  if (stops.length > 0) {
    let closestStop = null;
    let closestDistance = Infinity;
    
    // Calculate and find the actual closest stop
    stops.forEach(stop => {
      const stopLocation = stop.StopLocation;
      const stopLat = normalizeCoord(stopLocation.lat);
      const stopLon = normalizeCoord(stopLocation.lon);
      
      // Skip invalid coordinates
      if (!isValidCoordinate(stopLat, stopLon)) {
        console.warn('Invalid stop coordinates:', stopLocation);
        return;
      }
      
      const distance = calculateDistance(
        userPosition.lat, 
        userPosition.lng, 
        stopLat, 
        stopLon
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestStop = stopLocation;
        closestStop._lat = stopLat;
        closestStop._lon = stopLon;
      }
    });
    
    if (!closestStop) {
      document.getElementById('error').textContent = 'No valid bus stop found nearby.';
      console.error('No valid closest stop found.');
      return;
    }
    // Add special marker for closest stop
    const closestStopLat = closestStop._lat;
    const closestStopLon = closestStop._lon;
    console.log('Closest stop:', closestStop, 'Lat:', closestStopLat, 'Lon:', closestStopLon);
    
    if (isValidCoordinate(closestStopLat, closestStopLon)) {
      // Remove previous closest stop marker if it exists
      if (closestStopMarker) {
        map.removeLayer(closestStopMarker);
      }
      
      // Create new marker for closest stop
      closestStopMarker = L.marker([closestStopLat, closestStopLon], {
        icon: L.divIcon({
          className: 'closest-stop-marker',
          html: `<div class=\"closest-stop-icon\">★</div>`,
          iconSize: [35, 35]
        })
      }).addTo(map);
      
      closestStopMarker.bindPopup(`
        <b>${closestStop.name}</b><br>
        <strong>Closest stop to you!</strong><br>
        <p>Distance: ${Math.round(closestDistance)} m</p>
        <button class=\"show-departures-btn go-somewhere-btn\" data-stop-id=\"${closestStop.extId}\" data-stop-name=\"${closestStop.name}\">Go somewhere</button>
      `);
      
      closestStopMarker.on('popupopen', function() {
        setTimeout(() => {
          document.querySelectorAll('.show-departures-btn').forEach(button => {
            button.addEventListener('click', function() {
              const stopId = this.getAttribute('data-stop-id');
              const stopName = this.getAttribute('data-stop-name');
              showStopDepartures(stopId, stopName);
            });
          });
        }, 100);
      });
    } else {
      document.getElementById('error').textContent = 'Closest stop has invalid coordinates.';
      console.error('Closest stop has invalid coordinates:', closestStop);
    }
  } else {
    document.getElementById('error').textContent = 'No stops found nearby.';
    console.error('No stops found in stops array.');
  }
}

// Show departures for a selected stop
async function showStopDepartures(stopId, stopName) {
  try {
    const titleElement = document.getElementById('departures-title');
    const loadingElement = document.getElementById('departures-loading');
    const errorElement = document.getElementById('departures-error');
    const containerElement = document.getElementById('departures-container');
    const listElement = document.getElementById('departures-list');
    
    if (!titleElement || !loadingElement || !errorElement || !containerElement || !listElement) {
      console.error('Missing required DOM elements for departures');
      return;
    }
    
    titleElement.textContent = `Departures from ${stopName}`;
    loadingElement.style.display = 'inline-block';
    errorElement.textContent = '';
    containerElement.style.display = 'block';
    listElement.innerHTML = '';
    
    const departures = await getDepartures(stopId);
    
    loadingElement.style.display = 'none';
    
    if (!departures.Departure || departures.Departure.length === 0) {
      errorElement.textContent = 'No departures found for this stop.';
      return;
    }
    
    departures.Departure.forEach(departure => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${departure.time}</td>
        <td>${departure.Product.line} ${departure.Product.name}</td>
        <td>${departure.direction}</td>
      `;
      listElement.appendChild(row);
    });
  } catch (error) {
    const loadingElement = document.getElementById('departures-loading');
    const errorElement = document.getElementById('departures-error');
    
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    if (errorElement) {
      errorElement.textContent = `Error: ${error.message}`;
    }
    
    console.error('Error showing departures:', error);
  }
}

// Make function available to the global scope for the popup button
window.showStopDepartures = showStopDepartures;

// Calculate distance between two coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 