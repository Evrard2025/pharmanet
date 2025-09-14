import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Phone, Mail, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const TestRoleLogin: React.FC = () => {
  const { login, user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test 1: Connexion patient avec téléphone
    try {
      await login('0612345678', 'password123');
      if (user?.role === 'client') {
        addTestResult('Patient avec téléphone', true, 'Connexion réussie avec le numéro de téléphone');
      } else {
        addTestResult('Patient avec téléphone', false, 'Connexion réussie mais mauvais rôle');
      }
    } catch (error: any) {
      addTestResult('Patient avec téléphone', false, `Erreur: ${error.message}`);
    }

    // Test 2: Connexion professionnel avec email
    try {
      await login('pharmacien@example.com', 'password123');
      if (user?.role === 'pharmacien' || user?.role === 'admin') {
        addTestResult('Professionnel avec email', true, 'Connexion réussie avec l\'email');
      } else {
        addTestResult('Professionnel avec email', false, 'Connexion réussie mais mauvais rôle');
      }
    } catch (error: any) {
      addTestResult('Professionnel avec email', false, `Erreur: ${error.message}`);
    }

    // Test 3: Patient essaie de se connecter avec email (doit échouer)
    try {
      await login('patient@example.com', 'password123');
      addTestResult('Patient avec email', false, 'Connexion réussie (ne devrait pas)');
    } catch (error: any) {
      if (error.message.includes('patients doivent se connecter avec leur numéro de téléphone')) {
        addTestResult('Patient avec email', true, 'Connexion échouée comme attendu');
      } else {
        addTestResult('Patient avec email', false, `Erreur inattendue: ${error.message}`);
      }
    }

    // Test 4: Professionnel essaie de se connecter avec téléphone (doit échouer)
    try {
      await login('0698765432', 'password123');
      addTestResult('Professionnel avec téléphone', false, 'Connexion réussie (ne devrait pas)');
    } catch (error: any) {
      if (error.message.includes('professionnels doivent se connecter avec leur email')) {
        addTestResult('Professionnel avec téléphone', true, 'Connexion échouée comme attendu');
      } else {
        addTestResult('Professionnel avec téléphone', false, `Erreur inattendue: ${error.message}`);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Test de Connexion par Rôle
            </h1>
            <p className="text-gray-600">
              Vérification du système de connexion différencié selon le rôle
            </p>
          </div>

          {/* Règles du système */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Règles de connexion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Patients (clients)
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Se connectent avec leur <strong>numéro de téléphone</strong></li>
                  <li>• L'email est <strong>optionnel</strong> lors de l'inscription</li>
                  <li>• Ne peuvent pas se connecter avec un email</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Professionnels (pharmaciens/admins)
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Se connectent avec leur <strong>email</strong></li>
                  <li>• L'email est <strong>obligatoire</strong> lors de l'inscription</li>
                  <li>• Ne peuvent pas se connecter avec un téléphone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informations utilisateur actuel */}
          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Utilisateur connecté
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-green-700">Nom complet</p>
                  <p className="font-medium text-green-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Téléphone</p>
                  <p className="font-medium text-green-900">{user.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Email</p>
                  <p className="font-medium text-green-900">{user.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Rôle</p>
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
              <li>• Créez un compte patient avec téléphone uniquement</li>
              <li>• Créez un compte professionnel avec email obligatoire</li>
              <li>• Testez les connexions selon les règles ci-dessus</li>
              <li>• Vérifiez que les mauvais types de connexion échouent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRoleLogin;
