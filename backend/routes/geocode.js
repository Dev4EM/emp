const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;

  // Validate latitude and longitude presence
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  // Validate latitude and longitude format
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (
    Number.isNaN(latNum) || Number.isNaN(lonNum) ||
    latNum < -90 || latNum > 90 ||
    lonNum < -180 || lonNum > 180
  ) {
    return res.status(400).json({ error: 'Invalid latitude or longitude values' });
  }

  try {
    // Add a proper User-Agent to comply with Nominatim policy
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lonNum}`,
      {
        headers: {
          'User-Agent': 'EmpeopleApp/1.0 (contact@empeople.esromagica.in)', // Your app info here
          'Accept-Language': 'en' // Optional: specify language for results
        },
        timeout: 10000 // Optional: timeout after 10 seconds
      }
    );

    if (!response.ok) {
      console.error(`OpenStreetMap API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Geocoding service error' });
    }

    const data = await response.json();

    if (!data.display_name) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ address: data.display_name });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
