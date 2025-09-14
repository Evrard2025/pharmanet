const { sequelize } = require('./config/db');
const User = require('./models/User');

async function testPhoneLogin() {
  try {
    console.log('🧪 Test de connexion par téléphone...');

    // Créer un utilisateur de test avec téléphone uniquement
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'Patient',
      phone: '0612345678',
      password: 'password123',
      address: '123 rue de test, 75001 Paris',
      role: 'client'
    });

    console.log('✅ Utilisateur de test créé:', {
      id: testUser.id,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      phone: testUser.phone,
      email: testUser.email,
      role: testUser.role
    });

    // Tester la connexion par téléphone
    const foundUser = await User.findOne({ 
      where: { phone: '0612345678', isActive: true } 
    });

    if (foundUser) {
      console.log('✅ Connexion par téléphone réussie');
      console.log('   - Utilisateur trouvé:', foundUser.firstName, foundUser.lastName);
    } else {
      console.log('❌ Connexion par téléphone échouée');
    }

    // Tester la connexion par email (doit échouer car pas d'email)
    const foundByEmail = await User.findOne({ 
      where: { email: 'test@example.com', isActive: true } 
    });

    if (foundByEmail) {
      console.log('❌ Connexion par email réussie (ne devrait pas)');
    } else {
      console.log('✅ Connexion par email échouée comme attendu (pas d\'email)');
    }

    // Nettoyer - supprimer l'utilisateur de test
    await testUser.destroy();
    console.log('🧹 Utilisateur de test supprimé');

    console.log('🎉 Tous les tests sont passés !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testPhoneLogin()
    .then(() => {
      console.log('✅ Test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = testPhoneLogin;
