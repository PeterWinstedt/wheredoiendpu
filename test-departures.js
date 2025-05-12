import fetch from 'node-fetch';

// Testing departures for a station in Stockholm
const departuresUrl = 'https://api.resrobot.se/v2.1/departureBoard?accessId=5c4e8a9a-fef9-47c4-b4bc-ce4f85687222&id=A=1@O=Kungsträdgården T-bana (Stockholm kn)@X=18073298@Y=59330783@U=1@L=740021659@&format=json&maxJourneys=10';

async function testDeparturesApi() {
  try {
    console.log('Testing ResRobot departures API...');
    console.log('Fetching departures...');
    
    const response = await fetch(departuresUrl);
    
    if (!response.ok) {
      console.error(`Error fetching departures: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
    } else {
      const data = await response.json();
      console.log('Response structure:', Object.keys(data));
      
      // Check if Departure is directly available or nested
      if (data.Departure) {
        console.log('Number of departures:', data.Departure.length);
        if (data.Departure.length > 0) {
          console.log('First departure:', JSON.stringify(data.Departure[0], null, 2));
        }
      } else {
        // Might be nested differently in v2.1
        console.log('Full response structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

// Run the test
testDeparturesApi(); 