#!/usr/bin/env node

/**
 * Script de diagnostic de la structure de la base de données
 * Pour identifier les problèmes de colonnes manquantes
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
  logging: console.log, // Activer les logs SQL pour diagnostic
  dialectOptions: {
    ssl: sslConfig
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Diagnostic de la structure de la base de données...');
    console.log('==================================================');
    
    // Connexion
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    // Lister toutes les tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('\n📋 Tables existantes:', tables);
    
    // Vérifier la structure de chaque table
    for (const tableName of tables) {
      console.log(`\n🔍 Structure de la table: ${tableName}`);
      console.log('─'.repeat(50));
      
      try {
        const tableInfo = await sequelize.getQueryInterface().describeTable(tableName);
        console.log('Colonnes:');
        Object.keys(tableInfo).forEach(columnName => {
          const column = tableInfo[columnName];
          console.log(`  - ${columnName}: ${column.type} ${column.allowNull ? '(nullable)' : '(NOT NULL)'}`);
        });
      } catch (error) {
        console.error(`❌ Erreur lors de la description de ${tableName}:`, error.message);
      }
    }
    
    // Vérifier spécifiquement les tables problématiques
    console.log('\n🔍 Vérification spécifique des tables avec patientId...');
    console.log('─'.repeat(60));
    
    const problematicTables = ['consultations', 'prescriptions', 'surveillance_biologique'];
    
    for (const tableName of problematicTables) {
      if (tables.includes(tableName)) {
        console.log(`\n📊 Table: ${tableName}`);
        try {
          const tableInfo = await sequelize.getQueryInterface().describeTable(tableName);
          const hasPatientId = tableInfo.patientId || tableInfo.patient_id;
          console.log(`  - patientId présent: ${!!hasPatientId}`);
          if (hasPatientId) {
            console.log(`  - Type patientId: ${hasPatientId.type}`);
            console.log(`  - Nullable: ${hasPatientId.allowNull}`);
          } else {
            console.log('  - Colonnes disponibles:', Object.keys(tableInfo));
          }
        } catch (error) {
          console.error(`  ❌ Erreur: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  Table ${tableName} n'existe pas`);
      }
    }
    
    // Vérifier les contraintes de clés étrangères
    console.log('\n🔍 Vérification des contraintes de clés étrangères...');
    console.log('─'.repeat(60));
    
    try {
      const foreignKeys = await sequelize.getQueryInterface().showConstraints('consultations');
      console.log('Contraintes sur consultations:', foreignKeys);
    } catch (error) {
      console.log('Aucune contrainte trouvée ou erreur:', error.message);
    }
    
    await sequelize.close();
    console.log('\n✅ Diagnostic terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkDatabaseStructure();
