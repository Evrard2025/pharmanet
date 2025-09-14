const { sequelize } = require('./config/db');

async function createAllTables() {
  try {
    console.log('🔄 Début de la création des tables...');

    // Importer tous les modèles
    const { User, Patient, Consultation, ConsultationMedicament, Medicament, SurveillanceBiologique } = require('./models/index');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Synchroniser toutes les tables
    console.log('🔄 Synchronisation des tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables synchronisées avec succès');

    // Vérifier que les tables existent
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📋 Tables créées :');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Vérifier la structure de la table users
    const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Structure de la table users :');
    userColumns.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    console.log('\n🎉 Toutes les tables ont été créées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  createAllTables()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = createAllTables;
