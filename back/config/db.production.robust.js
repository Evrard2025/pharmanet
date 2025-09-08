const { Sequelize } = require('sequelize');

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
    // Configuration SSL supplémentaire
    ssl: true,
    sslmode: 'require',
    // Forcer SSL au niveau du driver
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
    // Configuration SSL pour le pool
    ssl: sslConfig
  },
  define: {
    timestamps: true,
    underscored: true
  },
  // Hooks pour forcer SSL sur toutes les connexions
  hooks: {
    beforeConnect: (config) => {
      console.log('🔒 Forçage SSL sur la connexion...');
      // Forcer SSL à tous les niveaux
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
    
    // Importer les modèles pour définir les associations
    require('../models/index');
    
    // Synchroniser les modèles avec la base de données (alter: true pour créer les tables manquantes)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Modèles synchronisés avec la base de données production.');
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

module.exports = { sequelize, connectDB };
