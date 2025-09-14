const { sequelize } = require('../config/db');

async function makeEmailOptional() {
  try {
    console.log('🔄 Début de la migration pour rendre l\'email optionnel...');

    // Vérifier la structure actuelle de la table
    const [results] = await sequelize.query("DESCRIBE users");
    console.log('📋 Structure actuelle de la table users:');
    results.forEach(row => {
      if (row.Field === 'email') {
        console.log(`  - ${row.Field}: ${row.Type}, Null: ${row.Null}, Key: ${row.Key}`);
      }
    });

    // Modifier la colonne email pour la rendre nullable
    await sequelize.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL");
    console.log('✅ Colonne email modifiée pour accepter NULL');

    // Vérifier la nouvelle structure
    const [newResults] = await sequelize.query("DESCRIBE users");
    console.log('📋 Nouvelle structure de la table users:');
    newResults.forEach(row => {
      if (row.Field === 'email') {
        console.log(`  - ${row.Field}: ${row.Type}, Null: ${row.Null}, Key: ${row.Key}`);
      }
    });

    console.log('🎉 Migration terminée avec succès !');
    console.log('📝 Les utilisateurs peuvent maintenant:');
    console.log('   - Se connecter avec leur numéro de téléphone ou email');
    console.log('   - S\'inscrire sans fournir d\'email (optionnel)');
    console.log('   - Avoir un email NULL dans la base de données');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  makeEmailOptional()
    .then(() => {
      console.log('✅ Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = makeEmailOptional;
