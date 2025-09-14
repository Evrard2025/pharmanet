#!/usr/bin/env node

/**
 * Script de démarrage silencieux pour le développement
 * Affiche seulement les messages essentiels
 */

// Charger les variables d'environnement
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { connectDB, sequelize } = require('./config/db');

// Désactiver complètement les logs SQL
sequelize.options.logging = false;

const app = express();
const PORT = 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware de sécurité (moins strict pour le développement)
app.use(helmet({
  contentSecurityPolicy: false // Désactiver CSP pour le développement
}));

// CORS configuration pour le développement
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre toutes les origines en développement
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging minimal
app.use(morgan('tiny'));

// Rate limiting permissif pour le développement
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // Limite élevée pour le développement
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/medicaments', require('./routes/medicaments'));
app.use('/api/surveillance-biologique', require('./routes/surveillance-biologique'));
app.use('/api/admin/users', require('./routes/admin-users'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API PharmaNet - Backend de développement',
    environment: 'development',
    port: PORT,
    cors: 'enabled for localhost:3000'
  });
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({ 
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

// Connexion PostgreSQL et démarrage du serveur
connectDB().then(async () => {
  try {
    // Importer les modèles pour définir les associations
    const { User, Patient, Consultation, ConsultationMedicament, Medicament, SurveillanceBiologique } = require('./models/index');
    
    // Synchronisation silencieuse
    await sequelize.sync({ force: false, alter: false });
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🌐 CORS activé pour http://localhost:3000`);
      console.log(`📝 Logs SQL désactivés`);
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Erreur de connexion:', err.message);
  process.exit(1);
});
