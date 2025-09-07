const axios = require('axios');

async function testAPI() {
  try {
    console.log('Test de l\'API patients...');
    
    // Attendre un peu que le serveur démarre
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const response = await axios.get('http://localhost:5001/api/patients?page=1&search=', {
      headers: {
        'Authorization': 'Bearer test-token' // Token de test
      }
    });
    
    console.log('✅ API fonctionne correctement');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Erreur API:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAPI();

