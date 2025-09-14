import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { 
  ArrowLeft, 
  Pill, 
  Calendar, 
  Clock, 
  User, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Prescription {
  id: number;
  patientId: number;
  medicamentId: number;
  posologie: string;
  duree: number;
  instructions: string;
  dateDebut: string;
  dateFin: string;
  statut: 'active' | 'terminee' | 'suspendue';
  medicament: {
    nom: string;
    dci: string;
    forme: string;
    dosage: string;
  };
}

const MyPrescriptions: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'terminee' | 'suspendue'>('all');

  // Récupérer les prescriptions du patient
  const { data: prescriptions, isLoading, error } = useQuery(
    ['prescriptions', user?.id],
    async () => {
      const response = await api.get(`/api/prescriptions/patient/${user?.id}`);
      return response.data;
    },
    {
      enabled: !!user?.id,
    }
  );

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'terminee':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'suspendue':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'active':
        return 'Active';
      case 'terminee':
        return 'Terminée';
      case 'suspendue':
        return 'Suspendue';
      default:
        return 'En attente';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'terminee':
        return 'bg-gray-100 text-gray-800';
      case 'suspendue':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredPrescriptions = prescriptions?.filter((prescription: Prescription) => 
    filter === 'all' || prescription.statut === filter
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos prescriptions...</p>
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
          <p className="text-gray-600 mb-4">Impossible de charger vos prescriptions.</p>
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
                <Pill className="w-8 h-8 mr-3 text-primary-600" />
                Mes Prescriptions
              </h1>
              <p className="text-gray-600 mt-2">
                Consultez vos prescriptions en cours et terminées
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({prescriptions?.length || 0})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Actives ({prescriptions?.filter((p: Prescription) => p.statut === 'active').length || 0})
            </button>
            <button
              onClick={() => setFilter('terminee')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'terminee'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Terminées ({prescriptions?.filter((p: Prescription) => p.statut === 'terminee').length || 0})
            </button>
            <button
              onClick={() => setFilter('suspendue')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'suspendue'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Suspendues ({prescriptions?.filter((p: Prescription) => p.statut === 'suspendue').length || 0})
            </button>
          </div>
        </div>

        {/* Liste des prescriptions */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune prescription trouvée
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "Vous n'avez aucune prescription pour le moment."
                : `Aucune prescription ${filter === 'active' ? 'active' : filter === 'terminee' ? 'terminée' : 'suspendue'} trouvée.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription: Prescription) => (
              <div key={prescription.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(prescription.statut)}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prescription.medicament.nom}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {prescription.medicament.dci} - {prescription.medicament.forme}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.statut)}`}>
                    {getStatusText(prescription.statut)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Début</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(prescription.dateDebut).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Fin</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(prescription.dateFin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Durée</p>
                      <p className="text-sm font-medium text-gray-900">
                        {prescription.duree} jours
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Pill className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Dosage</p>
                      <p className="text-sm font-medium text-gray-900">
                        {prescription.medicament.dosage}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start">
                    <FileText className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Posologie</p>
                      <p className="text-sm text-gray-900">{prescription.posologie}</p>
                    </div>
                  </div>
                  
                  {prescription.instructions && (
                    <div className="flex items-start mt-3">
                      <AlertCircle className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Instructions spéciales</p>
                        <p className="text-sm text-gray-900">{prescription.instructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPrescriptions;
