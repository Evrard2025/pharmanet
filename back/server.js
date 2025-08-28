const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware de sécurité
app.use(helmet());
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/loyalty', require('./routes/loyalty'));

// Routes pour le suivi pharmaceutique
app.use('/api/patients', require('./routes/patients'));
app.use('/api/consultations', require('./routes/consultations').router);
app.use('/api/medicaments', require('./routes/medicaments'));
app.use('/api/surveillance-biologique', require('./routes/surveillance-biologique'));
app.use('/api/admin/users', require('./routes/admin-users'));

// Route dashboard
app.use('/api/dashboard', require('./routes/dashboard'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Pharmacie Fidélité - Backend opérationnel' });
});

// Endpoint de santé pour le déploiement
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// Connexion PostgreSQL et démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}).catch(err => {
  console.error('Erreur de connexion PostgreSQL:', err);
}); 