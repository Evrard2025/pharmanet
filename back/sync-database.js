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

const syncDatabase = async () => {
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

    // Importer tous les modèles
    const User = require('./models/User');
    const Patient = require('./models/Patient');
    const Consultation = require('./models/Consultation');
    const Medicament = require('./models/Medicament');
    const Prescription = require('./models/Prescription');
    const SurveillanceBiologique = require('./models/SurveillanceBiologique');

    console.log('📋 Modèles chargés');

    // Forcer la synchronisation avec alter: true
    console.log('🔄 Synchronisation forcée de la base de données...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Base de données synchronisée avec succès.');

    // Vérifier les tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles:', tables);

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Connexion fermée.');
  }
};

syncDatabase();
