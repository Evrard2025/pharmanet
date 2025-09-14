import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Phone, Mail, User, CheckCircle, XCircle } from 'lucide-react';

const TestPhoneLogin: React.FC = () => {
  const { login, user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test 1: Connexion avec téléphone
    try {
      await login('0612345678', 'password123');
      addTestResult('Connexion par téléphone', true, 'Connexion réussie avec le numéro 0612345678');
    } catch (error: any) {
      addTestResult('Connexion par téléphone', false, `Erreur: ${error.message}`);
    }

    // Test 2: Connexion avec email (si disponible)
    if (user?.email) {
      try {
        await login(user.email, 'password123');
        addTestResult('Connexion par email', true, `Connexion réussie avec l'email ${user.email}`);
      } catch (error: any) {
        addTestResult('Connexion par email', false, `Erreur: ${error.message}`);
      }
    } else {
      addTestResult('Connexion par email', true, 'Pas d\'email disponible (optionnel)');
    }

    // Test 3: Connexion avec identifiant invalide
    try {
      await login('invalid@test.com', 'wrongpassword');
      addTestResult('Connexion avec identifiant invalide', false, 'Connexion réussie (ne devrait pas)');
    } catch (error: any) {
      addTestResult('Connexion avec identifiant invalide', true, 'Connexion échouée comme attendu');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Test de Connexion par Téléphone
            </h1>
            <p className="text-gray-600">
              Vérification du système de connexion avec téléphone ou email
            </p>
          </div>

          {/* Informations utilisateur actuel */}
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Utilisateur connecté
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Nom complet</p>
                  <p className="font-medium text-blue-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Téléphone</p>
                  <p className="font-medium text-blue-900">{user.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Email</p>
                  <p className="font-medium text-blue-900">{user.email || 'Non renseigné (optionnel)'}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Rôle</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'pharmacien' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? 'Administrateur' :
                     user.role === 'pharmacien' ? 'Pharmacien' :
                     'Patient'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de test */}
          <div className="text-center mb-8">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Tests en cours...' : 'Lancer les tests'}
            </button>
          </div>

          {/* Résultats des tests */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Résultats des tests
              </h2>
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{result.test}</h3>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'SUCCÈS' : 'ÉCHEC'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Instructions de test
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Créez un compte patient avec téléphone uniquement (sans email)</li>
              <li>• Testez la connexion avec le numéro de téléphone</li>
              <li>• Vérifiez que la connexion par email échoue si pas d'email</li>
              <li>• Testez avec des identifiants invalides</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPhoneLogin;
