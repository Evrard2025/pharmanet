#!/usr/bin/env node

const { sequelize } = require('./config/db');

async function setupDatabase() {
  try {
    console.log('🚀 Configuration de la base de données PharmaNet...');

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
    if (existingTables.length > 0) {
      console.log('Tables trouvées:');
      existingTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    // Synchroniser les tables
    console.log('\n🔄 Synchronisation des tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables synchronisées');

    // Vérifier la structure finale
    const [finalTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n📋 Tables finales: ${finalTables.length}`);
    finalTables.forEach(table => {
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
      const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = column.column_default ? ` DEFAULT ${column.column_default}` : '';
      console.log(`  - ${column.column_name}: ${column.data_type} ${nullable}${defaultVal}`);
    });

    // Vérifier que l'email est nullable
    const emailColumn = userColumns.find(col => col.column_name === 'email');
    if (emailColumn && emailColumn.is_nullable === 'YES') {
      console.log('\n✅ La colonne email est bien nullable (patients peuvent s\'inscrire sans email)');
    } else {
      console.log('\n❌ La colonne email n\'est pas nullable');
    }

    console.log('\n🎉 Base de données configurée avec succès !');
    console.log('\n📝 Récapitulatif :');
    console.log('  - Patients : se connectent avec leur téléphone, email optionnel');
    console.log('  - Professionnels : se connectent avec leur email, email obligatoire');
    console.log('  - Toutes les tables sont créées et synchronisées');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Configuration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
