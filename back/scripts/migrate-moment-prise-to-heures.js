const { sequelize } = require('../config/database');
const { PrescriptionMedicament, ConsultationMedicament } = require('../models');

/**
 * Script de migration pour convertir momentPrise en champs d'heures de prise
 * 
 * Ce script :
 * 1. Récupère tous les médicaments avec momentPrise
 * 2. Convertit les moments en heures par défaut
 * 3. Met à jour les enregistrements avec les nouveaux champs
 * 4. Supprime l'ancien champ momentPrise
 */

// Mapping des moments vers les heures par défaut
const MOMENT_TO_HEURE_MAPPING = {
  'matin': '08:00',
  'midi': '12:00', 
  'soir': '20:00',
  'nuit': '22:00'
};

async function migratePrescriptionMedicaments() {
  console.log('🔄 Migration des PrescriptionMedicaments...');
  
  try {
    // Récupérer tous les médicaments de prescription avec momentPrise
    const medicaments = await PrescriptionMedicament.findAll({
      where: {
        momentPrise: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    });

    console.log(`📊 Trouvé ${medicaments.length} médicaments de prescription à migrer`);

    for (const medicament of medicaments) {
      const moments = medicament.momentPrise || [];
      const updates = {};

      // Convertir chaque moment en heure
      moments.forEach(moment => {
        const heure = MOMENT_TO_HEURE_MAPPING[moment];
        if (heure) {
          switch (moment) {
            case 'matin':
              updates.heurePriseMatin = heure;
              break;
            case 'midi':
              updates.heurePriseMidi = heure;
              break;
            case 'soir':
              updates.heurePriseSoir = heure;
              break;
            case 'nuit':
              updates.heurePriseNuit = heure;
              break;
          }
        }
      });

      // Mettre à jour l'enregistrement
      if (Object.keys(updates).length > 0) {
        await medicament.update(updates);
        console.log(`✅ Migré médicament ID ${medicament.id}: ${moments.join(', ')} → ${Object.values(updates).join(', ')}`);
      }
    }

    console.log('✅ Migration des PrescriptionMedicaments terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des PrescriptionMedicaments:', error);
    throw error;
  }
}

async function migrateConsultationMedicaments() {
  console.log('🔄 Migration des ConsultationMedicaments...');
  
  try {
    // Récupérer tous les médicaments de consultation avec momentPrise
    const medicaments = await ConsultationMedicament.findAll({
      where: {
        momentPrise: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    });

    console.log(`📊 Trouvé ${medicaments.length} médicaments de consultation à migrer`);

    for (const medicament of medicaments) {
      const moments = medicament.momentPrise || [];
      const updates = {};

      // Convertir chaque moment en heure
      moments.forEach(moment => {
        const heure = MOMENT_TO_HEURE_MAPPING[moment];
        if (heure) {
          switch (moment) {
            case 'matin':
              updates.heurePriseMatin = heure;
              break;
            case 'midi':
              updates.heurePriseMidi = heure;
              break;
            case 'soir':
              updates.heurePriseSoir = heure;
              break;
            case 'nuit':
              updates.heurePriseNuit = heure;
              break;
          }
        }
      });

      // Mettre à jour l'enregistrement
      if (Object.keys(updates).length > 0) {
        await medicament.update(updates);
        console.log(`✅ Migré médicament ID ${medicament.id}: ${moments.join(', ')} → ${Object.values(updates).join(', ')}`);
      }
    }

    console.log('✅ Migration des ConsultationMedicaments terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des ConsultationMedicaments:', error);
    throw error;
  }
}

async function dropMomentPriseColumns() {
  console.log('🔄 Suppression des colonnes momentPrise...');
  
  try {
    // Supprimer la colonne momentPrise de prescription_medicaments
    await sequelize.query(`
      ALTER TABLE prescription_medicaments 
      DROP COLUMN IF EXISTS "momentPrise"
    `);
    console.log('✅ Colonne momentPrise supprimée de prescription_medicaments');

    // Supprimer la colonne momentPrise de consultation_medicaments
    await sequelize.query(`
      ALTER TABLE consultation_medicaments 
      DROP COLUMN IF EXISTS "momentPrise"
    `);
    console.log('✅ Colonne momentPrise supprimée de consultation_medicaments');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression des colonnes momentPrise:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Début de la migration momentPrise → heures de prise');
  console.log('=' .repeat(60));

  try {
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

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
    console.log('Les champs momentPrise ont été convertis en heures de prise spécifiques :');
    console.log('- Matin → 08:00');
    console.log('- Midi → 12:00');
    console.log('- Soir → 20:00');
    console.log('- Nuit → 22:00');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  migratePrescriptionMedicaments,
  migrateConsultationMedicaments,
  dropMomentPriseColumns
};
