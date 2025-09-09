const { Sequelize, DataTypes } = require('sequelize');

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

const debugTableCreation = async () => {
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

    if (tables.length === 0) {
      console.log('🔧 Aucune table trouvée, création de toutes les tables...');
      
      // Importer tous les modèles
      const User = require('./models/User');
      const Patient = require('./models/Patient');
      const Medicament = require('./models/Medicament');
      const Prescription = require('./models/Prescription');
      const Consultation = require('./models/Consultation');
      const SurveillanceBiologique = require('./models/SurveillanceBiologique');
      
      console.log('📋 Modèles chargés');
      
      // Créer toutes les tables
      await sequelize.sync({ force: true });
      console.log('✅ Toutes les tables ont été créées.');
    } else {
      console.log('✅ Tables existantes trouvées');
    }

    // Vérifier les tables après création
    const newTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles après synchronisation:', newTables);
    console.log('📊 Nombre de tables:', newTables.length);

    // Vérifier la structure de la table patients
    if (newTables.includes('patients')) {
      const tableDescription = await sequelize.getQueryInterface().describeTable('patients');
      console.log('📋 Structure de la table patients:');
      Object.keys(tableDescription).forEach(column => {
        console.log(`  - ${column}: ${tableDescription[column].type}`);
      });
    }

    console.log('🎉 Diagnostic terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Connexion fermée.');
  }
};

debugTableCreation();
