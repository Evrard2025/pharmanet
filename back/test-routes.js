const express = require('express');

console.log('🧪 Test de chargement des routes...');

try {
  console.log('1. Test auth route...');
  const authRoute = require('./routes/auth');
  console.log('✅ Auth route:', typeof authRoute);
  
  console.log('2. Test consultations route...');
  const consultationsRoute = require('./routes/consultations');
  console.log('✅ Consultations route:', typeof consultationsRoute);
  
  console.log('3. Test patients route...');
  const patientsRoute = require('./routes/patients');
  console.log('✅ Patients route:', typeof patientsRoute);
  
  console.log('4. Test medicaments route...');
  const medicamentsRoute = require('./routes/medicaments');
  console.log('✅ Medicaments route:', typeof medicamentsRoute);
  
  console.log('5. Test prescriptions route...');
  const prescriptionsRoute = require('./routes/prescriptions');
  console.log('✅ Prescriptions route:', typeof prescriptionsRoute);
  
  console.log('6. Test surveillance-biologique route...');
  const surveillanceRoute = require('./routes/surveillance-biologique');
  console.log('✅ Surveillance route:', typeof surveillanceRoute);
  
  console.log('7. Test dashboard route...');
  const dashboardRoute = require('./routes/dashboard');
  console.log('✅ Dashboard route:', typeof dashboardRoute);
  
  console.log('8. Test loyalty route...');
  // const loyaltyRoute = require('./routes/loyalty'); // Supprimé
  console.log('✅ Loyalty route: supprimé');
  
  console.log('9. Test admin-users route...');
  const adminUsersRoute = require('./routes/admin-users');
  console.log('✅ Admin-users route:', typeof adminUsersRoute);
  
  console.log('10. Test users route...');
  const usersRoute = require('./routes/users');
  console.log('✅ Users route:', typeof usersRoute);
  
  console.log('🎉 Toutes les routes se chargent correctement !');
  
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes:', error);
  process.exit(1);
}
