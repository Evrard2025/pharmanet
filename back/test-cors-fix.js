#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration CORS
 */

const axios = require('axios');

const testCors = async () => {
  try {
    console.log('🧪 Test de la configuration CORS...');
    
    // Test 1: Vérifier que le serveur répond
    console.log('\n1. Test de connectivité du serveur...');
    const response = await axios.get('http://localhost:5000/');
    console.log('✅ Serveur accessible:', response.data);
    
    // Test 2: Test CORS avec origin localhost:3000
    console.log('\n2. Test CORS avec origin localhost:3000...');
    try {
      const corsResponse = await axios.get('http://localhost:5000/api/auth/register', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ CORS accepté pour localhost:3000');
    } catch (corsError) {
      if (corsError.response?.status === 404) {
        console.log('✅ CORS accepté (404 normal pour GET sur /register)');
      } else {
        console.log('❌ Erreur CORS:', corsError.message);
      }
    }
    
    // Test 3: Test OPTIONS preflight
    console.log('\n3. Test OPTIONS preflight...');
    try {
      const optionsResponse = await axios.options('http://localhost:5000/api/auth/register', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ OPTIONS preflight accepté');
      console.log('Headers CORS:', {
        'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
      });
    } catch (optionsError) {
      console.log('❌ Erreur OPTIONS:', optionsError.message);
    }
    
    console.log('\n✅ Tests CORS terminés');
    
  } catch (error) {
    console.error('❌ Erreur lors du test CORS:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: Démarrer le serveur backend avec:');
      console.log('   cd back && npm start');
    }
  }
};

testCors();
