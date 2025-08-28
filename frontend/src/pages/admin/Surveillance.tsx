import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FlaskConical, User, Pill, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
}

interface Medicament {
  id: number;
  nomCommercial: string;
  dci: string;
  classeTherapeutique: string;
}

interface SurveillanceBiologique {
  id: number;
  patientId: number;
  medicamentId: number;
  typeSurveillance: 'hepatique' | 'renale' | 'mixte';
  dateDebutSurveillance: string;
  dateProchaineAnalyse: string;
  frequenceMois: number;
  statut: 'actif' | 'suspendu' | 'termine';
  commentaires?: string;
  patient: Patient;
  medicament: Medicament;
  createdAt: string;
  updatedAt: string;
}

interface ResultatAnalyse {
  id: number;
  surveillanceId: number;
  dateAnalyse: string;
  parametresHepatiques?: {
    transaminases?: number;
    bilirubine?: number;
    phosphataseAlcaline?: number;
    ggt?: number;
  };
  parametresRenaux?: {
    creatinine?: number;
    uree?: number;
    clairanceCreatinine?: number;
    proteinurie?: number;
  };
  interpretation: string;
  recommandations?: string;
  statut: 'normal' | 'anormal' | 'critique';
  createdAt: string;
}

interface NewSurveillanceForm {
  patientId: number;
  medicamentId: number;
  typeSurveillance: 'hepatique' | 'renale' | 'mixte';
  dateDebutSurveillance: string;
  frequenceMois: number;
  commentaires: string;
}

