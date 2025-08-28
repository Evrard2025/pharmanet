const { sequelize } = require('../config/db');

async function checkTableStructure() {
  try {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'medicaments' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes trouvées:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log(`Total des colonnes: ${columns.length}`);
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();
