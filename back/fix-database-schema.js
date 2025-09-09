#!/usr/bin/env node

/**
 * Script de correction de la structure de la base de données
 * Résout les problèmes de colonnes manquantes et de synchronisation
 */

// Définir l'environnement de production
process.env.NODE_ENV = 'production';

// Charger les variables d'environnement de production
require('dotenv').config({ path: '.env-production' });

const { Sequelize, DataTypes } = require('sequelize');

// Configuration pour la production avec PostgreSQL (Aiven)
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_AIVEN_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_AIVEN_HOST_HERE',
  dbPort = process.env.DB_PORT || 28221;

// Configuration SSL pour Aiven
const sslConfig = {
  require: true,
  rejectUnauthorized: false,
  checkServerIdentity: false
};

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false, // Désactiver les logs pour la production
  dialectOptions: {
    ssl: sslConfig
  },
  define: {
    timestamps: true,
    underscored: false // Utiliser camelCase pour les noms de colonnes
  }
});

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Correction de la structure de la base de données...');
    console.log('====================================================');
    
    // Connexion
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    // Vérifier les tables existantes
    const existingTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', existingTables);
    
    // Supprimer toutes les tables existantes pour repartir à zéro
    console.log('\n🗑️  Suppression des tables existantes...');
    for (const tableName of existingTables) {
      try {
        await sequelize.getQueryInterface().dropTable(tableName, { cascade: true });
        console.log(`  ✅ Table ${tableName} supprimée`);
      } catch (error) {
        console.log(`  ⚠️  Erreur lors de la suppression de ${tableName}: ${error.message}`);
      }
    }
    
    // Créer les tables avec la structure correcte
    console.log('\n🏗️  Création des tables avec la structure correcte...');
    
    // 1. Table users
    await sequelize.getQueryInterface().createTable('users', {
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
        unique: true
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table users créée');
    
    // 2. Table patients
    await sequelize.getQueryInterface().createTable('patients', {
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
        allowNull: true
      },
      allergies: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      antecedentsMedicaux: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      antecedentsChirurgicaux: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      antecedentsFamiliaux: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table patients créée');
    
    // 3. Table consultations
    await sequelize.getQueryInterface().createTable('consultations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        }
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table consultations créée');
    
    // 4. Table consultation_medicaments
    await sequelize.getQueryInterface().createTable('consultation_medicaments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      consultationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'consultations',
          key: 'id'
        }
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table consultation_medicaments créée');
    
    // 5. Table medicaments
    await sequelize.getQueryInterface().createTable('medicaments', {
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table medicaments créée');
    
    // 6. Table prescriptions
    await sequelize.getQueryInterface().createTable('prescriptions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        }
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table prescriptions créée');
    
    // 7. Table prescription_medicaments
    await sequelize.getQueryInterface().createTable('prescription_medicaments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      prescriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'prescriptions',
          key: 'id'
        }
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table prescription_medicaments créée');
    
    // 8. Table surveillance_biologique
    await sequelize.getQueryInterface().createTable('surveillance_biologique', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        }
      },
      medicamentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'medicaments',
          key: 'id'
        }
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('  ✅ Table surveillance_biologique créée');
    
    // Créer les index
    console.log('\n📊 Création des index...');
    
    // Index pour consultations
    await sequelize.getQueryInterface().addIndex('consultations', ['patientId']);
    await sequelize.getQueryInterface().addIndex('consultations', ['numeroConsultation']);
    await sequelize.getQueryInterface().addIndex('consultations', ['dateConsultation']);
    await sequelize.getQueryInterface().addIndex('consultations', ['statut']);
    await sequelize.getQueryInterface().addIndex('consultations', ['medecinConsultant']);
    
    // Index pour prescriptions
    await sequelize.getQueryInterface().addIndex('prescriptions', ['patientId']);
    await sequelize.getQueryInterface().addIndex('prescriptions', ['numeroPrescription']);
    await sequelize.getQueryInterface().addIndex('prescriptions', ['datePrescription']);
    await sequelize.getQueryInterface().addIndex('prescriptions', ['statut']);
    await sequelize.getQueryInterface().addIndex('prescriptions', ['medecinPrescripteur']);
    
    // Index pour medicaments
    await sequelize.getQueryInterface().addIndex('medicaments', ['nomCommercial']);
    await sequelize.getQueryInterface().addIndex('medicaments', ['dci']);
    await sequelize.getQueryInterface().addIndex('medicaments', ['classeTherapeutique']);
    await sequelize.getQueryInterface().addIndex('medicaments', ['statut']);
    
    // Index pour surveillance_biologique
    await sequelize.getQueryInterface().addIndex('surveillance_biologique', ['patientId']);
    await sequelize.getQueryInterface().addIndex('surveillance_biologique', ['medicamentId']);
    await sequelize.getQueryInterface().addIndex('surveillance_biologique', ['dateProchaineAnalyse']);
    await sequelize.getQueryInterface().addIndex('surveillance_biologique', ['statut']);
    await sequelize.getQueryInterface().addIndex('surveillance_biologique', ['typeSurveillance']);
    
    console.log('  ✅ Index créés');
    
    // Vérifier que toutes les tables ont été créées
    const finalTables = await sequelize.getQueryInterface().showAllTables();
    console.log('\n📋 Tables créées:', finalTables);
    console.log('📊 Nombre de tables:', finalTables.length);
    
    await sequelize.close();
    console.log('\n✅ Correction de la base de données terminée avec succès !');
    console.log('🚀 Vous pouvez maintenant redémarrer votre application.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixDatabaseSchema();
