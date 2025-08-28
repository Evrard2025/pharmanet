import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Eye, Trash2, FileText, Calendar, User, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

interface Prescription {
  id: number;
  patientId: number;
  numeroPrescription: string;
  datePrescription: string;
  medecinPrescripteur: string;
  statut: 'en_cours' | 'termine' | 'suspendu';
  notes: string;
  isActive: boolean;
  Patient: {
    id: number;
    User: {
      firstName: string;
      lastName: string;
    };
  };
  medicaments: Array<{
    id: number;
    nom: string;
    posologie: string;
    quantite: number;
    unite: string;
  }>;
}

interface NewPrescriptionForm {
  patientId: number;
  numeroPrescription: string;
  datePrescription: string;
  medecinPrescripteur: string;
  statut: 'en_cours' | 'termine' | 'suspendu';
  notes: string;
}

const Prescriptions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const queryClient = useQueryClient();

  // Hook form pour la nouvelle prescription
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewPrescriptionForm>();

  // Récupérer les prescriptions
  const { data: prescriptionsData, isLoading, error } = useQuery(
    ['prescriptions', currentPage, searchTerm],
    () => api.get(`/prescriptions?page=${currentPage}&search=${searchTerm}`),
    {
      keepPreviousData: true,
    }
  );

  // Récupérer les patients pour la liste déroulante
  const { data: patientsData } = useQuery(
    'patients-list',
    () => api.get('/patients?limit=1000'),
    {
      select: (data) => data.data.patients || []
    }
  );

  // Mutation pour créer une prescription
  const createPrescription = useMutation(
    (prescriptionData: NewPrescriptionForm) => api.post('/prescriptions', prescriptionData),
    {
      onSuccess: () => {
        toast.success('Prescription créée avec succès');
        queryClient.invalidateQueries('prescriptions');
        setShowModal(false);
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création de la prescription');
      },
    }
  );

  // Mutation pour supprimer une prescription
  const deletePrescription = useMutation(
    (prescriptionId: number) => api.delete(`/prescriptions/${prescriptionId}`),
    {
      onSuccess: () => {
        toast.success('Prescription supprimée avec succès');
        queryClient.invalidateQueries('prescriptions');
      },
      onError: () => {
        toast.error('Erreur lors de la suppression de la prescription');
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = (prescriptionId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette prescription ?')) {
      deletePrescription.mutate(prescriptionId);
    }
  };

  const onSubmitPrescription = (data: NewPrescriptionForm) => {
    createPrescription.mutate(data);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'termine': return 'bg-green-100 text-green-800';
      case 'suspendu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      case 'suspendu': return 'Suspendu';
      default: return statut;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Erreur lors du chargement des prescriptions
      </div>
    );
  }

  const prescriptions = prescriptionsData?.data?.prescriptions || [];
  const patients = patientsData || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Prescriptions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nouvelle Prescription
        </button>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par patient, médecin ou numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Liste des prescriptions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Numéro
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
            {prescriptions.map((prescription: Prescription) => (
              <tr key={prescription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {prescription.numeroPrescription}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {prescription.Patient?.User?.firstName} {prescription.Patient?.User?.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prescription.medecinPrescripteur}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(prescription.datePrescription).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prescription.statut)}`}>
                    {getStatusText(prescription.statut)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPrescription(prescription);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {prescriptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune prescription trouvée
          </div>
        )}
      </div>

      {/* Modal d'ajout de prescription */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Nouvelle Prescription</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitPrescription)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient *
                  </label>
                  <select
                    {...register('patientId', { required: 'Veuillez sélectionner un patient' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient: any) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.User?.firstName} {patient.User?.lastName} - {patient.numeroSecu}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de prescription *
                  </label>
                  <input
                    type="text"
                    {...register('numeroPrescription', { required: 'Le numéro de prescription est requis' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ORD-2024-001"
                  />
                  {errors.numeroPrescription && (
                    <p className="text-red-500 text-sm mt-1">{errors.numeroPrescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de prescription *
                  </label>
                  <input
                    type="date"
                    {...register('datePrescription', { required: 'La date de prescription est requise' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                  {errors.datePrescription && (
                    <p className="text-red-500 text-sm mt-1">{errors.datePrescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médecin prescripteur *
                  </label>
                  <input
                    type="text"
                    {...register('medecinPrescripteur', { required: 'Le médecin prescripteur est requis' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Martin"
                  />
                  {errors.medecinPrescripteur && (
                    <p className="text-red-500 text-sm mt-1">{errors.medecinPrescripteur.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut *
                  </label>
                  <select
                    {...register('statut', { required: 'Le statut est requis' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="en_cours"
                  >
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                  {errors.statut && (
                    <p className="text-red-500 text-sm mt-1">{errors.statut.message}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes sur la prescription..."
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createPrescription.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {createPrescription.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Créer la prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails de la prescription */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Détails de la Prescription</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-700">Numéro:</span>
                  <p className="text-gray-900">{selectedPrescription.numeroPrescription}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPrescription.datePrescription).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Patient:</span>
                  <p className="text-gray-900">
                    {selectedPrescription.Patient?.User?.firstName} {selectedPrescription.Patient?.User?.lastName}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Médecin:</span>
                  <p className="text-gray-900">{selectedPrescription.medecinPrescripteur}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Statut:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPrescription.statut)}`}>
                  {getStatusText(selectedPrescription.statut)}
                </span>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <span className="font-semibold text-gray-700">Notes:</span>
                  <p className="text-gray-900 mt-1">{selectedPrescription.notes}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
