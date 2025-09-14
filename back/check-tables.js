const { sequelize } = require('./config/db');

async function checkTables() {
  try {
    console.log('🔍 Vérification des tables existantes...');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Lister toutes les tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.length === 0) {
      console.log('❌ Aucune table trouvée dans la base de données');
      console.log('💡 Exécutez: node create-all-tables.js');
      return;
    }

    console.log(`\n📋 ${tables.length} table(s) trouvée(s) :`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Vérifier la structure de chaque table
    for (const table of tables) {
      console.log(`\n🔍 Structure de la table ${table.table_name} :`);
      
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = '${table.table_name}' 
        ORDER BY ordinal_position;
      `);

      columns.forEach(column => {
        const length = column.character_maximum_length ? `(${column.character_maximum_length})` : '';
        const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = column.column_default ? ` DEFAULT ${column.column_default}` : '';
        console.log(`  - ${column.column_name}: ${column.data_type}${length} ${nullable}${defaultVal}`);
      });
    }

    // Vérifier les contraintes de clés étrangères
    console.log('\n🔗 Contraintes de clés étrangères :');
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    if (foreignKeys.length === 0) {
      console.log('  Aucune contrainte de clé étrangère trouvée');
    } else {
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }

    console.log('\n✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  checkTables()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = checkTables;
