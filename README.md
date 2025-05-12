# Nearby Bus Stop Finder

This application helps you find nearby bus stops using the Trafiklab ResRobot API. It shows your current location on a map, displays nearby public transport stops, and allows you to view upcoming departures from those stops.

## Features

- Shows your current location on a map
- Finds nearby public transport stops
- Displays real-time departure information
- Mobile-friendly interface

## Prerequisites

- Node.js (v14.x or higher)
- npm or yarn
- A ResRobot API key from [Trafiklab](https://www.trafiklab.se/)

## Installation

1. Clone this repository or download the files
2. Install dependencies:

```bash
npm install
```

3. Add your API key to the proxy server:
   - Open `proxy-server.js`
   - Replace `YOUR_RESROBOT_API_KEY` with your actual API key from Trafiklab

   ```javascript
   const apiKey = process.env.RESROBOT_API_KEY || 'YOUR_RESROBOT_API_KEY';
   ```

   Alternatively, you can set it as an environment variable:

   ```bash
   export RESROBOT_API_KEY=your_actual_api_key
   ```

## Running the Application

1. Start the proxy server:

```bash
npm start
```

2. Open a web browser and navigate to:

```
http://localhost:3000
```

3. Allow location access when prompted by your browser

## API Usage

This application uses the following Trafiklab ResRobot API endpoints:

- `location.nearbystops` - For finding stops near a location
- `departureBoard` - For getting departure information from a stop

## Troubleshooting

- **Location access denied**: The application needs access to your location to find nearby stops. Make sure to allow location access in your browser.
- **No stops found**: Try increasing the search radius or moving to a location with more public transport options.
- **CORS issues**: The application includes a proxy server to handle CORS restrictions. Make sure it's running correctly.

## License

MIT 