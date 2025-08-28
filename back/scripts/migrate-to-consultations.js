const { sequelize } = require('../config/db');
const { Consultation, ConsultationMedicament } = require('../models/Consultation');

async function migrateToConsultations() {
  try {
    // Synchroniser les nouveaux modèles
    await Consultation.sync({ alter: true });
    await ConsultationMedicament.sync({ alter: true });

    console.log('Migration terminée avec succès !');
    console.log('Tables créées :');
    console.log('   - consultations');
    console.log('   - consultation_medicaments');

  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration
migrateToConsultations();
