#!/usr/bin/env node

/**
 * Script pour créer immédiatement toutes les tables nécessaires
 * À exécuter sur Render si les tables ne sont pas créées
 */

// Définir l'environnement de production
process.env.NODE_ENV = 'production';

// Charger les variables d'environnement de production
require('dotenv').config({ path: '.env-production' });

const { Sequelize } = require('sequelize');

// Configuration pour la production avec PostgreSQL (Render/Aiven)
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_AIVEN_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_AIVEN_HOST_HERE',
  dbPort = process.env.DB_PORT || 28221;

// Configuration SSL ultra-robuste pour Aiven
const sslConfig = {
  require: true,
  rejectUnauthorized: false,
  checkServerIdentity: false
};

// Configuration Sequelize avec SSL forcé partout
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: console.log, // Activer les logs pour debug
  dialectOptions: {
    ssl: sslConfig,
    sslmode: 'require',
    application_name: 'pharmacie-fidelite-backend',
    ssl: true,
    sslmode: 'require',
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 10,
    min: 1,
    acquire: 30000,
    idle: 10000,
    ssl: sslConfig
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

async function createTables() {
  try {
    console.log('🔧 Configuration Aiven détectée - SSL permissif activé');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.PGSSLMODE = 'require';
    process.env.PGSSLREQUIRE = 'true';
    
    console.log('Tentative de connexion à PostgreSQL avec SSL...');
    console.log('Host:', dbHost);
    console.log('Port:', dbPort);
    console.log('Database:', dbName);
    console.log('User:', dbUser);
    
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès.');
    
    // Importer les modèles
    require('./models/index');
    console.log('✅ Modèles chargés.');
    
    // Vérifier les tables existantes
    const existingTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('🔄 Aucune table trouvée, création de toutes les tables...');
      await sequelize.sync({ force: true });
      console.log('✅ Toutes les tables ont été créées.');
    } else {
      console.log('🔄 Tables existantes, synchronisation en mode alter...');
      await sequelize.sync({ force: false, alter: true });
      console.log('✅ Tables mises à jour.');
    }
    
    // Vérifier les tables après création
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles après migration:', tables);
    
    // Lister les colonnes de la table users si elle existe
    if (tables.includes('users')) {
      const userColumns = await sequelize.getQueryInterface().describeTable('users');
      console.log('📋 Colonnes de la table users:', Object.keys(userColumns));
    }
    
    await sequelize.close();
    console.log('✅ Création des tables terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    process.exit(1);
  }
}

createTables();
