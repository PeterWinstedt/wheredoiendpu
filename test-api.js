import fetch from 'node-fetch';

// Using Stockholm coordinates which should have many stops
const nearbyStopsUrl = 'https://api.resrobot.se/v2.1/location.nearbystops?accessId=5c4e8a9a-fef9-47c4-b4bc-ce4f85687222&originCoordLat=59.3293&originCoordLong=18.0686&r=1000&maxNo=10&format=json';

async function testApiDirectly() {
  try {
    console.log('Testing ResRobot API directly...');
    
    // Test nearby stops API
    console.log('Fetching nearby stops near Stockholm...');
    const nearbyStopsResponse = await fetch(nearbyStopsUrl);
    
    if (!nearbyStopsResponse.ok) {
      console.error(`Error fetching nearby stops: ${nearbyStopsResponse.status} ${nearbyStopsResponse.statusText}`);
      const text = await nearbyStopsResponse.text();
      console.error('Response:', text);
    } else {
      const data = await nearbyStopsResponse.json();
      console.log('Success! Found', data.StopLocation ? data.StopLocation.length : 0, 'stops');
      if (data.StopLocation && data.StopLocation.length > 0) {
        console.log('First stop:', data.StopLocation[0].name);
        console.log('All stops:', data.StopLocation.map(stop => stop.name).join(', '));
      } else {
        console.log('No stops found');
        console.log('Full response:', JSON.stringify(data, null, 2));
      }
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

// Run the test
testApiDirectly(); 