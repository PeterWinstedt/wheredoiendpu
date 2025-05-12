import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// API key for ResRobot (set as an environment variable or replace with your key)
const apiKey = process.env.RESROBOT_API_KEY || '5c4e8a9a-fef9-47c4-b4bc-ce4f85687222';

// Proxy endpoint for nearby stops
app.get('/api/nearby-stops', async (req, res) => {
  const { lat, lng, radius, maxResults } = req.query;
  
  try {
    const response = await fetch(
      `https://api.resrobot.se/v2.1/location.nearbystops?accessId=${apiKey}&originCoordLat=${lat}&originCoordLong=${lng}&r=${radius || 1000}&maxNo=${maxResults || 10}&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    let transformedData = { StopLocation: [] };
    
    if (data.stopLocationOrCoordLocation) {
      transformedData.StopLocation = data.stopLocationOrCoordLocation
        .filter(item => item.StopLocation)
        .map(item => ({
          ...item.StopLocation,
          id: item.StopLocation.id || item.StopLocation.extId,
          name: item.StopLocation.name,
          lat: item.StopLocation.lat,
          lon: item.StopLocation.lon,
          dist: item.StopLocation.dist
        }));
    }
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error finding nearby stops:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for departures
app.get('/api/departures', async (req, res) => {
  const { stopId } = req.query;
  
  try {
    const response = await fetch(
      `https://api.resrobot.se/v2.1/departureBoard?accessId=${apiKey}&id=${stopId}&format=json&maxJourneys=10`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching departures:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/index.html to view the application`);
}); 