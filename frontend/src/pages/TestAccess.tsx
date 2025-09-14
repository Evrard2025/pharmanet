import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Heart, AlertTriangle, CheckCircle } from 'lucide-react';

const TestAccess: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const testAccess = (path: string, requiredRole?: string, allowedRoles?: string[]) => {
    if (!isAuthenticated) {
      return { canAccess: false, reason: 'Non connecté' };
    }

    if (requiredRole && user?.role !== requiredRole) {
      return { canAccess: false, reason: `Rôle requis: ${requiredRole}, actuel: ${user?.role}` };
    }

    if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
      return { canAccess: false, reason: `Rôles autorisés: ${allowedRoles.join(', ')}, actuel: ${user?.role}` };
    }

    return { canAccess: true, reason: 'Accès autorisé' };
  };

  const accessTests = [
    { path: '/', name: 'Page d\'accueil', roles: ['client', 'pharmacien', 'admin'] },
    { path: '/admin', name: 'Dashboard Admin', roles: ['pharmacien', 'admin'] },
    { path: '/admin/users', name: 'Gestion Utilisateurs', roles: ['admin'] },
    { path: '/admin/patients', name: 'Gestion Patients', roles: ['pharmacien', 'admin'] },
    { path: '/profile', name: 'Profil', roles: ['client', 'pharmacien', 'admin'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Test de Contrôle d'Accès
            </h1>
            <p className="text-gray-600">
              Vérification des permissions selon le rôle de l'utilisateur
            </p>
          </div>

          {/* Informations utilisateur */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informations de l'utilisateur
            </h2>
            {isAuthenticated && user ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rôle</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
            ) : (
              <p className="text-gray-600">Non connecté</p>
            )}
          </div>

          {/* Tests d'accès */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Tests d'accès aux pages
            </h2>
            
            {accessTests.map((test, index) => {
              const result = testAccess(test.path, undefined, test.roles);
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.path}</p>
                      <p className="text-xs text-gray-500">
                        Rôles autorisés: {test.roles.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {result.canAccess ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        result.canAccess ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.canAccess ? 'Autorisé' : 'Refusé'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{result.reason}</p>
                </div>
              );
            })}
          </div>

          {/* Actions de test */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Actions de test
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aller à l'accueil
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Aller au dashboard
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Instructions de test
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Connectez-vous avec différents comptes (patient, pharmacien, admin)</li>
              <li>• Vérifiez que les accès correspondent aux rôles</li>
              <li>• Testez les redirections automatiques</li>
              <li>• Vérifiez que les patients ne peuvent pas accéder au dashboard admin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAccess;
