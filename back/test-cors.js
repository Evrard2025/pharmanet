const express = require('express');
const cors = require('cors');

console.log('🧪 Test de configuration CORS...');

const app = express();

// Configuration CORS identique à start-final-v2.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://test-pharma.netlify.app',
    'https://pharmanet.netlify.app',
    'https://pharmanet-frontend.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.listen(3001, () => {
  console.log('✅ Serveur de test CORS démarré sur http://localhost:3001');
  console.log('🔗 Testez avec: curl -H "Origin: https://test-pharma.netlify.app" http://localhost:3001/test-cors');
});
