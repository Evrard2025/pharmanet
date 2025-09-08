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
    
    // Créer les modèles directement avec cette instance Sequelize
    const { DataTypes } = require('sequelize');
    const bcrypt = require('bcryptjs');
    
    // Modèle User
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [2, 50]
        }
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [2, 50]
        }
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 100]
        }
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
    
    // Modèle Patient
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
        validate: {
          isEmail: true
        }
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
    
    console.log('✅ Modèles créés directement avec l\'instance Sequelize');
    
    // Si aucune table n'existe, forcer la création
    if (tables.length === 0) {
      console.log('🔄 Aucune table trouvée, création de toutes les tables...');
      await sequelize.sync({ force: true });
      console.log('✅ Toutes les tables ont été créées.');
      
      // Vérifier que les tables ont été créées
      const newTables = await sequelize.getQueryInterface().showAllTables();
      console.log('📋 Tables créées:', newTables);
    } else {
      console.log('🔄 Tables existantes, synchronisation en mode alter...');
      await sequelize.sync({ force: false, alter: true });
      console.log('✅ Modèles synchronisés avec la base de données production.');
    }
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
