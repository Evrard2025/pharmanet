const { sequelize } = require('../config/db');

async function recreateMedicamentTables() {
  try {
    // Supprimer les tables existantes
    await sequelize.query(`
      DROP TABLE IF EXISTS surveillance_biologique CASCADE;
      DROP TABLE IF EXISTS medicaments CASCADE;
    `);
    
    console.log('Tables existantes supprimées');
    
    // Recréer la table medicaments avec la bonne structure
    await sequelize.query(`
      CREATE TABLE medicaments (
        id SERIAL PRIMARY KEY,
        "nomCommercial" VARCHAR(200) NOT NULL,
        dci VARCHAR(200) NOT NULL,
        "classeTherapeutique" VARCHAR(150) NOT NULL,
        "formePharmaceutique" VARCHAR(100),
        dosage VARCHAR(100),
        laboratoire VARCHAR(150),
        indication TEXT,
        "contreIndication" TEXT,
        "effetsSecondaires" TEXT,
        posologie TEXT,
        interactions TEXT,
        "surveillanceHepatique" BOOLEAN DEFAULT FALSE,
        "surveillanceRenale" BOOLEAN DEFAULT FALSE,
        "frequenceSurveillance" INTEGER,
        "parametresSurveillance" TEXT[] DEFAULT '{}',
        statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'retire')),
        "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    console.log('Table medicaments recréée avec succès');
    
    // Recréer la table surveillance_biologique
    await sequelize.query(`
      CREATE TABLE surveillance_biologique (
        id SERIAL PRIMARY KEY,
        "patientId" INTEGER NOT NULL REFERENCES patients(id),
        "medicamentId" INTEGER REFERENCES medicaments(id),
        "typeSurveillance" VARCHAR(20) NOT NULL CHECK ("typeSurveillance" IN ('hepatique', 'renale', 'mixte', 'autre')),
        parametres TEXT[] NOT NULL DEFAULT '{}',
        "frequenceMois" INTEGER NOT NULL DEFAULT 3,
        "dateDebut" DATE NOT NULL,
        "dateProchaineAnalyse" DATE NOT NULL,
        "dateDerniereAnalyse" DATE,
        "resultatsDerniereAnalyse" JSONB,
        statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'en_attente', 'terminee', 'annulee')),
        priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
        notes TEXT,
        laboratoire VARCHAR(150),
        "contactLaboratoire" VARCHAR(200),
        "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    console.log('Table surveillance_biologique recréée avec succès');
    
    // Créer les index
    await sequelize.query(`
      CREATE INDEX idx_medicaments_nom_commercial ON medicaments("nomCommercial");
      CREATE INDEX idx_medicaments_dci ON medicaments(dci);
      CREATE INDEX idx_medicaments_classe_therapeutique ON medicaments("classeTherapeutique");
      CREATE INDEX idx_medicaments_statut ON medicaments(statut);
      
      CREATE INDEX idx_surveillance_patient ON surveillance_biologique("patientId");
      CREATE INDEX idx_surveillance_medicament ON surveillance_biologique("medicamentId");
      CREATE INDEX idx_surveillance_date_prochaine ON surveillance_biologique("dateProchaineAnalyse");
      CREATE INDEX idx_surveillance_statut ON surveillance_biologique(statut);
      CREATE INDEX idx_surveillance_type ON surveillance_biologique("typeSurveillance");
    `);
    
    console.log('Index créés avec succès');
    
    // Vérifier la structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'medicaments' 
      ORDER BY ordinal_position
    `);
    
    console.log('Structure finale de la table medicaments:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('Tables recréées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la recréation des tables:', error);
  } finally {
    await sequelize.close();
  }
}

recreateMedicamentTables();
