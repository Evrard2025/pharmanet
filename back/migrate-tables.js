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
    console.log('✅ Connexion établie, vérification des tables...');
    
    // Vérifier les tables existantes
    const existingTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('🔄 Aucune table trouvée, création de toutes les tables...');
      await sequelize.sync({ force: true });
      console.log('✅ Toutes les tables ont été créées.');
    } else {
      console.log('🔄 Tables existantes, synchronisation en mode alter...');
      await sequelize.sync({ force: false, alter: true });
      console.log('✅ Tables mises à jour.');
    }
    
    // Vérifier que les tables existent après migration
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles après migration:', tables);
    
    await sequelize.close();
    console.log('✅ Migration terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  });
