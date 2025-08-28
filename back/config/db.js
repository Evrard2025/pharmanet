const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME || 'pharmacie',
  dbUser = process.env.DB_USER || 'postgres',
  dbPassword = process.env.DB_PASSWORD || '2023',
  dbHost = process.env.DB_HOST || 'localhost',
  dbPort = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion PostgreSQL établie avec succès.');
    
    // Importer les modèles pour définir les associations
    require('../models/index');
    
    // Synchroniser les modèles avec la base de données (force: false pour éviter les conflits)
    await sequelize.sync({ force: false, alter: false });
    console.log('Modèles synchronisés avec la base de données.');
  } catch (error) {
    console.error('Erreur de connexion PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 