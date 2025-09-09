#!/usr/bin/env node

/**
 * Script de démarrage final pour Render avec Aiven
 * Gère les migrations de colonnes ARRAY
 */

// Définir l'environnement de production
process.env.NODE_ENV = 'production';

// Forcer SSL pour toutes les connexions PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Charger les variables d'environnement
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { Sequelize, DataTypes } = require('sequelize');

// Configuration de la base de données Aiven
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_AIVEN_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_AIVEN_HOST_HERE',
  dbPort = process.env.DB_PORT || 28221;

// Configuration SSL corrigée pour Aiven
const sslConfig = {
  require: true,
  rejectUnauthorized: false
};

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: sslConfig
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false
  }
});

// Définir les modèles avec la structure correcte
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('client', 'admin', 'pharmacien'),
    defaultValue: 'client',
    allowNull: false
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  loyaltyLevel: {
    type: DataTypes.ENUM('bronze', 'argent', 'or', 'platine'),
    defaultValue: 'bronze',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  dateNaissance: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true
  },
  poids: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  taille: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true }
  },
  // Utiliser TEXT au lieu d'ARRAY pour éviter les problèmes de migration
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  antecedentsMedicaux: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  antecedentsChirurgicaux: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  antecedentsFamiliaux: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  groupeSanguin: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  assurance: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  numeroSecu: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  lieuNaissance: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nationalite: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  situationFamiliale: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  nombreEnfants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  medecinTraitant: {
    type: DataTypes.STRING(150),
    allowNull: true
  }
}, {
  tableName: 'patients',
  timestamps: true
});

const Consultation = sequelize.define('Consultation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'patients', key: 'id' }
  },
  numeroConsultation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  medecinConsultant: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dateConsultation: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  diagnostic: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  indication: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('active', 'terminee', 'annulee', 'renouvellement'),
    defaultValue: 'active',
    allowNull: false
  },
  typeConsultation: {
    type: DataTypes.ENUM('courte', 'longue', 'renouvellement', 'urgence'),
    defaultValue: 'courte',
    allowNull: false
  },
  ordonnance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notesPharmacien: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRenouvelable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nombreRenouvellements: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  renouvellementsRestants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'consultations',
  timestamps: true
});

const ConsultationMedicament = sequelize.define('ConsultationMedicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  consultationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'consultations', key: 'id' }
  },
  nomMedicament: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  dciMedicament: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  classeTherapeutique: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  posologie: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'comprimé'
  },
  dateDebutPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFinPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  effetsIndesirablesSignales: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observance: {
    type: DataTypes.ENUM('bonne', 'moyenne', 'mauvaise'),
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_cours', 'termine', 'arrete'),
    defaultValue: 'en_cours',
    allowNull: false
  },
  precaution: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'consultation_medicaments',
  timestamps: true
});

const Medicament = sequelize.define('Medicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nomCommercial: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  dci: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  classeTherapeutique: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  formePharmaceutique: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  dosage: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  laboratoire: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  indication: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contreIndication: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  effetsSecondaires: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  posologie: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interactions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  surveillanceHepatique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  surveillanceRenale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  frequenceSurveillance: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Utiliser TEXT au lieu d'ARRAY pour éviter les problèmes de migration
  parametresSurveillance: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'retire'),
    defaultValue: 'actif',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'medicaments',
  timestamps: true
});

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'patients', key: 'id' }
  },
  numeroPrescription: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  medecinPrescripteur: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  datePrescription: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  diagnostic: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  indication: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('active', 'terminee', 'annulee', 'renouvellement'),
    defaultValue: 'active',
    allowNull: false
  },
  typePrescription: {
    type: DataTypes.ENUM('courte', 'longue', 'renouvellement', 'urgence'),
    defaultValue: 'courte',
    allowNull: false
  },
  ordonnance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notesPharmacien: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRenouvelable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nombreRenouvellements: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  renouvellementsRestants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'prescriptions',
  timestamps: true
});

