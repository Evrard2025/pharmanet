import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Heart, 
  Shield, 
  FileText, 
  ArrowRight,
  Stethoscope,
  Activity,
  UserCheck,
  BarChart3,
  Database,
  Settings,
  CheckCircle,
  Pill,
  FlaskConical,
  User,
  Calendar,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import logo from '../assets/logo.png';
import '../styles/Home.css';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Pas de redirection automatique - laisser l'utilisateur choisir
  // Tous les utilisateurs voient la même page d'accueil

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Gestion des Patients',
      description: 'Fiches patients complètes avec antécédents médicaux et historique des prescriptions.'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Suivi des Prescriptions',
      description: 'Gestion numérique des prescriptions et suivi des traitements en cours.'
    },
    {
      icon: <Pill className="w-8 h-8" />,
      title: 'Monographie des Médicaments',
      description: 'Base de données complète des médicaments avec DCI, classe thérapeutique et surveillance.'
    },
    {
      icon: <FlaskConical className="w-8 h-8" />,
      title: 'Surveillance Biologique',
      description: 'Suivi des paramètres hépatiques et rénaux avec rappels automatiques.'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Tableau de Bord',
              description: 'Statistiques complètes et indicateurs de performance de votre PharmaNet.'
    },
    {
      icon: <User className="w-8 h-8" />,
      title: 'Gestion des Utilisateurs',
      description: 'Administration complète des comptes utilisateurs et gestion des rôles.'
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Consultations',
      description: 'Suivi des consultations avec période et date de prise de médicaments.'
    }
  ];


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 container-padding">
          <div className="text-center">
            {/* Logo Section - Responsive */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="relative group logo-container">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative bg-white rounded-full p-2 sm:p-3 lg:p-4 xl:p-5 shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                  <img 
                    src={logo} 
                    alt="PharmaNet Logo" 
                    className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 drop-shadow-2xl object-contain" 
                  />
                </div>
                <div className="absolute -inset-2 sm:-inset-3 lg:-inset-4 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500"></div>
              </div>
            </div>
            
            {/* Title - Responsive */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Système de Gestion PharmaNet
            </h1>
            
            {/* Description - Responsive */}
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-primary-100 max-w-4xl mx-auto px-4 text-container">
              Solution complète pour la gestion des patients et prescriptions de votre réseau PharmaNet.
            </p>
            
            {/* Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              {isAuthenticated ? (
                <>
                  {(user?.role === 'admin' || user?.role === 'pharmacien') && (
                    <Link to="/admin" className="btn bg-white text-primary-600 hover:bg-gray-100">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Accéder au Dashboard
                    </Link>
                  )}
                  {/* Temporairement masqué
                  {user?.role === 'client' && (
                    <Link to="/patient" className="btn bg-white text-primary-600 hover:bg-gray-100">
                      <Pill className="w-4 h-4 mr-2" />
                      Mon Espace Patient
                    </Link>
                  )}
                  */}
                </>
              ) : (
                <>
                  <Link to="/login" className="btn bg-white text-primary-600 hover:bg-gray-100">
                    Se connecter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link to="/register" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Fonctionnalités Principales
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Un système complet de gestion pharmaceutique.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 feature-card fade-in">
                  <div className="text-primary-600 mb-3 sm:mb-4 flex justify-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>








      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 leading-tight">
            Modernisez votre Réseau PharmaNet
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-300 max-w-4xl mx-auto">
            Gérez efficacement vos patients et leurs prescriptions avec notre solution complète.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                {(user?.role === 'admin' || user?.role === 'pharmacien') && (
                  <Link to="/admin" className="btn bg-primary-600 text-white hover:bg-primary-700">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard PharmaNet
                  </Link>
                )}
                {/* Temporairement masqué
                {user?.role === 'client' && (
                  <Link to="/patient" className="btn bg-primary-600 text-white hover:bg-primary-700">
                    <Pill className="w-4 h-4 mr-2" />
                    Mon Espace Patient
                  </Link>
                )}
                */}
                {user?.role === 'admin' && (
                  <Link to="/admin/medicaments" className="btn border-2 border-white text-white hover:bg-white hover:text-gray-900">
                    <Pill className="w-4 h-4 mr-2" />
                    Gérer les Médicaments
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin/users" className="btn border-2 border-white text-white hover:bg-white hover:text-gray-900">
                    <User className="w-4 h-4 mr-2" />
                    Gérer les Utilisateurs
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="btn bg-primary-600 text-white hover:bg-primary-700">
                  <Database className="w-4 h-4 mr-2" />
                  Accès Professionnel
                </Link>
                <Link to="/register" className="btn border-2 border-white text-white hover:bg-white hover:text-gray-900">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 