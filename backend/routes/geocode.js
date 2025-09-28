const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
  }

  try {
    console.log(`Reverse geocoding for lat: ${latNum}, lon: ${lonNum}`);

    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'jsonv2',
        lat: latNum,
        lon: lonNum,
      },
      headers: {
        'User-Agent': 'YourAppName/1.0 (your@email.com)',
      },
    });

    const data = response.data;
    console.log('Nominatim response:', data);

    const address = data.display_name && data.display_name.trim().length > 0
      ? data.display_name
      : null;

    if (!address) {
      return res.json({ address: null, message: 'Location not found' });
    }

    res.json({ address });
  } catch (error) {
    console.error('Reverse geocoding error:', error.message || error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
