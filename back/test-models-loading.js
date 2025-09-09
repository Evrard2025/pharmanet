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

const testModelsLoading = async () => {
  try {
    console.log('🧪 Test de chargement des modèles...');
    console.log(`📊 Host: ${dbHost}`);
    console.log(`📊 Port: ${dbPort}`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`📊 User: ${dbUser}`);
    console.log(`📊 SSL: ${sslConfig ? 'Activé' : 'Désactivé'}`);

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès.');

    // Charger les modèles
    console.log('📋 Chargement des modèles...');
    const User = require('./models/User');
    const Patient = require('./models/Patient');
    const Medicament = require('./models/Medicament');
    const Prescription = require('./models/Prescription');
    const Consultation = require('./models/Consultation');
    const SurveillanceBiologique = require('./models/SurveillanceBiologique');
    console.log('✅ Modèles chargés');

    // Vérifier que les modèles sont bien attachés à sequelize
    console.log('🔍 Vérification des modèles...');
    console.log('User model:', User.name);
    console.log('Patient model:', Patient.name);
    console.log('Medicament model:', Medicament.name);
    console.log('Prescription model:', Prescription.name);
    console.log('Consultation model:', Consultation.name);
    console.log('SurveillanceBiologique model:', SurveillanceBiologique.name);

    // Vérifier les tables existantes
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', tables);

    if (tables.length === 0) {
      console.log('🔄 Aucune table trouvée, création de toutes les tables...');
      await sequelize.sync({ force: true });
      console.log('✅ Toutes les tables ont été créées.');
    } else {
      console.log('✅ Tables existantes trouvées');
    }

    // Vérifier les tables après synchronisation
    const newTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles après synchronisation:', newTables);
    console.log('📊 Nombre de tables:', newTables.length);

    // Tester la création d'un patient
    if (newTables.includes('patients')) {
      console.log('🧪 Test de création d\'un patient...');
      try {
        const testPatient = await Patient.create({
          firstName: 'Test',
          lastName: 'Patient',
          dateNaissance: '1990-01-01',
          sexe: 'M',
          poids: 70,
          taille: 175,
          traitementsChroniques: ['Aspirine'],
          traitementsPonctuels: ['Paracétamol'],
          allergies: ['Pénicilline']
        });
        console.log('✅ Patient créé avec succès:', testPatient.id);
        
        // Supprimer le patient de test
        await testPatient.destroy();
        console.log('✅ Patient de test supprimé');
      } catch (error) {
        console.error('❌ Erreur lors de la création du patient:', error.message);
      }
    }

    console.log('🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Connexion fermée.');
  }
};

testModelsLoading();
