const { sequelize } = require('./config/db');

async function recreateConsultationMedicaments() {
  try {
    console.log('🔄 Recréation de la table consultation_medicaments...');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Supprimer la table si elle existe
    console.log('🗑️ Suppression de la table consultation_medicaments...');
    await sequelize.query(`
      DROP TABLE IF EXISTS consultation_medicaments CASCADE;
    `);
    console.log('✅ Table consultation_medicaments supprimée');

    // Recréer la table avec la structure correcte
    console.log('➕ Recréation de la table consultation_medicaments...');
    await sequelize.query(`
      CREATE TABLE consultation_medicaments (
        id SERIAL PRIMARY KEY,
        consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
        nom_medicament VARCHAR(200) NOT NULL,
        dci_medicament VARCHAR(200),
        classe_therapeutique VARCHAR(100),
        posologie TEXT NOT NULL,
        quantite INTEGER NOT NULL,
        unite VARCHAR(20) NOT NULL DEFAULT 'comprimé',
        date_debut_prise DATE,
        date_fin_prise DATE,
        effets_indesirables_signales TEXT,
        observance VARCHAR(20) CHECK (observance IS NULL OR observance IN ('bonne', 'moyenne', 'mauvaise')),
        statut VARCHAR(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'arrete')),
        precaution TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table consultation_medicaments recréée');

    // Ajouter les index
    console.log('📊 Ajout des index...');
    await sequelize.query(`
      CREATE INDEX idx_consultation_medicaments_consultation_id ON consultation_medicaments(consultation_id);
    `);
    await sequelize.query(`
      CREATE INDEX idx_consultation_medicaments_nom_medicament ON consultation_medicaments(nom_medicament);
    `);
    await sequelize.query(`
      CREATE INDEX idx_consultation_medicaments_statut ON consultation_medicaments(statut);
    `);
    console.log('✅ Index ajoutés');

    // Vérifier la structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'consultation_medicaments' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Structure de la table consultation_medicaments:');
    columns.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    console.log('\n🎉 Table consultation_medicaments recréée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la recréation:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  recreateConsultationMedicaments()
    .then(() => {
      console.log('✅ Recréation terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = recreateConsultationMedicaments;
