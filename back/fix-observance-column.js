const { sequelize } = require('./config/db');

async function fixObservanceColumn() {
  try {
    console.log('🔧 Correction de la colonne observance...');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la table existe
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consultation_medicaments';
    `);

    if (tables.length === 0) {
      console.log('❌ Table consultation_medicaments n\'existe pas');
      return;
    }

    // Vérifier la structure actuelle de la colonne observance
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'consultation_medicaments' 
      AND column_name = 'observance';
    `);

    if (columns.length === 0) {
      console.log('❌ Colonne observance n\'existe pas');
      return;
    }

    console.log('📋 Structure actuelle de la colonne observance:');
    columns.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    // Supprimer la colonne observance si elle existe
    console.log('🗑️ Suppression de la colonne observance...');
    await sequelize.query(`
      ALTER TABLE consultation_medicaments 
      DROP COLUMN IF EXISTS observance;
    `);
    console.log('✅ Colonne observance supprimée');

    // Recréer la colonne observance comme VARCHAR simple
    console.log('➕ Recréation de la colonne observance...');
    await sequelize.query(`
      ALTER TABLE consultation_medicaments 
      ADD COLUMN observance VARCHAR(20) DEFAULT NULL;
    `);
    console.log('✅ Colonne observance recréée');

    // Ajouter une contrainte de vérification pour les valeurs autorisées
    console.log('🔒 Ajout de la contrainte de vérification...');
    await sequelize.query(`
      ALTER TABLE consultation_medicaments 
      ADD CONSTRAINT check_observance 
      CHECK (observance IS NULL OR observance IN ('bonne', 'moyenne', 'mauvaise'));
    `);
    console.log('✅ Contrainte de vérification ajoutée');

    // Vérifier la structure finale
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'consultation_medicaments' 
      AND column_name = 'observance';
    `);

    console.log('\n📋 Structure finale de la colonne observance:');
    finalColumns.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    console.log('\n🎉 Colonne observance corrigée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  fixObservanceColumn()
    .then(() => {
      console.log('✅ Correction terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = fixObservanceColumn;
