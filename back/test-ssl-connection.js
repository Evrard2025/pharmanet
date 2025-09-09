#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion SSL PostgreSQL
 */

// Forcer SSL pour toutes les connexions PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuration de la base de données Aiven
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_AIVEN_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_AIVEN_HOST_HERE',
  dbPort = process.env.DB_PORT || 28221;

// Configuration SSL pour Aiven
const sslConfig = {
  require: true,
  rejectUnauthorized: false
};

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: sslConfig
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function testConnection() {
  try {
    console.log('🔧 Test de connexion SSL PostgreSQL...');
    console.log('Host:', dbHost);
    console.log('Port:', dbPort);
    console.log('Database:', dbName);
    console.log('User:', dbUser);
    console.log('SSL Config:', sslConfig);
    
    // Test de connexion initiale
    await sequelize.authenticate();
    console.log('✅ Connexion initiale réussie');
    
    // Test de requête simple
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Requête test réussie:', result[0][0]);
    
    // Test de reconnexion (simuler une requête API)
    console.log('🔄 Test de reconnexion...');
    await sequelize.close();
    await sequelize.authenticate();
    console.log('✅ Reconnexion réussie');
    
    // Test de requête après reconnexion
    const result2 = await sequelize.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('✅ Requête après reconnexion réussie:', result2[0][0]);
    
    console.log('🎉 Tous les tests SSL ont réussi !');
    
  } catch (error) {
    console.error('❌ Erreur de test SSL:', error.message);
    console.error('Détails:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testConnection();
