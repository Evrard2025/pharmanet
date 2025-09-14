const { Sequelize } = require('sequelize');

// Forcer SSL pour toutes les connexions PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbName = process.env.DB_NAME || 'pharmacie',
  dbUser = process.env.DB_USER || 'postgres',
  dbPassword = process.env.DB_PASSWORD || '2023',
  dbHost = process.env.DB_HOST || 'localhost',
  dbPort = process.env.DB_PORT || 5432;

// Configuration SSL pour Aiven (si en production)
const sslConfig = process.env.NODE_ENV === 'production' ? {
  require: true,
  rejectUnauthorized: false
} : false;

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: false, // Désactiver les logs SQL pour réduire le bruit
    dialectOptions: sslConfig ? { ssl: sslConfig } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion PostgreSQL établie avec succès.');
    
    // Importer les modèles pour définir les associations
    require('../models/index');
    
    // Ne pas synchroniser automatiquement - laisser start-final-v2.js gérer cela
    console.log('Modèles chargés, synchronisation gérée par start-final-v2.js');
  } catch (error) {
    console.error('Erreur de connexion PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 