const { sequelize } = require('../config/database');
const { PrescriptionMedicament, ConsultationMedicament } = require('../models');

/**
 * Script de migration pour convertir momentPrise en champs de dates de prise
 * 
 * Ce script :
 * 1. Récupère tous les médicaments avec momentPrise
 * 2. Convertit les moments en dates de début et fin basées sur la date de prescription
 * 3. Met à jour les enregistrements avec les nouveaux champs
 * 4. Supprime l'ancien champ momentPrise
 */

// Durées par défaut pour chaque moment de prise (en jours)
const MOMENT_DUREE_MAPPING = {
  'matin': 1,      // 1 jour
  'midi': 1,       // 1 jour  
  'soir': 1,       // 1 jour
  'nuit': 1,       // 1 jour
  'quotidien': 7,  // 1 semaine
  'toutes_les_8h': 3,  // 3 jours
  'toutes_les_12h': 5, // 5 jours
  'avant_repas': 1,    // 1 jour
  'apres_repas': 1,    // 1 jour
  'a_jeun': 1          // 1 jour
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
      },
      include: [{
        model: require('../models').Prescription,
        attributes: ['datePrescription']
      }]
    });

    console.log(`📊 Trouvé ${medicaments.length} médicaments de prescription à migrer`);

    for (const medicament of medicaments) {
      const moments = medicament.momentPrise || [];
      const updates = {};

      // Utiliser la date de prescription comme date de début
      const dateDebut = new Date(medicament.Prescription?.datePrescription || new Date());
      
      // Calculer la date de fin basée sur la durée du moment le plus long
      let dureeMax = 1;
      moments.forEach(moment => {
        const duree = MOMENT_DUREE_MAPPING[moment] || 1;
        if (duree > dureeMax) {
          dureeMax = duree;
        }
      });

      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + dureeMax - 1);

      updates.dateDebutPrise = dateDebut.toISOString().split('T')[0];
      updates.dateFinPrise = dateFin.toISOString().split('T')[0];

      // Mettre à jour l'enregistrement
      await medicament.update(updates);
      console.log(`✅ Migré médicament ID ${medicament.id}: ${moments.join(', ')} → ${updates.dateDebutPrise} à ${updates.dateFinPrise}`);
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
      },
      include: [{
        model: require('../models').Consultation,
        attributes: ['dateConsultation']
      }]
    });

    console.log(`📊 Trouvé ${medicaments.length} médicaments de consultation à migrer`);

    for (const medicament of medicaments) {
      const moments = medicament.momentPrise || [];
      const updates = {};

      // Utiliser la date de consultation comme date de début
      const dateDebut = new Date(medicament.Consultation?.dateConsultation || new Date());
      
      // Calculer la date de fin basée sur la durée du moment le plus long
      let dureeMax = 1;
      moments.forEach(moment => {
        const duree = MOMENT_DUREE_MAPPING[moment] || 1;
        if (duree > dureeMax) {
          dureeMax = duree;
        }
      });

      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + dureeMax - 1);

      updates.dateDebutPrise = dateDebut.toISOString().split('T')[0];
      updates.dateFinPrise = dateFin.toISOString().split('T')[0];

      // Mettre à jour l'enregistrement
      await medicament.update(updates);
      console.log(`✅ Migré médicament ID ${medicament.id}: ${moments.join(', ')} → ${updates.dateDebutPrise} à ${updates.dateFinPrise}`);
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
  console.log('🚀 Début de la migration momentPrise → dates de prise');
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
    console.log('Les champs momentPrise ont été convertis en dates de prise :');
    console.log('- Date de début: basée sur la date de prescription/consultation');
    console.log('- Date de fin: calculée selon la durée du traitement');
    console.log('- Durées par défaut: 1-7 jours selon le type de prise');

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
