import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Star, 
  Award, 
  Target, 
  Gift, 
  TrendingUp, 
  Clock, 
  Heart,
  Zap,
  Shield,
  FileText
} from 'lucide-react';
import api from '../services/api';

interface LoyaltyProfile {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    loyaltyPoints: number;
    loyaltyLevel: string;
  };
  levelInfo: {
    currentLevel: string;
    currentPoints: number;
    nextLevel: string | null;
    pointsNeeded: number;
    progress: number;
  };
}

interface LoyaltyHistory {
  id: number;
  date: string;
  orderTotal: number;
  pointsEarned: number;
  pointsUsed: number;
  netPoints: number;
}

interface LoyaltyBenefits {
  [key: string]: {
    name: string;
    minPoints: number;
    maxPoints: number | null;
    benefits: string[];
  };
}

const Loyalty: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // Récupérer le profil de fidélité
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'loyaltyProfile',
    () => api.get('/loyalty/profile')
  );

  // Récupérer l'historique des points
  const { data: historyData, isLoading: historyLoading } = useQuery(
    'loyaltyHistory',
    () => api.get('/loyalty/history')
  );

  // Récupérer les avantages par niveau
  const { data: benefitsData } = useQuery(
    'loyaltyBenefits',
    () => api.get('/loyalty/benefits')
  );

  const profile: LoyaltyProfile = profileData?.data?.profile || {
    user: { id: 0, firstName: '', lastName: '', loyaltyPoints: 0, loyaltyLevel: 'bronze' },
    levelInfo: { currentLevel: 'bronze', currentPoints: 0, nextLevel: null, pointsNeeded: 0, progress: 0 }
  };

  const history: LoyaltyHistory[] = historyData?.data?.history || [];
  const benefits: LoyaltyBenefits = benefitsData?.data?.benefits || {};

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-amber-600 bg-amber-100 border-amber-300';
      case 'argent': return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'or': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'platine': return 'text-purple-600 bg-purple-100 border-purple-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Star className="w-5 h-5" />;
      case 'argent': return <Award className="w-5 h-5" />;
      case 'or': return <Target className="w-5 h-5" />;
      case 'platine': return <Gift className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'bronze': return 'Bronze';
      case 'argent': return 'Argent';
      case 'or': return 'Or';
      case 'platine': return 'Platine';
      default: return level;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-8">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Programme de Fidélité
          </h1>
          <p className="text-gray-600">
            Découvrez vos avantages et suivez votre progression
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', name: 'Mon Profil', icon: <Heart className="w-4 h-4" /> },
              { id: 'history', name: 'Historique', icon: <Clock className="w-4 h-4" /> },
              { id: 'benefits', name: 'Avantages', icon: <Gift className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profile.user.firstName} {profile.user.lastName}
                    </h2>
                    <p className="text-gray-600">Membre depuis le programme de fidélité</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getLevelColor(profile.levelInfo.currentLevel)}`}>
                    {getLevelIcon(profile.levelInfo.currentLevel)}
                    <span className="font-semibold capitalize">{getLevelName(profile.levelInfo.currentLevel)}</span>
                  </div>
                </div>

                {/* Points Display */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Vos Points Fidélité</p>
                      <p className="text-3xl font-bold">{profile.user.loyaltyPoints.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100">Niveau Actuel</p>
                      <p className="text-xl font-semibold">{getLevelName(profile.levelInfo.currentLevel)}</p>
                    </div>
                  </div>
                </div>

                {/* Progress to Next Level */}
                {profile.levelInfo.nextLevel && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progression vers {getLevelName(profile.levelInfo.nextLevel)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {profile.levelInfo.currentPoints} / {profile.levelInfo.pointsNeeded + profile.levelInfo.currentPoints}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(profile.levelInfo.progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Il vous faut encore {profile.levelInfo.pointsNeeded} points pour passer au niveau {getLevelName(profile.levelInfo.nextLevel)}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{profile.user.loyaltyPoints}</p>
                    <p className="text-xs text-gray-600">Points Totaux</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{getLevelName(profile.levelInfo.currentLevel)}</p>
                    <p className="text-xs text-gray-600">Niveau Actuel</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mb-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.levelInfo.nextLevel ? profile.levelInfo.pointsNeeded : 0}
                    </p>
                    <p className="text-xs text-gray-600">Points Manquants</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Historique des Points</h3>
            </div>
            <div className="overflow-x-auto">
              {history.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun historique disponible pour le moment.</p>
                  <p className="text-sm">Vos transactions apparaîtront ici.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Gagnés
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Utilisés
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Commande #{item.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.orderTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            +{item.pointsEarned}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.pointsUsed > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              -{item.pointsUsed}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.netPoints >= 0 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.netPoints >= 0 ? '+' : ''}{item.netPoints}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vos Avantages</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(benefits).map(([level, levelBenefits]) => (
                    <div 
                      key={level} 
                      className={`border rounded-lg p-6 ${
                        level === profile.levelInfo.currentLevel 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : level === 'bronze' || 
                            (level === 'argent' && profile.user.loyaltyLevel !== 'bronze') ||
                            (level === 'or' && ['argent', 'or', 'platine'].includes(profile.user.loyaltyLevel)) ||
                            (level === 'platine' && profile.user.loyaltyLevel === 'platine')
                          ? 'border-gray-200'
                          : 'border-gray-200 opacity-50'
                      }`}
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                        level === profile.levelInfo.currentLevel 
                          ? 'bg-blue-100 text-blue-600' 
                          : getLevelColor(level)
                      } mb-4`}>
                        {getLevelIcon(level)}
                      </div>
                      <h4 className={`font-semibold text-lg mb-2 ${
                        level === profile.levelInfo.currentLevel ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {levelBenefits.name}
                        {level === profile.levelInfo.currentLevel && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Actuel
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {levelBenefits.minPoints} - {levelBenefits.maxPoints || '∞'} points
                      </p>
                      <ul className="space-y-2">
                        {levelBenefits.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${
                              level === profile.levelInfo.currentLevel 
                                ? 'bg-blue-500' 
                                : level === 'bronze' || 
                                  (level === 'argent' && profile.user.loyaltyLevel !== 'bronze') ||
                                  (level === 'or' && ['argent', 'or', 'platine'].includes(profile.user.loyaltyLevel)) ||
                                  (level === 'platine' && profile.user.loyaltyLevel === 'platine')
                                ? 'bg-gray-400'
                                : 'bg-gray-300'
                            }`}></div>
                            <span className={`text-sm ${
                              level === profile.levelInfo.currentLevel 
                                ? 'text-blue-900' 
                                : level === 'bronze' || 
                                  (level === 'argent' && profile.user.loyaltyLevel !== 'bronze') ||
                                  (level === 'or' && ['argent', 'or', 'platine'].includes(profile.user.loyaltyLevel)) ||
                                  (level === 'platine' && profile.user.loyaltyLevel === 'platine')
                                ? 'text-gray-700'
                                : 'text-gray-400'
                            }`}>
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* How to earn points */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Comment Gagner des Points</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                      <Gift className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Achats</h4>
                    <p className="text-sm text-gray-600">1 point par euro dépensé</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Consultations</h4>
                    <p className="text-sm text-gray-600">10 points par consultation</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Ordonnances</h4>
                    <p className="text-sm text-gray-600">5 points par ordonnance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loyalty; 