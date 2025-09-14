import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Pill, Calendar, User, Bell } from 'lucide-react';

const PatientSpace: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Retour à l'accueil
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bonjour, {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600">Bienvenue sur votre espace patient</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">En ligne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations du profil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profil</h3>
                <p className="text-gray-600">Informations personnelles</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {user?.email}
              </p>
              {user?.phone && (
                <p className="text-sm text-gray-600">
                  <strong>Téléphone:</strong> {user.phone}
                </p>
              )}
              {user?.address && (
                <p className="text-sm text-gray-600">
                  <strong>Adresse:</strong> {user.address}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Santé</h3>
                <p className="text-gray-600">Suivi médical</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Accédez à vos prescriptions et suivi médical
              </p>
            </div>
          </div>
        </div>

        {/* Services disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            to="/patient/prescriptions" 
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mes Prescriptions
            </h3>
            <p className="text-gray-600 text-sm">
              Consultez vos prescriptions en cours
            </p>
          </Link>

          <Link 
            to="/patient/reminders" 
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rappels
            </h3>
            <p className="text-gray-600 text-sm">
              Rappels de prise de médicaments
            </p>
          </Link>

          <Link 
            to="/patient/history" 
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Historique
            </h3>
            <p className="text-gray-600 text-sm">
              Votre historique médical
            </p>
          </Link>
        </div>

        {/* Message d'information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Heart className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Bienvenue dans votre espace patient
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Vous pouvez maintenant accéder à tous vos services de santé personnalisés. 
                  Consultez vos prescriptions et gérez vos rappels de médicaments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSpace;