const Surveillance: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSurveillance, setSelectedSurveillance] = useState<SurveillanceBiologique | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const queryClient = useQueryClient();

  // Récupérer les surveillances
  const { data: surveillanceData, isLoading } = useQuery(
    ['surveillance', currentPage, searchTerm, selectedType, selectedStatut],
    () => api.get(`/api/surveillance?page=${currentPage}&search=${searchTerm}&typeSurveillance=${selectedType}&statut=${selectedStatut}`),
    {
      keepPreviousData: true
    }
  );

  // Récupérer les patients
  const { data: patientsData } = useQuery(
    ['patients'],
    () => api.get('/api/patients')
  );

  // Récupérer les médicaments
  const { data: medicamentsData } = useQuery(
    ['medicaments'],
    () => api.get('/api/medicaments')
  );

  const surveillances: SurveillanceBiologique[] = surveillanceData?.data?.surveillances || [];
  const totalPages = surveillanceData?.data?.totalPages || 1;
  const patients: Patient[] = patientsData?.data?.patients || [];
  const medicaments: Medicament[] = medicamentsData?.data?.medicaments || [];

  // Créer une nouvelle surveillance
  const createSurveillance = useMutation(
    (data: NewSurveillanceForm) => api.post('/api/surveillance', data),
    {
      onSuccess: () => {
        toast.success('Surveillance créée avec succès');
        setIsModalOpen(false);
        queryClient.invalidateQueries(['surveillance']);
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
          toast.error(`Erreurs de validation: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de la création de la surveillance');
        }
      }
    }
  );

  // Supprimer une surveillance
  const deleteSurveillance = useMutation(
    (id: number) => api.delete(`/api/surveillance/${id}`),
    {
      onSuccess: () => {
        toast.success('Surveillance supprimée avec succès');
        queryClient.invalidateQueries(['surveillance']);
      },
      onError: () => {
        toast.error('Erreur lors de la suppression de la surveillance');
      }
    }
  );

  const handleSubmitSurveillance = (data: NewSurveillanceForm) => {
    createSurveillance.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette surveillance ?')) {
      deleteSurveillance.mutate(id);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hepatique': return 'bg-yellow-100 text-yellow-800';
      case 'renale': return 'bg-blue-100 text-blue-800';
      case 'mixte': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'hepatique': return 'Hépatique';
      case 'renale': return 'Rénale';
      case 'mixte': return 'Mixte';
      default: return type;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'suspendu': return 'bg-yellow-100 text-yellow-800';
      case 'termine': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case 'actif': return 'Actif';
      case 'suspendu': return 'Suspendu';
      case 'termine': return 'Terminé';
      default: return statut;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Surveillance Biologique</h1>
            <p className="text-gray-600 mt-2">
              Gérer le suivi hépatique et rénal des patients sous traitement
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Surveillance
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom patient ou médicament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="hepatique">Hépatique</option>
                <option value="renale">Rénale</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Surveillances Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médicament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prochaine Analyse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fréquence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surveillances.map((surveillance) => (
                  <tr key={surveillance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {surveillance.patient.nom} {surveillance.patient.prenom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(surveillance.patient.dateNaissance)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {surveillance.medicament.nomCommercial}
                      </div>
                      <div className="text-sm text-gray-500">
                        {surveillance.medicament.dci}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(surveillance.typeSurveillance)}`}>
                                                 <FlaskConical className="w-3 h-3 mr-1" />
                        {getTypeText(surveillance.typeSurveillance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className={`text-sm ${isOverdue(surveillance.dateProchaineAnalyse) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(surveillance.dateProchaineAnalyse)}
                        </span>
                        {isOverdue(surveillance.dateProchaineAnalyse) && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Tous les {surveillance.frequenceMois} mois
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutColor(surveillance.statut)}`}>
                        {getStatutText(surveillance.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedSurveillance(surveillance)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails de la surveillance"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: Édition */}}
                          className="text-green-600 hover:text-green-900"
                          title="Modifier la surveillance"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(surveillance.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer la surveillance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> sur{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Nouvelle Surveillance */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nouvelle Surveillance Biologique</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data: NewSurveillanceForm = {
                    patientId: parseInt(formData.get('patientId') as string),
                    medicamentId: parseInt(formData.get('medicamentId') as string),
                    typeSurveillance: formData.get('typeSurveillance') as 'hepatique' | 'renale' | 'mixte',
                    dateDebutSurveillance: formData.get('dateDebutSurveillance') as string,
                    frequenceMois: parseInt(formData.get('frequenceMois') as string) || 3,
                    commentaires: formData.get('commentaires') as string
                  };
                  handleSubmitSurveillance(data);
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                      <select
                        name="patientId"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un patient</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.nom} {patient.prenom} - {formatDate(patient.dateNaissance)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Médicament *</label>
                      <select
                        name="medicamentId"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un médicament</option>
                        {medicaments.map((medicament) => (
                          <option key={medicament.id} value={medicament.id}>
                            {medicament.nomCommercial} ({medicament.dci})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de surveillance *</label>
                      <select
                        name="typeSurveillance"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner le type</option>
                        <option value="hepatique">Surveillance hépatique</option>
                        <option value="renale">Surveillance rénale</option>
                        <option value="mixte">Surveillance mixte (hépatique + rénale)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de début de surveillance *</label>
                      <input
                        type="date"
                        name="dateDebutSurveillance"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence (mois) *</label>
                      <select
                        name="frequenceMois"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">1 mois</option>
                        <option value="3" selected>3 mois</option>
                        <option value="6">6 mois</option>
                        <option value="12">12 mois</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
                      <textarea
                        name="commentaires"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Commentaires sur la surveillance..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createSurveillance.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createSurveillance.isLoading ? 'Création...' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails Surveillance */}
        {selectedSurveillance && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Détails de la Surveillance
                  </h3>
                  <button
                    onClick={() => setSelectedSurveillance(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Fermer</span>
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Informations patient</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Patient:</span>
                        <p className="text-gray-900">
                          {selectedSurveillance.patient.nom} {selectedSurveillance.patient.prenom}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date de naissance:</span>
                        <p className="text-gray-900">{formatDate(selectedSurveillance.patient.dateNaissance)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Médicament:</span>
                        <p className="text-gray-900">{selectedSurveillance.medicament.nomCommercial}</p>
                        <p className="text-sm text-gray-500">{selectedSurveillance.medicament.dci}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Paramètres de surveillance</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedSurveillance.typeSurveillance)}`}>
                          {getTypeText(selectedSurveillance.typeSurveillance)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date de début:</span>
                        <p className="text-gray-900">{formatDate(selectedSurveillance.dateDebutSurveillance)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Prochaine analyse:</span>
                        <p className={`text-gray-900 ${isOverdue(selectedSurveillance.dateProchaineAnalyse) ? 'text-red-600 font-medium' : ''}`}>
                          {formatDate(selectedSurveillance.dateProchaineAnalyse)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Fréquence:</span>
                        <p className="text-gray-900">Tous les {selectedSurveillance.frequenceMois} mois</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Statut:</span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutColor(selectedSurveillance.statut)}`}>
                          {getStatutText(selectedSurveillance.statut)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSurveillance.commentaires && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900 mb-3">Commentaires</h4>
                      <p className="text-gray-900">{selectedSurveillance.commentaires}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedSurveillance(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Surveillance;
