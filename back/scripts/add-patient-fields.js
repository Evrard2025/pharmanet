const { sequelize } = require('../config/db');

async function addPatientFields() {
  try {
    console.log('Ajout des nouveaux champs au modèle Patient...');
    
    // Ajouter les nouveaux champs
    await sequelize.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS numeroSecu VARCHAR(20),
      ADD COLUMN IF NOT EXISTS lieuNaissance VARCHAR(100),
      ADD COLUMN IF NOT EXISTS nationalite VARCHAR(50),
      ADD COLUMN IF NOT EXISTS profession VARCHAR(100),
      ADD COLUMN IF NOT EXISTS situationFamiliale VARCHAR(50),
      ADD COLUMN IF NOT EXISTS nombreEnfants INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS antecedentsMedicaux TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS antecedentsChirurgicaux TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS antecedentsFamiliaux TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS medecinTraitant VARCHAR(150);
    `);
    
    console.log('✅ Nouveaux champs ajoutés avec succès au modèle Patient');
    
    // Vérifier la structure de la table
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Structure actuelle de la table patients:');
    results.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des champs:', error);
    throw error;
  }
}

// Exécuter la migration
if (require.main === module) {
  addPatientFields()
    .then(() => {
      console.log('Migration terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration échouée:', error);
      process.exit(1);
    });
}

module.exports = addPatientFields;

