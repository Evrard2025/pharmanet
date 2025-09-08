#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion à la base de données
 * Usage: node test-db-connection.js
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '.env-production' });

const { connectDB } = require('./config/db.production');

console.log('🧪 Test de connexion à la base de données PostgreSQL...');
console.log('📋 Variables d\'environnement:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_PORT:', process.env.DB_PORT);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NON DÉFINI');

// Test de connexion
connectDB()
  .then(() => {
    console.log('🎉 Test de connexion réussi !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test de connexion échoué:', error.message);
    process.exit(1);
  });
