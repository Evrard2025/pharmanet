import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Settings, 
  Star,
  Gift,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface LoyaltyStats {
  totalUsers: number;
  totalPoints: number;
  avgPoints: number;
  levelStats: Array<{
    loyaltyLevel: string;
    count: number;
    avgPoints: number;
  }>;
  topCustomers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    loyaltyPoints: number;
    loyaltyLevel: string;
  }>;
}

interface LoyaltyConfig {
  pointsPerEuro: number;
  pointsPerConsultation: number;
  pointsPerPrescription: number;
  levels: {
    bronze: { min: number; max: number };
    argent: { min: number; max: number };
    or: { min: number; max: number };
    platine: { min: number; max: number };
  };
}

const AdminLoyalty: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState<LoyaltyConfig>({
    pointsPerEuro: 1,
    pointsPerConsultation: 10,
    pointsPerPrescription: 5,
    levels: {
      bronze: { min: 0, max: 99 },
      argent: { min: 100, max: 499 },
      or: { min: 500, max: 999 },
      platine: { min: 1000, max: 9999 }
    }
  });
  const queryClient = useQueryClient();

  // Récupérer les statistiques de fidélité
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'loyaltyStats',
    () => api.get('/loyalty/stats'),
    {
      refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
    }
  );

  // Récupérer les avantages par niveau
  const { data: benefitsData } = useQuery(
    'loyaltyBenefits',
    () => api.get('/loyalty/benefits')
  );

  // Mutation pour mettre à jour la configuration
  const updateConfigMutation = useMutation(
    (newConfig: LoyaltyConfig) => api.post('/loyalty/config', newConfig),
    {
      onSuccess: () => {
        toast.success('Configuration mise à jour avec succès');
        setShowConfigModal(false);
        queryClient.invalidateQueries('loyaltyStats');
      },
      onError: () => {
        toast.error('Erreur lors de la mise à jour de la configuration');
      },
    }
  );

  const stats: LoyaltyStats = statsData?.data?.stats || {
    totalUsers: 0,
    totalPoints: 0,
    avgPoints: 0,
    levelStats: [],
    topCustomers: []
  };

  const benefits = benefitsData?.data?.benefits || {};

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate(config);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-amber-600 bg-amber-100';
      case 'argent': return 'text-gray-600 bg-gray-100';
      case 'or': return 'text-yellow-600 bg-yellow-100';
      case 'platine': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Star className="w-4 h-4" />;
      case 'argent': return <Award className="w-4 h-4" />;
      case 'or': return <Target className="w-4 h-4" />;
      case 'platine': return <Gift className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion de la Fidélité
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez le programme de fidélité et suivez les statistiques
            </p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configuration
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'stats', name: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'benefits', name: 'Avantages', icon: <Gift className="w-4 h-4" /> },
              { id: 'customers', name: 'Top Clients', icon: <Users className="w-4 h-4" /> }
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
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Points Totaux</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Points Moyens</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgPoints)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Niveaux Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.levelStats.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Distribution */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Répartition par Niveau</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {stats.levelStats.map((level) => (
                    <div key={level.loyaltyLevel} className="text-center p-4 border rounded-lg">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getLevelColor(level.loyaltyLevel)} mb-2`}>
                        {getLevelIcon(level.loyaltyLevel)}
                      </div>
                      <h4 className="font-semibold text-gray-900 capitalize">{level.loyaltyLevel}</h4>
                      <p className="text-2xl font-bold text-blue-600">{level.count}</p>
                      <p className="text-sm text-gray-600">{Math.round(level.avgPoints)} pts en moyenne</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Avantages par Niveau</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(benefits).map(([level, levelBenefits]: [string, any]) => (
                  <div key={level} className="border rounded-lg p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getLevelColor(level)} mb-4`}>
                      {getLevelIcon(level)}
                    </div>
                    <h4 className="font-semibold text-gray-900 capitalize mb-2">{levelBenefits.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {levelBenefits.minPoints} - {levelBenefits.maxPoints || '∞'} points
                    </p>
                    <ul className="space-y-2">
                      {levelBenefits.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top 10 Clients les Plus Fidèles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Niveau
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100 text-yellow-600' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="text-sm font-semibold">{index + 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-semibold text-gray-600">
                              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          {customer.loyaltyPoints.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(customer.loyaltyLevel)}`}>
                          {getLevelIcon(customer.loyaltyLevel)}
                          <span className="ml-1 capitalize">{customer.loyaltyLevel}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration de la Fidélité</h3>
                <form onSubmit={handleConfigSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points par Euro dépensé</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.pointsPerEuro}
                      onChange={(e) => setConfig({...config, pointsPerEuro: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points par Consultation</label>
                    <input
                      type="number"
                      min="0"
                      value={config.pointsPerConsultation}
                      onChange={(e) => setConfig({...config, pointsPerConsultation: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points par Ordonnance</label>
                    <input
                      type="number"
                      min="0"
                      value={config.pointsPerPrescription}
                      onChange={(e) => setConfig({...config, pointsPerPrescription: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLoyalty; 