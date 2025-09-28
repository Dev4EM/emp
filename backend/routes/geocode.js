
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
          'User-Agent': 'YourAppName/1.0 (your@email.com)'
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding failed' });
    }

    const data = await response.json();
    res.json({ address: data.display_name || 'Location not found' });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
