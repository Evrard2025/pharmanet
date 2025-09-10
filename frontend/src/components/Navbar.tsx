import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Heart,
  Shield,
  Users,
  FileText,
  Pill,
  FlaskConical,
  Activity
} from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const getLoyaltyBadgeClass = (level: string) => {
    switch (level) {
      case 'bronze': return 'badge-bronze';
      case 'argent': return 'badge-silver';
      case 'or': return 'badge-gold';
      case 'platine': return 'badge-platinum';
      default: return 'badge-primary';
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to={isAuthenticated && (user?.role === 'admin' || user?.role === 'pharmacien') ? '/admin' : '/'} 
              className="flex-shrink-0 flex items-center hover:scale-105 transition-transform duration-200"
            >
              <div className="relative">
                <img src={logo} alt="PharmaNet Logo" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-lg" />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-20 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-2 sm:ml-3 md:ml-4 text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                <span className="hidden sm:inline">PharmaNet </span>
                
              </span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Accueil
            </Link>
            {isAuthenticated && (
              <>
                {user?.role === 'client' && (
                  <Link to="/loyalty" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Fidélité
                  </Link>
                )}
                {(user?.role === 'admin' || user?.role === 'pharmacien') && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    {user?.role === 'admin' ? 'Administration' : 'Dashboard'}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-primary-600 p-1 sm:p-2 rounded-md"
                  >
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.firstName}
                    </span>
                    {user?.loyaltyLevel && (
                      <span className={`badge ${getLoyaltyBadgeClass(user.loyaltyLevel)} hidden sm:inline-block`}>
                        {user.loyaltyLevel}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profil
                      </Link>
                      {user?.role === 'client' && (
                        <Link
                          to="/loyalty"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Fidélité
                        </Link>
                      )}
                      {(user?.role === 'admin' || user?.role === 'pharmacien') && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Link
                            to="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            {user?.role === 'admin' ? 'Administration' : 'Dashboard'}
                          </Link>
                          <Link
                            to="/admin/patients"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Patients
                          </Link>
                          <Link
                            to="/admin/consultations"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Consultations
                          </Link>
                                                      <Link
                              to="/admin/medicaments"
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Pill className="w-4 h-4 mr-2" />
                              Médicaments
                            </Link>
                            <Link
                              to="/admin/surveillance-biologique"
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Activity className="w-4 h-4 mr-2" />
                              Surveillance Biologique
                            </Link>
                          <Link
                            to="/admin/surveillance"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FlaskConical className="w-4 h-4 mr-2" />
                            Surveillance
                          </Link>
                          <Link
                            to="/admin/consultation-medicaments"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Pill className="w-4 h-4 mr-2" />
                            Consultation Médicaments
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin/users"
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Utilisateurs
                            </Link>
                          )}
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary">
                  Inscription
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-3 pt-2 pb-3 space-y-1 bg-white border-t">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
            >
              Accueil
            </Link>
            {isAuthenticated && (
              <>
                {user?.role === 'client' && (
                  <Link
                    to="/loyalty"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                  >
                    Fidélité
                  </Link>
                )}
                {(user?.role === 'admin' || user?.role === 'pharmacien') && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                    >
                      {user?.role === 'admin' ? 'Administration' : 'Dashboard'}
                    </Link>
                    <Link
                      to="/admin/patients"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                    >
                      Patients
                    </Link>
                    <Link
                      to="/admin/consultations"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                    >
                      Consultations
                    </Link>
                    <Link
                      to="/admin/medicaments"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                    >
                      Médicaments
                    </Link>
                    <Link
                      to="/admin/surveillance"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                    >
                      Surveillance
                    </Link>
                    <Link
                      to="/admin/consultation-medicaments"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                    >
                      Consultation Médicaments
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/users"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-gray-700 hover:text-primary-600 block px-3 py-2.5 rounded-md text-base font-medium"
                      >
                        Utilisateurs
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 