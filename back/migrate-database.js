const { sequelize } = require('./config/db');

async function migrateDatabase() {
  try {
    console.log('🔄 Début de la migration de la base de données...');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Importer tous les modèles
    const { User, Patient, Consultation, ConsultationMedicament, Medicament, SurveillanceBiologique } = require('./models/index');

    // Vérifier les tables existantes
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📋 Tables existantes: ${existingTables.length}`);
    existingTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Synchroniser avec alter: true pour mettre à jour la structure
    console.log('🔄 Synchronisation des tables avec mise à jour...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables synchronisées avec succès');

    // Vérifier la structure de la table users après migration
    const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Structure de la table users après migration :');
    userColumns.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    // Vérifier que l'email peut être NULL
    const emailColumn = userColumns.find(col => col.column_name === 'email');
    if (emailColumn && emailColumn.is_nullable === 'YES') {
      console.log('✅ La colonne email est bien nullable');
    } else {
      console.log('❌ La colonne email n\'est pas nullable');
    }

    console.log('\n🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('✅ Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = migrateDatabase;
