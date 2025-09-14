import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { 
  ArrowLeft, 
  Heart, 
  Calendar, 
  FileText, 
  Pill, 
  Activity,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MedicalRecord {
  id: number;
  type: 'consultation' | 'prescription' | 'surveillance' | 'traitement';
  date: string;
  title: string;
  description: string;
  doctor?: string;
  status?: string;
  medicament?: {
    nom: string;
    dci: string;
  };
  values?: {
    parameter: string;
    value: string;
    unit: string;
    normal: boolean;
  }[];
}

const MedicalHistory: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'consultation' | 'prescription' | 'surveillance' | 'traitement'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  // Récupérer l'historique médical du patient
  const { data: medicalHistory, isLoading, error } = useQuery(
    ['medical-history', user?.id],
    async () => {
      const response = await api.get(`/api/medical-history/patient/${user?.id}`);
      return response.data;
    },
    {
      enabled: !!user?.id,
    }
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'prescription':
        return <Pill className="w-5 h-5 text-green-600" />;
      case 'surveillance':
        return <Activity className="w-5 h-5 text-red-600" />;
      case 'traitement':
        return <Heart className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'prescription':
        return 'bg-green-100 text-green-800';
      case 'surveillance':
        return 'bg-red-100 text-red-800';
      case 'traitement':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation';
      case 'prescription':
        return 'Prescription';
      case 'surveillance':
        return 'Surveillance';
      case 'traitement':
        return 'Traitement';
      default:
        return 'Autre';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const filterByTime = (records: MedicalRecord[]) => {
    if (timeFilter === 'all') return records;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return records.filter(record => new Date(record.date) >= filterDate);
  };

  const filteredHistory = medicalHistory ? 
    filterByTime(medicalHistory.filter((record: MedicalRecord) => 
      filter === 'all' || record.type === filter
    )) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre historique médical...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger votre historique médical.</p>
          <Link to="/" className="btn bg-primary-600 text-white">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-primary-600" />
                Historique Médical
              </h1>
              <p className="text-gray-600 mt-2">
                Consultez votre historique médical complet
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les types</option>
                <option value="consultation">Consultations</option>
                <option value="prescription">Prescriptions</option>
                <option value="surveillance">Surveillance</option>
                <option value="traitement">Traitements</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Période:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toute la période</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="year">12 derniers mois</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Consultations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalHistory?.filter((r: MedicalRecord) => r.type === 'consultation').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Pill className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalHistory?.filter((r: MedicalRecord) => r.type === 'prescription').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Surveillances</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalHistory?.filter((r: MedicalRecord) => r.type === 'surveillance').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Traitements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalHistory?.filter((r: MedicalRecord) => r.type === 'traitement').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun historique trouvé
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "Votre historique médical est vide pour le moment."
                : `Aucun ${getTypeText(filter).toLowerCase()} trouvé pour la période sélectionnée.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistory.map((record: MedicalRecord, index: number) => (
              <div key={record.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getTypeIcon(record.type)}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {record.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                      {getTypeText(record.type)}
                    </span>
                    {record.status && getStatusIcon(record.status)}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700">{record.description}</p>
                </div>

                {record.doctor && (
                  <div className="flex items-center mb-4">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <strong>Médecin:</strong> {record.doctor}
                    </span>
                  </div>
                )}

                {record.medicament && (
                  <div className="flex items-center mb-4">
                    <Pill className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <strong>Médicament:</strong> {record.medicament.nom} ({record.medicament.dci})
                    </span>
                  </div>
                )}

                {record.values && record.values.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Paramètres mesurés:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {record.values.map((value, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{value.parameter}</span>
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              value.normal ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {value.value} {value.unit}
                            </span>
                            {value.normal ? (
                              <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message d'information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Heart className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Votre historique médical
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Cet historique regroupe toutes vos consultations, prescriptions, 
                  surveillances biologiques et traitements. Il vous permet de suivre 
                  l'évolution de votre santé au fil du temps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
