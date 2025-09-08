#!/usr/bin/env node

/**
 * Script de migration pour créer toutes les tables nécessaires
 */

// Définir l'environnement de production
process.env.NODE_ENV = 'production';

// Charger les variables d'environnement de production
require('dotenv').config({ path: '.env-production' });

const { connectDB, sequelize } = require('./config/db.production.robust');

console.log('🔄 Migration des tables de base de données...');
console.log('==============================================');

connectDB()
  .then(async () => {
    console.log('✅ Connexion établie, création des tables...');
    
    // Forcer la création de toutes les tables
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Toutes les tables ont été créées/mises à jour.');
    
    // Vérifier que les tables existent
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles:', tables);
    
    await sequelize.close();
    console.log('✅ Migration terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  });
