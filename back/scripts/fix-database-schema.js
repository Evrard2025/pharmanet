const { sequelize } = require('../config/db');

async function fixDatabaseSchema() {
  try {
    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie');

    // Vérifier si la table medicaments existe et sa structure
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'medicaments' 
      ORDER BY ordinal_position;
    `);

    console.log('Structure actuelle de la table medicaments:');
    results.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

    // Vérifier si la colonne statut existe et son type
    const statutColumn = results.find(col => col.column_name === 'statut');
    
    if (statutColumn) {
      console.log(`Colonne 'statut' trouvée avec le type: ${statutColumn.data_type}`);
      
      if (statutColumn.data_type === 'USER-DEFINED') {
        console.log('   Type ENUM détecté, pas de modification nécessaire');
      } else {
        console.log('   Type non-ENUM détecté, conversion nécessaire...');
        
        // Créer le type ENUM s'il n'existe pas
        try {
          await sequelize.query(`
            DO $$ 
            BEGIN 
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_medicaments_statut') THEN
                CREATE TYPE enum_medicaments_statut AS ENUM ('actif', 'inactif', 'retire');
              END IF;
            END $$;
          `);
          console.log('Type ENUM créé ou déjà existant');
          
          // Convertir la colonne en ENUM
          await sequelize.query(`
            ALTER TABLE medicaments 
            ALTER COLUMN statut TYPE enum_medicaments_statut 
            USING statut::enum_medicaments_statut;
          `);
          console.log('Colonne statut convertie en ENUM');
        } catch (error) {
          console.log(`Erreur lors de la conversion: ${error.message}`);
        }
      }
    } else {
      console.log('Colonne statut non trouvée dans la table medicaments');
    }

    // Vérifier si la table surveillance_biologique existe
    const [surveillanceResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'surveillance_biologique';
    `);

    if (surveillanceResults.length === 0) {
      console.log('Création de la table surveillance_biologique...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS surveillance_biologique (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          medicament_id INTEGER,
          type_surveillance VARCHAR(20) NOT NULL CHECK (type_surveillance IN ('hepatique', 'renale', 'mixte', 'autre')),
          parametres TEXT[] NOT NULL,
          frequence_mois INTEGER NOT NULL DEFAULT 3,
          date_debut_surveillance DATE NOT NULL,
          date_derniere_analyse DATE,
          date_prochaine_analyse DATE NOT NULL,
          resultats TEXT,
          statut VARCHAR(20) NOT NULL DEFAULT 'en_cours',
          priorite VARCHAR(20) NOT NULL DEFAULT 'moyenne',
          notes TEXT,
          laboratoire VARCHAR(200),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Table surveillance_biologique créée');

      // Créer les index
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_surveillance_patient ON surveillance_biologique(patient_id);
        CREATE INDEX IF NOT EXISTS idx_surveillance_medicament ON surveillance_biologique(medicament_id);
        CREATE INDEX IF NOT EXISTS idx_surveillance_date_prochaine ON surveillance_biologique(date_prochaine_analyse);
        CREATE INDEX IF NOT EXISTS idx_surveillance_statut ON surveillance_biologique(statut);
        CREATE INDEX IF NOT EXISTS idx_surveillance_priorite ON surveillance_biologique(priorite);
      `);
      console.log('Index créés');

      // Ajouter les contraintes de clés étrangères
      try {
        await sequelize.query(`
          ALTER TABLE surveillance_biologique 
          ADD CONSTRAINT fk_surveillance_patient 
          FOREIGN KEY (patient_id) REFERENCES patients(id);
        `);
        console.log('Contrainte FK patient ajoutée');
      } catch (error) {
        console.log(`Contrainte FK patient déjà existante ou erreur: ${error.message}`);
      }

      try {
        await sequelize.query(`
          ALTER TABLE surveillance_biologique 
          ADD CONSTRAINT fk_surveillance_medicament 
          FOREIGN KEY (medicament_id) REFERENCES medicaments(id);
        `);
        console.log('Contrainte FK médicament ajoutée');
      } catch (error) {
        console.log(`Contrainte FK médicament déjà existante ou erreur: ${error.message}`);
      }
    } else {
      console.log('Table surveillance_biologique existe déjà');
    }

    // Vérifier la structure finale
    console.log('Vérification finale du schéma...');
    
    const [finalResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('medicaments', 'surveillance_biologique', 'patients', 'consultations')
      ORDER BY table_name;
    `);

    console.log('Tables disponibles:');
    finalResults.forEach(table => {
      console.log(`   ${table.table_name}`);
    });

    console.log('Schéma de base de données corrigé avec succès !');

  } catch (error) {
    console.error('Erreur lors de la correction du schéma:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
fixDatabaseSchema();
