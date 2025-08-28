const { sequelize } = require('../config/db');

async function fixStatutColumn() {
  try {
    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie');

    // Supprimer la valeur par défaut de la colonne statut
    console.log('Suppression de la valeur par défaut...');
    await sequelize.query(`
      ALTER TABLE medicaments 
      ALTER COLUMN statut DROP DEFAULT;
    `);
    console.log('Valeur par défaut supprimée');

    // Maintenant convertir en ENUM
    console.log('Conversion en type ENUM...');
    await sequelize.query(`
      ALTER TABLE medicaments 
      ALTER COLUMN statut TYPE enum_medicaments_statut 
      USING statut::enum_medicaments_statut;
    `);
    console.log('Colonne convertie en ENUM');

    // Remettre la valeur par défaut
    console.log('Remise de la valeur par défaut...');
    await sequelize.query(`
      ALTER TABLE medicaments 
      ALTER COLUMN statut SET DEFAULT 'actif';
    `);
    console.log('Valeur par défaut remise');

    // Vérifier le résultat
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'medicaments' AND column_name = 'statut';
    `);

    if (results.length > 0) {
      const statutColumn = results[0];
      console.log('Colonne statut après correction:');
      console.log(`   Type: ${statutColumn.data_type}`);
      console.log(`   Nullable: ${statutColumn.is_nullable}`);
      console.log(`   Default: ${statutColumn.column_default}`);
      
      if (statutColumn.data_type === 'USER-DEFINED') {
        console.log('Colonne statut correctement convertie en ENUM !');
      } else {
        console.log('La conversion n\'a pas fonctionné');
      }
    }

    console.log('Correction de la colonne statut terminée !');

  } catch (error) {
    console.error('Erreur lors de la correction:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
fixStatutColumn();
