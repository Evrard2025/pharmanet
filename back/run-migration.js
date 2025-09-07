#!/usr/bin/env node

/**
 * Script pour exécuter la migration momentPrise → heures de prise
 * 
 * Usage: node run-migration.js
 */

const { migratePrescriptionMedicaments, migrateConsultationMedicaments, dropMomentPriseColumns } = require('./scripts/migrate-moment-prise-to-dates');

async function main() {
  console.log('🚀 Exécution de la migration momentPrise → dates de prise');
  console.log('=' .repeat(60));

  try {
    // Effectuer les migrations
    await migratePrescriptionMedicaments();
    await migrateConsultationMedicaments();
    
    // Demander confirmation avant de supprimer les colonnes
    console.log('\n⚠️  ATTENTION: Les colonnes momentPrise vont être supprimées définitivement');
    console.log('Cette action ne peut pas être annulée.');
    console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await dropMomentPriseColumns();

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('Les champs momentPrise ont été convertis en dates de prise :');
    console.log('- Date de début: basée sur la date de prescription/consultation');
    console.log('- Date de fin: calculée selon la durée du traitement');
    console.log('- Durées par défaut: 1-7 jours selon le type de prise');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

main();
