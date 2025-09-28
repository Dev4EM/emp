const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'EmpeopleApp/1.0 (contact@empeople.esromagica.in)'
        }
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
