const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Sequelize, DataTypes } = require('sequelize');

// Forcer SSL pour toutes les connexions PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la base de données
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

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://test-pharma.netlify.app',
    'https://pharmanet.netlify.app',
    'https://pharmanet-frontend.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'PharmaNet API - Backend opérationnel',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fonction pour ajouter les colonnes manquantes à la table patients
const addMissingColumnsToPatients = async () => {
  try {
    console.log('🔧 Vérification des colonnes manquantes dans la table patients...');
    
    // Liste des colonnes à ajouter
    const columnsToAdd = [
      { name: 'traitementsChroniques', type: 'TEXT DEFAULT \'[]\'' },
      { name: 'traitementsPonctuels', type: 'TEXT DEFAULT \'[]\'' },
      { name: 'allergies', type: 'TEXT DEFAULT \'[]\'' },
      { name: 'antecedentsMedicaux', type: 'TEXT DEFAULT \'[]\'' },
      { name: 'antecedentsChirurgicaux', type: 'TEXT DEFAULT \'[]\'' },
      { name: 'antecedentsFamiliaux', type: 'TEXT DEFAULT \'[]\'' }
    ];

    for (const column of columnsToAdd) {
      try {
        // Vérifier si la colonne existe
        await sequelize.query(`SELECT "${column.name}" FROM "patients" LIMIT 1`);
        console.log(`✅ Colonne ${column.name} existe déjà`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`🔧 Ajout de la colonne ${column.name}...`);
          await sequelize.query(`ALTER TABLE "patients" ADD COLUMN "${column.name}" ${column.type};`);
          console.log(`✅ Colonne ${column.name} ajoutée`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Toutes les colonnes manquantes ont été ajoutées à la table patients');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error.message);
    throw error;
  }
};

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
    
    // Ajouter les colonnes manquantes à la table patients
    if (tables.includes('patients')) {
      await addMissingColumnsToPatients();
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
    } else if (error.message.includes('SSL')) {
      console.error('🔍 Diagnostic: Problème de connexion SSL');
      console.error('💡 Solution: Vérifiez la configuration SSL');
    } else if (error.message.includes('authentication')) {
      console.error('🔍 Diagnostic: Problème d\'authentification');
      console.error('💡 Solution: Vérifiez les identifiants de connexion');
    }
    
    process.exit(1);
  }
};

// Fonction pour charger les routes
const loadRoutes = () => {
  try {
    console.log('🔄 Chargement des routes...');
    
    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/patients', require('./routes/patients'));
    app.use('/api/medicaments', require('./routes/medicaments'));
    app.use('/api/prescriptions', require('./routes/prescriptions'));
    app.use('/api/consultations', require('./routes/consultations'));
    app.use('/api/surveillance-biologique', require('./routes/surveillance-biologique'));
    app.use('/api/dashboard', require('./routes/dashboard'));
    app.use('/api/loyalty', require('./routes/loyalty'));
    app.use('/api/admin-users', require('./routes/admin-users'));

    // Gestion des routes non trouvées
    app.use('*', (req, res) => {
      res.status(404).json({ 
        message: 'Route non trouvée',
        path: req.originalUrl
      });
    });
    
    console.log('✅ Routes chargées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du chargement des routes:', error);
    throw error;
  }
};

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    loadRoutes();
    
    app.listen(PORT, () => {
      console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
      console.log(`🗄️  Base de données: ${process.env.NODE_ENV === 'production' ? 'Aiven PostgreSQL' : 'PostgreSQL Local'}`);
      console.log(`✅ Déploiement réussi !`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
};

startServer();
