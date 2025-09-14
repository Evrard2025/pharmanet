const { sequelize } = require('./config/db');

async function testDatabase() {
  try {
    console.log('🧪 Test de la base de données...');

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Importer les modèles
    const { User, Patient, Consultation, ConsultationMedicament, Medicament, SurveillanceBiologique } = require('./models/index');

    // Test 1: Créer un utilisateur patient
    console.log('\n📱 Test 1: Création d\'un patient');
    const patient = await User.create({
      firstName: 'Jean',
      lastName: 'Patient',
      phone: '0612345678',
      password: 'password123',
      address: '123 rue de test, 75001 Paris',
      role: 'client'
      // Pas d'email - doit être NULL
    });
    console.log('✅ Patient créé:', {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: patient.email,
      role: patient.role
    });

    // Test 2: Créer un pharmacien
    console.log('\n👨‍⚕️ Test 2: Création d\'un pharmacien');
    const pharmacien = await User.create({
      firstName: 'Marie',
      lastName: 'Pharmacien',
      email: 'marie.pharmacien@example.com',
      phone: '0698765432',
      password: 'password123',
      address: 'Pharmacie du Centre, Paris',
      role: 'pharmacien'
    });
    console.log('✅ Pharmacien créé:', {
      id: pharmacien.id,
      firstName: pharmacien.firstName,
      lastName: pharmacien.lastName,
      email: pharmacien.email,
      phone: pharmacien.phone,
      role: pharmacien.role
    });

    // Test 3: Vérifier la connexion par téléphone
    console.log('\n🔍 Test 3: Recherche par téléphone');
    const foundPatient = await User.findOne({ where: { phone: '0612345678' } });
    if (foundPatient) {
      console.log('✅ Patient trouvé par téléphone:', foundPatient.firstName, foundPatient.lastName);
    } else {
      console.log('❌ Patient non trouvé par téléphone');
    }

    // Test 4: Vérifier la connexion par email
    console.log('\n🔍 Test 4: Recherche par email');
    const foundPharmacien = await User.findOne({ where: { email: 'marie.pharmacien@example.com' } });
    if (foundPharmacien) {
      console.log('✅ Pharmacien trouvé par email:', foundPharmacien.firstName, foundPharmacien.lastName);
    } else {
      console.log('❌ Pharmacien non trouvé par email');
    }

    // Test 5: Vérifier que l'email peut être NULL
    console.log('\n🔍 Test 5: Vérification email NULL');
    const patientWithNullEmail = await User.findOne({ where: { phone: '0612345678' } });
    if (patientWithNullEmail && patientWithNullEmail.email === null) {
      console.log('✅ Email est bien NULL pour le patient');
    } else {
      console.log('❌ Email n\'est pas NULL pour le patient');
    }

    // Nettoyer
    console.log('\n🧹 Nettoyage...');
    await patient.destroy();
    await pharmacien.destroy();
    console.log('✅ Utilisateurs de test supprimés');

    console.log('\n🎉 Tous les tests sont passés !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  testDatabase()
    .then(() => {
      console.log('✅ Test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = testDatabase;
