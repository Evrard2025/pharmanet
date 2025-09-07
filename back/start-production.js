#!/usr/bin/env node

/**
 * Script de démarrage pour la production
 * Utilise la configuration de production avec Aiven PostgreSQL
 */

// Définir l'environnement de production
process.env.NODE_ENV = 'production';

// Charger les variables d'environnement de production
require('dotenv').config({ path: '.env-production' });

// Importer et démarrer le serveur
const { connectDB } = require('./config/db.production');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware de sécurité renforcé pour la production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration pour la production
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['https://your-frontend-domain.com'];
    
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

// Logging en production (plus discret)
app.use(morgan('combined'));

// Rate limiting plus strict en production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limite plus stricte en production
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
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
  res.json({ 
    message: 'API Pharmacie Fidélité - Production',
    version: '1.0.0',
    environment: 'production'
  });
});

// Endpoint de santé pour le déploiement
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'production',
    database: 'connected'
  });
});

// Gestion des erreurs en production
app.use((err, req, res, next) => {
  console.error('Erreur production:', err.stack);
  
  // Ne pas exposer les détails d'erreur en production
  res.status(500).json({ 
    message: 'Erreur serveur interne',
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Connexion PostgreSQL et démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur de production démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Base de données: ${process.env.DB_HOST}`);
  });
}).catch(err => {
  console.error('❌ Erreur de connexion PostgreSQL:', err);
  process.exit(1);
});

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, fermeture du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, fermeture du serveur...');
  process.exit(0);
});