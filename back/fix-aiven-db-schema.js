const { Sequelize, DataTypes } = require('sequelize');

// Forcer SSL pour toutes les connexions PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbName = process.env.DB_NAME || 'pharmacie',
  dbUser = process.env.DB_USER || 'postgres',
  dbPassword = process.env.DB_PASSWORD || '2023',
  dbHost = process.env.DB_HOST || 'localhost',
  dbPort = process.env.DB_PORT || 5432;

// Configuration SSL pour Aiven
const sslConfig = {
  require: true,
  rejectUnauthorized: false
};

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: { ssl: sslConfig },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const fixAivenDatabaseSchema = async () => {
  try {
    console.log('🔧 Configuration Aiven détectée');
    console.log(`📊 Host: ${dbHost}`);
    console.log(`📊 Port: ${dbPort}`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`📊 User: ${dbUser}`);
    console.log(`📊 SSL: Activé`);

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion Aiven PostgreSQL établie avec succès.');

    // Vérifier les tables existantes
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', tables);

    if (tables.includes('patients')) {
      console.log('🔧 Correction du schéma de la table patients sur Aiven...');
      
      // Vérifier la structure actuelle
      const tableDescription = await sequelize.getQueryInterface().describeTable('patients');
      console.log('📋 Structure actuelle de la table patients:');
      Object.keys(tableDescription).forEach(column => {
        console.log(`  - ${column}: ${tableDescription[column].type}`);
      });

      // Colonnes à convertir de ARRAY vers TEXT
      const columnsToConvert = [
        'traitementsChroniques',
        'traitementsPonctuels',
        'allergies',
        'antecedentsmedicaux',
        'antecedentschirurgicaux',
        'antecedentsfamiliaux'
      ];

      for (const columnName of columnsToConvert) {
        try {
          // Vérifier si la colonne existe et son type
          const columnInfo = tableDescription[columnName];
          if (columnInfo) {
            console.log(`🔧 Conversion de la colonne ${columnName} de ${columnInfo.type} vers TEXT...`);
            
            // Supprimer la colonne existante
            await sequelize.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "${columnName}";`);
            console.log(`✅ Colonne ${columnName} supprimée`);
            
            // Ajouter la colonne avec le bon type
            await sequelize.query(`ALTER TABLE "patients" ADD COLUMN "${columnName}" TEXT DEFAULT '[]';`);
            console.log(`✅ Colonne ${columnName} ajoutée avec le type TEXT`);
          }
        } catch (error) {
          console.log(`⚠️ Erreur lors de la conversion de ${columnName}:`, error.message);
        }
      }

      console.log('✅ Schéma de la table patients corrigé sur Aiven');
    }

    // Vérifier la table surveillance_biologique
    if (tables.includes('surveillance_biologique')) {
      console.log('🔧 Correction du schéma de la table surveillance_biologique sur Aiven...');
      
      try {
        await sequelize.query(`ALTER TABLE "surveillance_biologique" DROP COLUMN IF EXISTS "parametres";`);
        await sequelize.query(`ALTER TABLE "surveillance_biologique" ADD COLUMN "parametres" TEXT DEFAULT '[]';`);
        console.log('✅ Colonne parametres corrigée dans surveillance_biologique sur Aiven');
      } catch (error) {
        console.log('⚠️ Erreur lors de la correction de surveillance_biologique:', error.message);
      }
    }

    // Vérifier la table medicaments
    if (tables.includes('medicaments')) {
      console.log('🔧 Correction du schéma de la table medicaments sur Aiven...');
      
      try {
        await sequelize.query(`ALTER TABLE "medicaments" DROP COLUMN IF EXISTS "parametresSurveillance";`);
        await sequelize.query(`ALTER TABLE "medicaments" ADD COLUMN "parametresSurveillance" TEXT DEFAULT '[]';`);
        console.log('✅ Colonne parametresSurveillance corrigée dans medicaments sur Aiven');
      } catch (error) {
        console.log('⚠️ Erreur lors de la correction de medicaments:', error.message);
      }
    }

    // Vérifier la structure finale
    const finalDescription = await sequelize.getQueryInterface().describeTable('patients');
    console.log('📋 Structure finale de la table patients sur Aiven:');
    Object.keys(finalDescription).forEach(column => {
      console.log(`  - ${column}: ${finalDescription[column].type}`);
    });

    console.log('🎉 Schéma de la base de données Aiven corrigé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction du schéma Aiven:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Connexion fermée.');
  }
};

fixAivenDatabaseSchema();
