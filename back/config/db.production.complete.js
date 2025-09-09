const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

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
  logging: false,
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
  },
  hooks: {
    beforeConnect: (config) => {
      console.log('🔒 Forçage SSL sur la connexion...');
      config.ssl = sslConfig;
      config.sslmode = 'require';
      config.ssl = true;
      config.ssl = {
        require: true,
        rejectUnauthorized: false
      };
      return config;
    },
    afterConnect: (connection) => {
      console.log('✅ Connexion SSL établie');
    }
  }
});

// Définir tous les modèles
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { len: [2, 50] }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { len: [2, 50] }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [6, 100] }
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
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
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
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicalHistory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emergencyPhone: {
    type: DataTypes.STRING(20),
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
  timestamps: true,
  indexes: [
    { fields: ['patientId'] },
    { fields: ['numeroConsultation'] },
    { fields: ['dateConsultation'] },
    { fields: ['statut'] },
    { fields: ['medecinConsultant'] }
  ]
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
  parametresSurveillance: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
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
  timestamps: true,
  indexes: [
    { fields: ['nomCommercial'] },
    { fields: ['dci'] },
    { fields: ['classeTherapeutique'] },
    { fields: ['statut'] }
  ]
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
  timestamps: true,
  indexes: [
    { fields: ['patientId'] },
    { fields: ['numeroPrescription'] },
    { fields: ['datePrescription'] },
    { fields: ['statut'] },
    { fields: ['medecinPrescripteur'] }
  ]
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
  parametres: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
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
  timestamps: true,
  indexes: [
    { fields: ['patientId'] },
    { fields: ['medicamentId'] },
    { fields: ['dateProchaineAnalyse'] },
    { fields: ['statut'] },
    { fields: ['typeSurveillance'] }
  ]
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

const connectDB = async () => {
  try {
    // Configuration spécifique pour Aiven PostgreSQL
    if (dbHost.includes('aivencloud.com')) {
      console.log('🔧 Configuration Aiven détectée - SSL permissif activé');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      // Forcer SSL au niveau global
      process.env.PGSSLMODE = 'require';
      process.env.PGSSLREQUIRE = 'true';
      
      // Configuration SSL globale pour toutes les connexions
      process.env.PGSSLCERT = '';
      process.env.PGSSLKEY = '';
      process.env.PGSSLROOTCERT = '';
      
      // Forcer SSL sur toutes les connexions PostgreSQL
      process.env.PGSSLMODE = 'require';
    }
    
    console.log('Tentative de connexion à PostgreSQL avec SSL...');
    console.log('Host:', dbHost);
    console.log('Port:', dbPort);
    console.log('Database:', dbName);
    console.log('User:', dbUser);
    console.log('SSL Config:', sslConfig);
    
    // Test de connexion avec authentification
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL production établie avec succès.');
    
    // Vérifier si les tables existent AVANT de charger les modèles
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', tables);
    
    console.log('✅ Tous les modèles créés avec l\'instance Sequelize');
    console.log('📋 Modèles disponibles:', [
      'User', 'Patient', 'Consultation', 'ConsultationMedicament',
      'Medicament', 'Prescription', 'PrescriptionMedicament', 'SurveillanceBiologique'
    ]);
    
    // Toujours forcer la recréation des tables pour éviter les conflits
    console.log('🔄 Recréation de toutes les tables pour éviter les conflits...');
    await sequelize.sync({ force: true });
    console.log('✅ Toutes les tables ont été recréées.');
    
    // Vérifier que les tables ont été créées
    const newTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables créées:', newTables);
    console.log('📊 Nombre de tables créées:', newTables.length);
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL production:', error.message);
    
    // Diagnostic des erreurs communes
    if (error.message.includes('self-signed certificate')) {
      console.error('🔍 Diagnostic: Certificat SSL auto-signé (Aiven)');
      console.error('💡 Solution: Configuration SSL permissive déjà appliquée');
      console.error('💡 Vérifiez que rejectUnauthorized: false est bien configuré');
    } else if (error.message.includes('no pg_hba.conf entry')) {
      console.error('🔍 Diagnostic: Problème d\'authentification SSL');
      console.error('💡 Solution: Vérifiez que votre base de données accepte les connexions SSL');
      console.error('💡 IP du serveur:', process.env.RENDER_EXTERNAL_HOSTNAME || 'non définie');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔍 Diagnostic: Host introuvable');
      console.error('💡 Solution: Vérifiez l\'URL de votre base de données');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔍 Diagnostic: Connexion refusée');
      console.error('💡 Solution: Vérifiez le port et que le service est actif');
    }
    
    process.exit(1);
  }
};

module.exports = { 
  sequelize, 
  connectDB,
  User,
  Patient,
  Consultation,
  ConsultationMedicament,
  Medicament,
  Prescription,
  PrescriptionMedicament,
  SurveillanceBiologique
};
