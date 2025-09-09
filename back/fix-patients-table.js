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
    logging: console.log,
    dialectOptions: sslConfig ? { ssl: sslConfig } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const fixPatientsTable = async () => {
  try {
    console.log('🔧 Configuration détectée');
    console.log(`📊 Host: ${dbHost}`);
    console.log(`📊 Port: ${dbPort}`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`📊 User: ${dbUser}`);
    console.log(`📊 SSL: ${sslConfig ? 'Activé' : 'Désactivé'}`);

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès.');

    // Vérifier les tables existantes
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', tables);

    // Supprimer la table patients si elle existe
    if (tables.includes('patients')) {
      console.log('🗑️ Suppression de la table patients existante...');
      await sequelize.getQueryInterface().dropTable('patients');
      console.log('✅ Table patients supprimée.');
    }

    // Importer le modèle Patient avec la nouvelle structure
    const Patient = require('./models/Patient');
    console.log('📋 Modèle Patient chargé');

    // Créer la table patients avec la nouvelle structure
    console.log('🔄 Création de la table patients avec la nouvelle structure...');
    await Patient.sync({ force: true });
    console.log('✅ Table patients créée avec succès.');

    // Vérifier la structure de la table
    const tableDescription = await sequelize.getQueryInterface().describeTable('patients');
    console.log('📋 Structure de la table patients:');
    Object.keys(tableDescription).forEach(column => {
      console.log(`  - ${column}: ${tableDescription[column].type}`);
    });

    console.log('🎉 Table patients corrigée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction de la table patients:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Connexion fermée.');
  }
};

fixPatientsTable();
