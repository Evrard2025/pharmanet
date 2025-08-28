import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2, Eye, Filter, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Medicament {
  id: number;
  nomCommercial: string;
  dci: string;
  classeTherapeutique: string;
  formePharmaceutique?: string;
  dosage?: string;
  laboratoire?: string;
  indication?: string;
  contreIndication?: string;
  effetsSecondaires?: string;
  posologie?: string;
  interactions?: string;
  surveillanceHepatique: boolean;
  surveillanceRenale: boolean;
  frequenceSurveillance?: number;
  parametresSurveillance: string[];
  statut: 'actif' | 'inactif' | 'retire';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewMedicamentForm {
  nomCommercial: string;
  dci: string;
  classeTherapeutique: string;
  formePharmaceutique?: string;
  dosage?: string;
  laboratoire?: string;
  indication?: string;
  contreIndication?: string;
  effetsSecondaires?: string;
  posologie?: string;
  interactions?: string;
  surveillanceHepatique: boolean;
  surveillanceRenale: boolean;
  frequenceSurveillance?: number;
  parametresSurveillance: string[];
}

const Medicaments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);
  const [editingMedicament, setEditingMedicament] = useState<Medicament | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('actif');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Récupérer les médicaments
  const { data: medicamentsData, isLoading } = useQuery(
    ['medicaments', currentPage, searchTerm, selectedClasse, selectedStatut],
    () => api.get(`/api/medicaments?page=${currentPage}&search=${searchTerm}&classeTherapeutique=${selectedClasse}&statut=${selectedStatut}`),
    {
      keepPreviousData: true
    }
  );

  const medicaments: Medicament[] = medicamentsData?.data?.medicaments || [];
  const totalPages = medicamentsData?.data?.totalPages || 1;
  const classesTherapeutiques = medicamentsData?.data?.classesTherapeutiques || [];

  // Créer un nouveau médicament
  const createMedicament = useMutation(
    (data: NewMedicamentForm) => api.post('/api/medicaments', data),
    {
      onSuccess: () => {
        toast.success('Médicament créé avec succès');
        setIsModalOpen(false);
        queryClient.invalidateQueries(['medicaments']);
      },
      onError: (error: any) => {
        console.error('Erreur détaillée:', error.response?.data);
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
          toast.error(`Erreurs de validation: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de la création du médicament');
        }
      }
    }
  );

  // Mettre à jour un médicament
  const updateMedicament = useMutation(
    (data: { id: number; medicament: Partial<NewMedicamentForm> }) => 
      api.put(`/api/medicaments/${data.id}`, data.medicament),
    {
      onSuccess: () => {
        toast.success('Médicament mis à jour avec succès');
        setEditingMedicament(null);
        queryClient.invalidateQueries(['medicaments']);
      },
      onError: (error: any) => {
        console.error('Erreur détaillée:', error.response?.data);
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du médicament');
      }
    }
  );

  // Supprimer un médicament
  const deleteMedicament = useMutation(
    (id: number) => api.delete(`/api/medicaments/${id}`),
    {
      onSuccess: () => {
        toast.success('Médicament supprimé avec succès');
        queryClient.invalidateQueries(['medicaments']);
      },
      onError: () => {
        toast.error('Erreur lors de la suppression du médicament');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: NewMedicamentForm = {
      nomCommercial: formData.get('nomCommercial') as string,
      dci: formData.get('dci') as string,
      classeTherapeutique: formData.get('classeTherapeutique') as string,
      formePharmaceutique: formData.get('formePharmaceutique') as string || undefined,
      dosage: formData.get('dosage') as string || undefined,
      laboratoire: formData.get('laboratoire') as string || undefined,
      indication: formData.get('indication') as string || undefined,
      contreIndication: formData.get('contreIndication') as string || undefined,
      effetsSecondaires: formData.get('effetsSecondaires') as string || undefined,
      posologie: formData.get('posologie') as string || undefined,
      interactions: formData.get('interactions') as string || undefined,
      surveillanceHepatique: formData.get('surveillanceHepatique') === 'on',
      surveillanceRenale: formData.get('surveillanceRenale') === 'on',
      frequenceSurveillance: formData.get('frequenceSurveillance') ? 
        parseInt(formData.get('frequenceSurveillance') as string) : undefined,
      parametresSurveillance: formData.get('parametresSurveillance') ? 
        (formData.get('parametresSurveillance') as string).split(',').map(p => p.trim()) : []
    };

    if (editingMedicament) {
      updateMedicament.mutate({ id: editingMedicament.id, medicament: data });
    } else {
      createMedicament.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      deleteMedicament.mutate(id);
    }
  };

  const openEditModal = (medicament: Medicament) => {
    setEditingMedicament(medicament);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMedicament(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-yellow-100 text-yellow-800';
      case 'retire': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'actif': return 'Actif';
      case 'inactif': return 'Inactif';
      case 'retire': return 'Retiré';
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
            <h1 className="text-3xl font-bold text-gray-900">Médicaments</h1>
            <p className="text-gray-600 mt-2">
              Gérer la monographie des médicaments et la surveillance biologique
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Médicament
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nom, DCI, classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe thérapeutique</label>
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les classes</option>
                {classesTherapeutiques.map((classe: string) => (
                  <option key={classe} value={classe}>{classe}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="retire">Retiré</option>
                <option value="tous">Tous</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClasse('');
                  setSelectedStatut('actif');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Medicaments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médicament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DCI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Surveillance
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
                {medicaments.map((medicament) => (
                  <tr key={medicament.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {medicament.nomCommercial}
                      </div>
                      {medicament.dosage && (
                        <div className="text-sm text-gray-500">
                          {medicament.dosage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{medicament.dci}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{medicament.classeTherapeutique}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(medicament.surveillanceHepatique || medicament.surveillanceRenale) ? (
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                          <div className="text-sm">
                            {medicament.surveillanceHepatique && 'Hépatique '}
                            {medicament.surveillanceRenale && 'Rénale '}
                            <br />
                            <span className="text-xs text-gray-500">
                              Tous les {medicament.frequenceSurveillance || 3} mois
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Aucune</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(medicament.statut)}`}>
                        {getStatusText(medicament.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedMedicament(medicament)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(medicament)}
                          className="text-green-600 hover:text-green-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(medicament.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
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

        {/* Modal Création/Édition Médicament */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingMedicament ? 'Modifier le médicament' : 'Nouveau médicament'}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom commercial *</label>
                      <input
                        type="text"
                        name="nomCommercial"
                        required
                        defaultValue={editingMedicament?.nomCommercial}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Doliprane 500mg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DCI *</label>
                      <input
                        type="text"
                        name="dci"
                        required
                        defaultValue={editingMedicament?.dci}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Paracétamol"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Classe thérapeutique *</label>
                      <input
                        type="text"
                        name="classeTherapeutique"
                        required
                        defaultValue={editingMedicament?.classeTherapeutique}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Antalgiques et antipyrétiques"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Forme pharmaceutique</label>
                      <input
                        type="text"
                        name="formePharmaceutique"
                        defaultValue={editingMedicament?.formePharmaceutique}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Comprimé, sirop, injection..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        name="dosage"
                        defaultValue={editingMedicament?.dosage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="500mg, 10mg/ml..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Laboratoire</label>
                      <input
                        type="text"
                        name="laboratoire"
                        defaultValue={editingMedicament?.laboratoire}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Sanofi, GSK..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indications</label>
                      <textarea
                        name="indication"
                        rows={3}
                        defaultValue={editingMedicament?.indication}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Indications thérapeutiques..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contre-indications</label>
                      <textarea
                        name="contreIndication"
                        rows={3}
                        defaultValue={editingMedicament?.contreIndication}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contre-indications..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effets secondaires</label>
                      <textarea
                        name="effetsSecondaires"
                        rows={3}
                        defaultValue={editingMedicament?.effetsSecondaires}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Effets secondaires principaux..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Posologie</label>
                      <textarea
                        name="posologie"
                        rows={3}
                        defaultValue={editingMedicament?.posologie}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Posologie recommandée..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Interactions</label>
                      <textarea
                        name="interactions"
                        rows={3}
                        defaultValue={editingMedicament?.interactions}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Interactions médicamenteuses..."
                      />
                    </div>

                    {/* Section Surveillance biologique */}
                    <div className="md:col-span-2">
                      <h4 className="text-md font-medium text-gray-900 mb-3 border-t pt-4">Surveillance biologique</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="surveillanceHepatique"
                            defaultChecked={editingMedicament?.surveillanceHepatique}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">Surveillance hépatique</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="surveillanceRenale"
                            defaultChecked={editingMedicament?.surveillanceRenale}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">Surveillance rénale</label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence (mois)</label>
                          <input
                            type="number"
                            name="frequenceSurveillance"
                            min="1"
                            max="12"
                            defaultValue={editingMedicament?.frequenceSurveillance || 3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paramètres de surveillance</label>
                        <input
                          type="text"
                          name="parametresSurveillance"
                          defaultValue={editingMedicament?.parametresSurveillance?.join(', ')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ASAT, ALAT, Créatinine, Urée... (séparés par des virgules)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Séparez les paramètres par des virgules
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createMedicament.isLoading || updateMedicament.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingMedicament ? 
                        (updateMedicament.isLoading ? 'Mise à jour...' : 'Mettre à jour') :
                        (createMedicament.isLoading ? 'Création...' : 'Créer')
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails Médicament */}
        {selectedMedicament && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Détails du médicament</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nom commercial</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.nomCommercial}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">DCI</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.dci}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Classe thérapeutique</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.classeTherapeutique}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Forme pharmaceutique</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.formePharmaceutique || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dosage</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.dosage || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Laboratoire</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.laboratoire || 'Non spécifié'}</p>
                    </div>
                  </div>

                  {selectedMedicament.indication && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Indications</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.indication}</p>
                    </div>
                  )}

                  {selectedMedicament.contreIndication && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contre-indications</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.contreIndication}</p>
                    </div>
                  )}

                  {selectedMedicament.effetsSecondaires && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Effets secondaires</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.effetsSecondaires}</p>
                    </div>
                  )}

                  {selectedMedicament.posologie && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Posologie</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.posologie}</p>
                    </div>
                  )}

                  {selectedMedicament.interactions && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Interactions</p>
                      <p className="text-sm text-gray-900">{selectedMedicament.interactions}</p>
                    </div>
                  )}

                  {(selectedMedicament.surveillanceHepatique || selectedMedicament.surveillanceRenale) && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Surveillance biologique</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                          <span className="font-medium text-yellow-800">Surveillance requise</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Type de surveillance:</p>
                            <ul className="text-sm text-yellow-600 mt-1">
                              {selectedMedicament.surveillanceHepatique && <li>• Hépatique</li>}
                              {selectedMedicament.surveillanceRenale && <li>• Rénale</li>}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Fréquence:</p>
                            <p className="text-sm text-yellow-600">
                              Tous les {selectedMedicament.frequenceSurveillance || 3} mois
                            </p>
                          </div>
                        </div>
                        {selectedMedicament.parametresSurveillance.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-yellow-700">Paramètres à surveiller:</p>
                            <p className="text-sm text-yellow-600">
                              {selectedMedicament.parametresSurveillance.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedMedicament(null)}
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

export default Medicaments;

