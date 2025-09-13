const express = require('express');
const https = require('https');
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from current directory
app.use(express.static('.'));

// Root route for testing
app.get('/', (req, res) => {
  res.send('Proxy server is running! Try /branchLocator.json');
});


app.get('/branchLocator.json', async (req, res) => {
  console.log('Received request for branchLocator.json');
  
  // For now, return mock data since BDO API is not accessible
  const mockData = {
    "branches": [
      {
        "id": "1",
        "name": "BDO Makati",
        "address": "Makati Avenue, Makati City",
        "lat": 14.554730,
        "lng": 121.024445,
        "type": "branch"
      },
      {
        "id": "2", 
        "name": "BDO BGC",
        "address": "26th Street, Bonifacio Global City",
        "lat": 14.551890,
        "lng": 121.051630,
        "type": "branch"
      },
      {
        "id": "3",
        "name": "BDO ATM SM Mall",
        "address": "SM Mall of Asia, Pasay City", 
        "lat": 14.535030,
        "lng": 120.982220,
        "type": "atm"
      }
    ]
  };
  
  console.log('Returning mock BDO branch data');
  res.json(mockData);
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
