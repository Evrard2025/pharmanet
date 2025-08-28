import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Eye, Trash2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Consultation {
  id: number;
  numeroConsultation: string;
  patientId: number;
  medecinConsultant: string;
  dateConsultation: string;
  periodePrise?: string;
  datePriseMedicament?: string;
  medicamentId?: number;
  diagnostic?: string;
  indication?: string;
  ordonnance?: string;
  notesPharmacien?: string;
  statut: 'active' | 'terminee' | 'annulee' | 'renouvellement';
  typeConsultation: 'courte' | 'longue' | 'renouvellement' | 'urgence';
  Patient: {
    firstName: string;
    lastName: string;
  };
  Medicament?: {
    id: number;
    nomCommercial: string;
    dci: string;
    classeTherapeutique: string;
    dosage?: string;
    surveillanceHepatique: boolean;
    surveillanceRenale: boolean;
    frequenceSurveillance?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface NewConsultationForm {
  patientId: number;
  medecinConsultant: string;
  dateConsultation: string;
  periodePrise: string;
  datePriseMedicament: string;
  medicamentId?: number;
  diagnostic: string;
  indication: string;
  ordonnance: string;
  notesPharmacien: string;
  typeConsultation: 'courte' | 'longue' | 'renouvellement' | 'urgence';
}

const Consultations: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [nextConsultationNumber, setNextConsultationNumber] = useState<string>('');
  const [selectedMedicament, setSelectedMedicament] = useState<any>(null);
  const [medicamentResults, setMedicamentResults] = useState<any[]>([]);
  const [showMedicamentResults, setShowMedicamentResults] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Récupérer les consultations
  const { data: consultationsData, isLoading } = useQuery(
    ['consultations', currentPage, searchTerm],
    () => api.get(`/api/consultations?page=${currentPage}&search=${searchTerm}`),
    {
      keepPreviousData: true
    }
  );

  // Récupérer les patients pour le formulaire
  const { data: patientsData } = useQuery(
    ['patients'],
    () => api.get('/api/patients?limit=1000')
  );

  // Récupérer le prochain numéro de consultation
  const { data: nextNumberData } = useQuery(
    ['next-consultation-number'],
    () => api.get('/api/consultations/next-number'),
    {
      onSuccess: (data) => {
        setNextConsultationNumber(data.data.nextNumber);
      }
    }
  );

  const consultations: Consultation[] = consultationsData?.data?.consultations || [];
  const totalPages = consultationsData?.data?.totalPages || 1;
  const patients = patientsData?.data?.patients || [];

  // Créer une nouvelle consultation
  const createConsultation = useMutation(
    (data: NewConsultationForm) => api.post('/api/consultations', data),
    {
      onSuccess: () => {
        toast.success('Consultation créée avec succès');
        resetForm();
        queryClient.invalidateQueries(['consultations']);
      },
      onError: (error: any) => {
        console.error('Erreur détaillée:', error.response?.data);
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
          toast.error(`Erreurs de validation: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de la création de la consultation');
        }
      }
    }
  );

  // Supprimer une consultation
  const deleteConsultation = useMutation(
    (id: number) => api.delete(`/api/consultations/${id}`),
    {
      onSuccess: () => {
        toast.success('Consultation supprimée avec succès');
        queryClient.invalidateQueries(['consultations']);
      },
      onError: () => {
        toast.error('Erreur lors de la suppression de la consultation');
      }
    }
  );

  const handleSubmitConsultation = (data: NewConsultationForm) => {
    console.log('Données de la consultation à envoyer:', data);
    createConsultation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette consultation ?')) {
      deleteConsultation.mutate(id);
    }
  };

  const handleViewPatient = (patientId: number) => {
    navigate(`/admin/patients?patientId=${patientId}`);
  };

  const handleMedicamentSearch = async (query: string) => {
    if (query.length < 2) {
      setMedicamentResults([]);
      setShowMedicamentResults(false);
      return;
    }

    try {
      const response = await api.get(`/api/medicaments/search?q=${encodeURIComponent(query)}`);
      setMedicamentResults(response.data.medicaments);
      setShowMedicamentResults(true);
    } catch (error) {
      console.error('Erreur lors de la recherche de médicaments:', error);
      setMedicamentResults([]);
    }
  };

  const selectMedicament = (medicament: any) => {
    setSelectedMedicament(medicament);
    setShowMedicamentResults(false);
    // Mettre à jour le champ caché
    const medicamentIdInput = document.getElementById('medicamentId') as HTMLInputElement;
    if (medicamentIdInput) {
      medicamentIdInput.value = medicament.id.toString();
    }
  };

  const resetForm = () => {
    setSelectedMedicament(null);
    setMedicamentResults([]);
    setShowMedicamentResults(false);
    setIsModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'terminee': return 'bg-gray-100 text-gray-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      case 'renouvellement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      case 'renouvellement': return 'Renouvellement';
      default: return status;
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
            <p className="text-gray-600 mt-2">
              Gérer les consultations médicales de vos patients
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Consultation
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro de consultation ou médecin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Consultations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médecin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {consultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{consultation.numeroConsultation}
                      </div>
                      <div className="text-sm text-gray-500">
                        {consultation.typeConsultation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {consultation.Patient.firstName} {consultation.Patient.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Dr. {consultation.medecinConsultant}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(consultation.dateConsultation)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consultation.statut)}`}>
                        {getStatusText(consultation.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedConsultation(consultation)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails de la consultation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewPatient(consultation.patientId)}
                          className="text-green-600 hover:text-green-900"
                          title="Voir la fiche patient"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(consultation.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer la consultation"
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

        {/* Modal Nouvelle Consultation */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nouvelle Consultation</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data: NewConsultationForm = {
                    patientId: parseInt(formData.get('patientId') as string),
                    medecinConsultant: formData.get('medecinConsultant') as string,
                    dateConsultation: formData.get('dateConsultation') as string,
                    periodePrise: formData.get('periodePrise') as string,
                    datePriseMedicament: formData.get('datePriseMedicament') as string,
                    medicamentId: selectedMedicament ? selectedMedicament.id : undefined,
                    diagnostic: formData.get('diagnostic') as string,
                    indication: formData.get('indication') as string,
                    ordonnance: formData.get('ordonnance') as string,
                    notesPharmacien: formData.get('notesPharmacien') as string,
                    typeConsultation: formData.get('typeConsultation') as 'courte' | 'longue' | 'renouvellement' | 'urgence'
                  };
                  handleSubmitConsultation(data);
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                      <select
                        name="patientId"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un patient</option>
                        {patients.map((patient: any) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Médecin consultant</label>
                      <input
                        type="text"
                        name="medecinConsultant"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Dr. Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de consultation</label>
                      <input
                        type="date"
                        name="dateConsultation"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de consultation</label>
                      <select
                        name="typeConsultation"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="courte">Courte</option>
                        <option value="longue">Longue</option>
                        <option value="renouvellement">Renouvellement</option>
                        <option value="urgence">Urgence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Période de prise</label>
                      <select
                        name="periodePrise"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner une période</option>
                        <option value="matin">Matin</option>
                        <option value="midi">Midi</option>
                        <option value="soir">Soir</option>
                        <option value="avant_repas">Avant repas</option>
                        <option value="apres_repas">Après repas</option>
                        <option value="a_jeun">À jeun</option>
                        <option value="toutes_les_8h">Toutes les 8h</option>
                        <option value="toutes_les_12h">Toutes les 12h</option>
                        <option value="quotidien">Quotidien</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de prise de médicament</label>
                      <input
                        type="date"
                        name="datePriseMedicament"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Médicament prescrit</label>
                      <div className="relative">
                        <input
                          type="text"
                          id="medicamentSearch"
                          placeholder="Rechercher un médicament..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => handleMedicamentSearch(e.target.value)}
                        />
                        <input
                          type="hidden"
                          name="medicamentId"
                          id="medicamentId"
                        />
                        {selectedMedicament && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-blue-900">{selectedMedicament.nomCommercial}</p>
                                <p className="text-sm text-blue-700">DCI: {selectedMedicament.dci}</p>
                                <p className="text-sm text-blue-600">{selectedMedicament.classeTherapeutique}</p>
                                {selectedMedicament.dosage && (
                                  <p className="text-sm text-blue-600">Dosage: {selectedMedicament.dosage}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedMedicament(null)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                ✕
                              </button>
                            </div>
                            {(selectedMedicament.surveillanceHepatique || selectedMedicament.surveillanceRenale) && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm text-yellow-800 font-medium">⚠️ Surveillance biologique requise</p>
                                <p className="text-xs text-yellow-700">
                                  {selectedMedicament.surveillanceHepatique && 'Hépatique '}
                                  {selectedMedicament.surveillanceRenale && 'Rénale '}
                                  - Tous les {selectedMedicament.frequenceSurveillance || 3} mois
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {showMedicamentResults && medicamentResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {medicamentResults.map((medicament) => (
                              <div
                                key={medicament.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                                onClick={() => selectMedicament(medicament)}
                              >
                                <div className="font-medium text-gray-900">{medicament.nomCommercial}</div>
                                <div className="text-sm text-gray-600">{medicament.dci}</div>
                                <div className="text-xs text-gray-500">{medicament.classeTherapeutique}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de consultation</label>
                      <input
                        type="text"
                        value={nextConsultationNumber}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Génération automatique..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Numéro généré automatiquement</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostic</label>
                      <textarea
                        name="diagnostic"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Diagnostic du médecin..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indication</label>
                      <textarea
                        name="indication"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Indications thérapeutiques..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ordonnance</label>
                      <textarea
                        name="ordonnance"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Détails de l'ordonnance..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes du pharmacien</label>
                      <textarea
                        name="notesPharmacien"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Notes et observations..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createConsultation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createConsultation.isLoading ? 'Création...' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails Consultation */}
        {selectedConsultation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Détails de la Consultation</h3>
                <div className="space-y-3">
                  <p><span className="font-medium">Numéro:</span> #{selectedConsultation.numeroConsultation}</p>
                  <p><span className="font-medium">Patient:</span> {selectedConsultation.Patient.firstName} {selectedConsultation.Patient.lastName}</p>
                  <p><span className="font-medium">Médecin:</span> Dr. {selectedConsultation.medecinConsultant}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(selectedConsultation.dateConsultation)}</p>
                  <p><span className="font-medium">Type:</span> {selectedConsultation.typeConsultation}</p>
                  <p><span className="font-medium">Statut:</span> {getStatusText(selectedConsultation.statut)}</p>
                  {selectedConsultation.periodePrise && (
                    <p><span className="font-medium">Période de prise:</span> {selectedConsultation.periodePrise}</p>
                  )}
                  {selectedConsultation.datePriseMedicament && (
                    <p><span className="font-medium">Date de prise:</span> {formatDate(selectedConsultation.datePriseMedicament)}</p>
                  )}
                  {selectedConsultation.Medicament && (
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium text-blue-900 mb-2">Médicament prescrit:</p>
                      <p><span className="font-medium">Nom:</span> {selectedConsultation.Medicament.nomCommercial}</p>
                      <p><span className="font-medium">DCI:</span> {selectedConsultation.Medicament.dci}</p>
                      <p><span className="font-medium">Classe:</span> {selectedConsultation.Medicament.classeTherapeutique}</p>
                      {selectedConsultation.Medicament.dosage && (
                        <p><span className="font-medium">Dosage:</span> {selectedConsultation.Medicament.dosage}</p>
                      )}
                      {(selectedConsultation.Medicament.surveillanceHepatique || selectedConsultation.Medicament.surveillanceRenale) && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800 font-medium">⚠️ Surveillance biologique requise</p>
                          <p className="text-xs text-yellow-700">
                            {selectedConsultation.Medicament.surveillanceHepatique && 'Hépatique '}
                            {selectedConsultation.Medicament.surveillanceRenale && 'Rénale '}
                            - Tous les {selectedConsultation.Medicament.frequenceSurveillance || 3} mois
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedConsultation.diagnostic && (
                    <p><span className="font-medium">Diagnostic:</span> {selectedConsultation.diagnostic}</p>
                  )}
                  {selectedConsultation.indication && (
                    <p><span className="font-medium">Indication:</span> {selectedConsultation.indication}</p>
                  )}
                  {selectedConsultation.ordonnance && (
                    <p><span className="font-medium">Ordonnance:</span> {selectedConsultation.ordonnance}</p>
                  )}
                  {selectedConsultation.notesPharmacien && (
                    <p><span className="font-medium">Notes:</span> {selectedConsultation.notesPharmacien}</p>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedConsultation(null)}
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

export default Consultations;
