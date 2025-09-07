const { Sequelize } = require('sequelize');

// Configuration pour la production avec Aiven PostgreSQL
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_AIVEN_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_AIVEN_HOST_HERE',
  dbPort = process.env.DB_PORT || 28221;

// Construire la chaîne de connexion avec SSL
const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false, // Pas de logs en production
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 20, // Limite de connexion Aiven
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

const connectDB = async () => {
  try {
    console.log('Tentative de connexion à PostgreSQL...');
    console.log('Host:', dbHost);
    console.log('Port:', dbPort);
    console.log('Database:', dbName);
    console.log('User:', dbUser);
    console.log('Connection String:', connectionString.replace(dbPassword, '***'));
    
    await sequelize.authenticate();
    console.log('Connexion PostgreSQL production établie avec succès.');
    
    // Importer les modèles pour définir les associations
    require('../models/index');
    
    // Synchroniser les modèles avec la base de données (force: false pour éviter les conflits)
    await sequelize.sync({ force: false, alter: false });
    console.log('Modèles synchronisés avec la base de données production.');
  } catch (error) {
    console.error('Erreur de connexion PostgreSQL production:', error);
    console.error('Détails de l\'erreur:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