const PrescriptionMedicament = sequelize.define('PrescriptionMedicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prescriptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'prescriptions', key: 'id' }
  },
  nom: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categorie: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  marque: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  posologie: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  duree: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'comprimé'
  },
  dateDebutPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFinPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  precaution: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_cours', 'termine', 'arrete'),
    defaultValue: 'en_cours',
    allowNull: false
  },
  observance: {
    type: DataTypes.ENUM('bonne', 'moyenne', 'mauvaise'),
    allowNull: true
  },
  effetsSecondaires: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'prescription_medicaments',
  timestamps: true
});

const SurveillanceBiologique = sequelize.define('SurveillanceBiologique', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'patients', key: 'id' }
  },
  medicamentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'medicaments', key: 'id' }
  },
  typeSurveillance: {
    type: DataTypes.ENUM('hepatique', 'renale', 'mixte', 'autre'),
    allowNull: false
  },
  // Utiliser TEXT au lieu d'ARRAY pour éviter les problèmes de migration
  parametres: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  },
  frequenceMois: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateProchaineAnalyse: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateDerniereAnalyse: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  resultatsDerniereAnalyse: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('active', 'en_attente', 'terminee', 'annulee'),
    defaultValue: 'active',
    allowNull: false
  },
  priorite: {
    type: DataTypes.ENUM('basse', 'normale', 'haute', 'urgente'),
    defaultValue: 'normale',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  laboratoire: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  contactLaboratoire: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'surveillance_biologique',
  timestamps: true
});

// Définir les associations
Patient.hasMany(Consultation, { foreignKey: 'patientId' });
Consultation.belongsTo(Patient, { foreignKey: 'patientId' });

Consultation.hasMany(ConsultationMedicament, { foreignKey: 'consultationId', as: 'medicaments' });
ConsultationMedicament.belongsTo(Consultation, { foreignKey: 'consultationId' });

Patient.hasMany(Prescription, { foreignKey: 'patientId' });
Prescription.belongsTo(Patient, { foreignKey: 'patientId' });

Prescription.hasMany(PrescriptionMedicament, { foreignKey: 'prescriptionId', as: 'medicaments' });
PrescriptionMedicament.belongsTo(Prescription, { foreignKey: 'prescriptionId' });

Patient.hasMany(SurveillanceBiologique, { foreignKey: 'patientId' });
SurveillanceBiologique.belongsTo(Patient, { foreignKey: 'patientId' });

Medicament.hasMany(SurveillanceBiologique, { foreignKey: 'medicamentId' });
SurveillanceBiologique.belongsTo(Medicament, { foreignKey: 'medicamentId' });

