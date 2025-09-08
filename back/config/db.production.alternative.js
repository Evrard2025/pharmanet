const { Sequelize } = require('sequelize');

// Configuration alternative pour la production avec PostgreSQL
// Cette version gère différents fournisseurs (Render, Aiven, Railway, etc.)

// Récupération des variables d'environnement
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_HOST_HERE',
  dbPort = process.env.DB_PORT || 5432;

// Configuration SSL flexible selon le fournisseur
const getSSLConfig = () => {
  // Si c'est Aiven, utiliser une configuration SSL stricte
  if (dbHost.includes('aiven') || dbHost.includes('avn')) {
    return {
      require: true,
      rejectUnauthorized: false, // Aiven utilise des certificats auto-signés
    };
  }
  
  // Pour Render, Railway, etc., utiliser SSL standard
  return {
    require: true,
    rejectUnauthorized: true,
  };
};

// Construire la chaîne de connexion avec SSL obligatoire
const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false, // Pas de logs en production
  dialectOptions: {
    ssl: getSSLConfig()
  },
  pool: {
    max: 10,
    min: 1,
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
    console.log('🔌 Tentative de connexion à PostgreSQL...');
    console.log('📍 Host:', dbHost);
    console.log('🔢 Port:', dbPort);
    console.log('🗄️  Database:', dbName);
    console.log('👤 User:', dbUser);
    console.log('🔗 Connection String:', connectionString.replace(dbPassword, '***'));
    
    // Test de connexion avec authentification
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL production établie avec succès.');
    
    // Importer les modèles pour définir les associations
    require('../models/index');
    
    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Modèles synchronisés avec la base de données production.');
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL production:', error.message);
    
    // Diagnostic détaillé des erreurs
    if (error.message.includes('no pg_hba.conf entry')) {
      console.error('🔍 Diagnostic: Problème d\'authentification SSL');
      console.error('💡 Solutions possibles:');
      console.error('   1. Vérifiez que votre base de données accepte les connexions SSL');
      console.error('   2. Essayez avec rejectUnauthorized: false');
      console.error('   3. Vérifiez les paramètres SSL de votre fournisseur');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔍 Diagnostic: Host introuvable');
      console.error('💡 Solution: Vérifiez l\'URL de votre base de données');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔍 Diagnostic: Connexion refusée');
      console.error('💡 Solution: Vérifiez le port et que le service est actif');
    } else if (error.message.includes('password authentication failed')) {
      console.error('🔍 Diagnostic: Authentification échouée');
      console.error('💡 Solution: Vérifiez le nom d\'utilisateur et le mot de passe');
    }
    
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
