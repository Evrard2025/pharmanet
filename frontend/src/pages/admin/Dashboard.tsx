import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Activity,
  Award,
  Clock,
  FileText,
  Circle
} from 'lucide-react';
import api from '../../services/api';

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalConsultations: number;
  loyaltyStats: {
    totalPoints: number;
    avgPoints: number;
    activeUsers: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'consultation' | 'user';
    title: string;
    description: string;
    date: string;
  }>;
  monthlyStats: {
    consultations: number;
  };
}

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const navigate = useNavigate();

  // Récupérer les statistiques du dashboard
  const { data: statsData, isLoading } = useQuery(
    ['dashboardStats', selectedPeriod],
    () => api.get(`/api/dashboard/stats?period=${selectedPeriod}`),
    {
      refetchInterval: 60000 // Rafraîchir toutes les minutes
    }
  );

  const stats: DashboardStats = statsData?.data?.stats || {
    totalUsers: 0,
    totalPatients: 0,
    totalConsultations: 0,
    loyaltyStats: {
      totalPoints: 0,
      avgPoints: 0,
      activeUsers: 0
    },
    recentActivity: [],
    monthlyStats: {
      consultations: 0
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'user': return <Users className="w-4 h-4 text-orange-600" />;
      default: return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble de votre pharmacie et de vos performances
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>

        {/* Quick Actions - Mise en premier lieu */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actions Rapides</h3>
            <p className="text-sm text-gray-600 mt-1">Accès direct aux fonctionnalités principales</p>
          </div>
          <div className="p-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <button 
                 onClick={() => navigate('/admin/patients')}
                 className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
               >
                 <div className="p-3 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                   <Users className="w-6 h-6 text-blue-600" />
                 </div>
                 <span className="font-medium text-gray-900">Nouveau Patient</span>
                 <span className="text-sm text-gray-500 mt-1">Ajouter un patient</span>
               </button>
               <button 
                 onClick={() => navigate('/admin/consultations')}
                 className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 group"
               >
                 <div className="p-3 bg-purple-100 rounded-full mb-3 group-hover:bg-purple-200 transition-colors">
                   <FileText className="w-6 h-6 text-purple-600" />
                 </div>
                 <span className="font-medium text-gray-900">Nouvelle Consultation</span>
                 <span className="text-sm text-gray-500 mt-1">Créer une consultation</span>
               </button>
               <button 
                 onClick={() => navigate('/admin/loyalty')}
                 className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 group"
               >
                 <div className="p-3 bg-green-100 rounded-full mb-3 group-hover:bg-green-200 transition-colors">
                   <Award className="w-6 h-6 text-green-600" />
                 </div>
                 <span className="font-medium text-gray-900">Gestion Fidélité</span>
                 <span className="text-sm text-gray-500 mt-1">Gérer les points</span>
               </button>
               <button 
                 onClick={() => navigate('/admin/patients')}
                 className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 group"
               >
                 <div className="p-3 bg-orange-100 rounded-full mb-3 group-hover:bg-orange-200 transition-colors">
                   <Activity className="w-6 h-6 text-orange-600" />
                 </div>
                 <span className="font-medium text-gray-900">Voir Patients & Consultations</span>
                 <span className="text-sm text-gray-500 mt-1">Consulter les fiches</span>
               </button>
             </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12% ce mois</span>
              </div>
            </div>
          </div>

          {/* Total Patients */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalPatients)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8% ce mois</span>
              </div>
            </div>
          </div>

          {/* Total Consultations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Consultations</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalConsultations)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+15% ce mois</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Consultations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultations</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalConsultations)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Fidélité</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.loyaltyStats.totalPoints)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Aperçu Mensuel</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Consultations</p>
                  <p className="text-2xl font-bold text-orange-600">{formatNumber(stats.monthlyStats.consultations)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Activité Récente</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune activité récente</p>
                  </div>
                ) : (
                  stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Dashboard; 