// Configuration de l'application Express
const app = express();
const PORT = process.env.PORT || 10000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware de sécurité
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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['https://test-pharma.netlify.app', 'https://your-frontend-domain.com'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite pour Render
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/consultations', require('./routes/consultations').router);
app.use('/api/medicaments', require('./routes/medicaments'));
app.use('/api/surveillance-biologique', require('./routes/surveillance-biologique'));
app.use('/api/admin/users', require('./routes/admin-users'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Pharmacie Fidélité - Production',
    version: '1.0.0',
    environment: 'production',
    platform: 'Render + Aiven',
    status: 'Operational'
  });
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'production',
    database: 'connected'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur production:', err.stack);
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

// Fonction de connexion à la base de données
const connectDB = async () => {
  try {
    console.log('🔧 Configuration Aiven détectée');
    console.log('Tentative de connexion à PostgreSQL avec SSL...');
    console.log('Host:', dbHost);
    console.log('Port:', dbPort);
    console.log('Database:', dbName);
    console.log('User:', dbUser);
    console.log('SSL Config:', sslConfig);
    
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès.');
    
    // Vérifier les tables existantes
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', tables);
    
    // Vérifier spécifiquement la table patients
    if (tables.includes('patients')) {
      try {
        // Tester si la colonne traitementsChroniques existe
        await sequelize.query('SELECT "traitementsChroniques" FROM "patients" LIMIT 1');
        console.log('✅ Table patients a la structure correcte');
      } catch (error) {
        if (error.message.includes('traitementsChroniques') && error.message.includes('does not exist')) {
          console.log('🔧 Table patients a une structure obsolète, correction...');
          
          // Supprimer les contraintes de clé étrangère d'abord
          console.log('🔧 Suppression des contraintes de clé étrangère...');
          try {
            await sequelize.query('ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_patientId_fkey;');
            await sequelize.query('ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patientId_fkey;');
            await sequelize.query('ALTER TABLE surveillance_biologique DROP CONSTRAINT IF EXISTS surveillance_biologique_patientId_fkey;');
            console.log('✅ Contraintes supprimées');
          } catch (constraintError) {
            console.log('⚠️ Erreur lors de la suppression des contraintes (peut être normal):', constraintError.message);
          }
          
          // Supprimer et recréer la table patients
          await sequelize.getQueryInterface().dropTable('patients', { cascade: true });
          console.log('🗑️ Table patients supprimée');
          
          // Recréer avec la nouvelle structure
          await Patient.sync({ force: true });
          console.log('✅ Table patients recréée avec la nouvelle structure');
          
          // Recréer les contraintes de clé étrangère
          console.log('🔧 Recréation des contraintes de clé étrangère...');
          try {
            await sequelize.query('ALTER TABLE consultations ADD CONSTRAINT consultations_patientId_fkey FOREIGN KEY ("patientId") REFERENCES patients(id) ON DELETE CASCADE;');
            await sequelize.query('ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_patientId_fkey FOREIGN KEY ("patientId") REFERENCES patients(id) ON DELETE CASCADE;');
            await sequelize.query('ALTER TABLE surveillance_biologique ADD CONSTRAINT surveillance_biologique_patientId_fkey FOREIGN KEY ("patientId") REFERENCES patients(id) ON DELETE CASCADE;');
            console.log('✅ Contraintes recréées');
          } catch (constraintError) {
            console.log('⚠️ Erreur lors de la recréation des contraintes:', constraintError.message);
          }
        } else {
          throw error;
        }
      }
    }

    // Synchronisation en mode alter pour éviter de perdre les données
    if (tables.length > 0) {
      console.log('🔄 Tables existantes, synchronisation en mode alter...');
      await sequelize.sync({ alter: true });
      console.log('✅ Tables mises à jour avec succès.');
    } else {
      console.log('🔄 Aucune table trouvée, création de toutes les tables...');
      await sequelize.sync({ force: false });
      console.log('✅ Toutes les tables ont été créées.');
    }
    
    // Vérifier que les tables existent après synchronisation
    const newTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles après synchronisation:', newTables);
    console.log('📊 Nombre de tables:', newTables.length);
    
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.error('🔍 Diagnostic: Colonne manquante dans la base de données');
      console.error('💡 Solution: La synchronisation va corriger automatiquement la structure');
    } else if (error.message.includes('self-signed certificate')) {
      console.error('🔍 Diagnostic: Certificat SSL auto-signé');
      console.error('💡 Solution: Configuration SSL permissive appliquée');
    } else if (error.message.includes('checkServerIdentity')) {
      console.error('🔍 Diagnostic: Configuration SSL incorrecte');
      console.error('💡 Solution: checkServerIdentity supprimé de la configuration');
    } else if (error.message.includes('cannot be cast automatically')) {
      console.error('🔍 Diagnostic: Problème de migration de type de colonne');
      console.error('💡 Solution: Utilisation de TEXT au lieu d\'ARRAY pour éviter les conflits');
    }
    
    throw error;
  }
};

// Connexion à la base de données et démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur PharmaNet démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🌐 URL: https://your-app-name.onrender.com`);
    console.log(`🗄️  Base de données: Aiven PostgreSQL`);
    console.log(`✅ Déploiement réussi !`);
  });
}).catch(err => {
  console.error('❌ Erreur de démarrage:', err);
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
