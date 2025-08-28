const { sequelize } = require('../config/db');

async function addConsultationFields() {
  try {
    // Ajouter les nouveaux champs à la table consultations (syntaxe PostgreSQL)
    await sequelize.query(`
      ALTER TABLE consultations 
      ADD COLUMN IF NOT EXISTS periodePrise VARCHAR(100),
      ADD COLUMN IF NOT EXISTS datePriseMedicament DATE
    `);
    
    // Vérifier que les champs ont été ajoutés
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'consultations' 
      AND column_name IN ('periodePrise', 'datePriseMedicament')
    `);
    
    if (results.length >= 2) {
      console.log('Migration réussie : les nouveaux champs sont présents dans la table');
    } else {
      console.log('Attention : certains champs n\'ont pas été ajoutés correctement');
    }
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration
addConsultationFields();
