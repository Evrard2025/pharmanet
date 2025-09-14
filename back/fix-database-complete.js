const { sequelize } = require('./config/db');

async function fixDatabaseComplete() {
  try {
    console.log('🔧 Réparation complète de la base de données...');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Étape 1: Supprimer la table consultation_medicaments problématique
    console.log('\n🗑️ Étape 1: Suppression de la table consultation_medicaments...');
    await sequelize.query(`
      DROP TABLE IF EXISTS consultation_medicaments CASCADE;
    `);
    console.log('✅ Table consultation_medicaments supprimée');

    // Étape 2: Recréer la table consultation_medicaments avec la structure correcte
    console.log('\n➕ Étape 2: Recréation de la table consultation_medicaments...');
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

    // Étape 3: Ajouter les index
    console.log('\n📊 Étape 3: Ajout des index...');
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

    // Étape 4: Vérifier que la colonne email est nullable dans la table users
    console.log('\n🔍 Étape 4: Vérification de la colonne email...');
    const [emailColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email';
    `);

    if (emailColumns.length > 0) {
      const emailColumn = emailColumns[0];
      if (emailColumn.is_nullable === 'YES') {
        console.log('✅ La colonne email est bien nullable');
      } else {
        console.log('🔧 Correction de la colonne email...');
        await sequelize.query(`
          ALTER TABLE users 
          ALTER COLUMN email DROP NOT NULL;
        `);
        console.log('✅ Colonne email rendue nullable');
      }
    } else {
      console.log('❌ Colonne email non trouvée');
    }

    // Étape 5: Vérifier la structure finale
    console.log('\n📋 Étape 5: Vérification de la structure finale...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n📋 Tables disponibles: ${tables.length}`);
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

    console.log('\n📋 Structure de la table users:');
    userColumns.forEach(column => {
      const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = column.column_default ? ` DEFAULT ${column.column_default}` : '';
      console.log(`  - ${column.column_name}: ${column.data_type} ${nullable}${defaultVal}`);
    });

    // Vérifier la structure de la table consultation_medicaments
    const [consultationMedicamentsColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'consultation_medicaments' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Structure de la table consultation_medicaments:');
    consultationMedicamentsColumns.forEach(column => {
      const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = column.column_default ? ` DEFAULT ${column.column_default}` : '';
      console.log(`  - ${column.column_name}: ${column.data_type} ${nullable}${defaultVal}`);
    });

    console.log('\n🎉 Base de données réparée avec succès !');
    console.log('\n📝 Récapitulatif :');
    console.log('  - Table consultation_medicaments recréée avec structure correcte');
    console.log('  - Colonne observance utilisant VARCHAR avec contrainte CHECK');
    console.log('  - Colonne email nullable pour les patients');
    console.log('  - Toutes les tables sont opérationnelles');

  } catch (error) {
    console.error('❌ Erreur lors de la réparation:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  fixDatabaseComplete()
    .then(() => {
      console.log('✅ Réparation terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = fixDatabaseComplete;
