const { sequelize } = require('../config/db');

async function createMedicamentTables() {
  try {
    // Créer la table medicaments
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS medicaments (
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
    
    // Créer la table surveillance_biologique
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS surveillance_biologique (
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
    
    // Ajouter la colonne medicamentId à la table consultations si elle n'existe pas
    await sequelize.query(`
      ALTER TABLE consultations 
      ADD COLUMN IF NOT EXISTS "medicamentId" INTEGER REFERENCES medicaments(id)
    `);
    
    // Créer les index pour optimiser les performances
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_medicaments_nom_commercial ON medicaments("nomCommercial");
      CREATE INDEX IF NOT EXISTS idx_medicaments_dci ON medicaments(dci);
      CREATE INDEX IF NOT EXISTS idx_medicaments_classe_therapeutique ON medicaments("classeTherapeutique");
      CREATE INDEX IF NOT EXISTS idx_medicaments_statut ON medicaments(statut);
      
      CREATE INDEX IF NOT EXISTS idx_surveillance_patient ON surveillance_biologique("patientId");
      CREATE INDEX IF NOT EXISTS idx_surveillance_medicament ON surveillance_biologique("medicamentId");
      CREATE INDEX IF NOT EXISTS idx_surveillance_date_prochaine ON surveillance_biologique("dateProchaineAnalyse");
      CREATE INDEX IF NOT EXISTS idx_surveillance_statut ON surveillance_biologique(statut);
      CREATE INDEX IF NOT EXISTS idx_surveillance_type ON surveillance_biologique("typeSurveillance");
    `);
    
    // Vérifier que les tables ont été créées
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('medicaments', 'surveillance_biologique')
      AND table_schema = 'public'
    `);
    
    if (tables.length >= 2) {
      console.log('Vérification réussie : toutes les tables sont présentes');
    } else {
      console.log('Attention : certaines tables n\'ont pas été créées correctement');
    }
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration
createMedicamentTables();
