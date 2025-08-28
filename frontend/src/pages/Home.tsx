import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Heart, 
  Shield, 
  FileText, 
  Star,
  ArrowRight,
  Stethoscope,
  Activity,
  Award,
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

  // Pas de redirection automatique - les utilisateurs peuvent naviguer librement

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Gestion des Patients',
      description: 'Fiches patients complètes avec antécédents médicaux et historique des prescriptions.'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Suivi des Ordonnances',
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
      icon: <Heart className="w-8 h-8" />,
      title: 'Programme Fidélité',
      description: 'Système de points de fidélité automatique pour récompenser vos patients.'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Tableau de Bord',
      description: 'Statistiques complètes et indicateurs de performance de votre pharmacie.'
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

  const modules = [
    { name: 'Dashboard', icon: <BarChart3 className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600', link: '/admin' },
    { name: 'Patients', icon: <UserCheck className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', link: '/admin/patients' },
    { name: 'Consultations', icon: <Calendar className="w-6 h-6" />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/consultations' },
    { name: 'Médicaments', icon: <Pill className="w-6 h-6" />, color: 'bg-green-100 text-green-600', link: '/admin/medicaments' },
    { name: 'Surveillance Bio.', icon: <FlaskConical className="w-6 h-6" />, color: 'bg-red-100 text-red-600', link: '/admin/surveillance-biologique' },
    { name: 'Surveillance', icon: <Activity className="w-6 h-6" />, color: 'bg-yellow-100 text-yellow-600', link: '/admin/surveillance' },
    { name: 'Ordonnances', icon: <FileText className="w-6 h-6" />, color: 'bg-emerald-100 text-emerald-600', link: '/admin/prescriptions' },
    { name: 'Consultation Méd.', icon: <Search className="w-6 h-6" />, color: 'bg-cyan-100 text-cyan-600', link: '/admin/consultation-medicaments' },
    { name: 'Fidélité', icon: <Award className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600', link: '/admin/loyalty', adminOnly: true },
    { name: 'Utilisateurs', icon: <User className="w-6 h-6" />, color: 'bg-gray-100 text-gray-600', link: '/admin/users', adminOnly: true }
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
              Système de Gestion de Pharmacie
            </h1>
            
            {/* Description - Responsive */}
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-primary-100 max-w-4xl mx-auto px-4 text-container">
              Solution complète pour la gestion des patients, ordonnances et programme de fidélité de votre pharmacie.
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
                                     {user?.role === 'client' && (
                     <Link to="/loyalty" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600">
                       <Heart className="w-4 h-4 mr-2" />
                       Mon Profil Fidélité
                     </Link>
                   )}
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
              Un système complet de gestion pharmaceutique avec programme de fidélité intégré.
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

      {/* Modules Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Modules de Gestion
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Accédez rapidement aux différents modules de votre système de gestion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
             {modules
               .filter(module => !module.adminOnly || user?.role === 'admin')
               .map((module, index) => (
               <Link
                 key={index}
                 to={isAuthenticated && (user?.role === 'admin' || user?.role === 'pharmacien') ? module.link : '/login'}
                 className="group block"
               >
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center module-card fade-in">
                  <div className={`${module.color} rounded-full p-2 sm:p-3 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-6 lg:h-6 flex items-center justify-center">
                      {module.icon}
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {module.name}
                  </h3>
                  {!isAuthenticated && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">Connexion requise</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>







      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 leading-tight">
            Modernisez votre Pharmacie
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-300 max-w-4xl mx-auto">
            Gérez efficacement vos patients, leurs ordonnances et fidélisez votre clientèle avec notre solution complète.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                {(user?.role === 'admin' || user?.role === 'pharmacien') && (
                  <Link to="/admin" className="btn bg-primary-600 text-white hover:bg-primary-700">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard Pharmacien
                  </Link>
                )}
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