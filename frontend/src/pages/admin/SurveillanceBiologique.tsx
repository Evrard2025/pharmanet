import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SurveillanceBiologique {
  id: number;
  patientId: number;
  medicamentId?: number;
  typeSurveillance: 'hepatique' | 'renale' | 'mixte' | 'autre';
  parametres: string[];
  frequenceMois: number;
  dateDebutSurveillance: string;
  dateDerniereAnalyse?: string;
  dateProchaineAnalyse: string;
  resultats?: string;
  statut: 'en_cours' | 'terminee' | 'en_retard' | 'annulee';
  priorite: 'basse' | 'moyenne' | 'haute';
  notes?: string;
  laboratoire?: string;
  Patient?: {
    nom: string;
    prenom: string;
    dateNaissance: string;
  };
  Medicament?: {
    nomCommercial: string;
    dci: string;
  };
}

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

const SurveillanceBiologique: React.FC = () => {
  const [selectedSurveillance, setSelectedSurveillance] = useState<SurveillanceBiologique | null>(null);
  const [editingSurveillance, setEditingSurveillance] = useState<SurveillanceBiologique | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const queryClient = useQueryClient();

  // Récupérer les surveillances biologiques
  const { data: surveillances, isLoading } = useQuery<SurveillanceBiologique[]>(
    'surveillancesBiologiques',
    async () => {
      const response = await fetch('/api/surveillance-biologique');
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return response.json();
    }
  );

  // Récupérer les patients
  const { data: patients } = useQuery<Patient[]>(
    'patients',
    async () => {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Erreur lors de la récupération des patients');
      return response.json();
    }
  );

  // Récupérer les médicaments
  const { data: medicaments } = useQuery<Medicament[]>(
    'medicaments',
    async () => {
      const response = await fetch('/api/medicaments');
      if (!response.ok) throw new Error('Erreur lors de la récupération des médicaments');
      return response.json();
    }
  );

  // Mutation pour créer une surveillance
  const createSurveillance = useMutation(
    async (data: Partial<SurveillanceBiologique>) => {
      const response = await fetch('/api/surveillance-biologique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('surveillancesBiologiques');
        setShowCreateModal(false);
        setEditingSurveillance(null);
      }
    }
  );

  // Mutation pour mettre à jour une surveillance
  const updateSurveillance = useMutation(
    async ({ id, data }: { id: number; data: Partial<SurveillanceBiologique> }) => {
      const response = await fetch(`/api/surveillance-biologique/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('surveillancesBiologiques');
        setShowCreateModal(false);
        setEditingSurveillance(null);
      }
    }
  );

  // Mutation pour supprimer une surveillance
  const deleteSurveillance = useMutation(
    async (id: number) => {
      const response = await fetch(`/api/surveillance-biologique/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('surveillancesBiologiques');
        setSelectedSurveillance(null);
      }
    }
  );

  // Filtrer les surveillances
  const filteredSurveillances = surveillances?.filter(surveillance => {
    const matchesSearch = !searchTerm || 
      surveillance.Patient?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surveillance.Patient?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surveillance.Medicament?.nomCommercial.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || surveillance.typeSurveillance === filterType;
    const matchesStatus = filterStatus === 'all' || surveillance.statut === filterStatus;
    const matchesPriority = filterPriority === 'all' || surveillance.priorite === filterPriority;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Calculer le statut de la surveillance
  const getSurveillanceStatus = (surveillance: SurveillanceBiologique) => {
    const today = new Date();
    const nextDate = new Date(surveillance.dateProchaineAnalyse);
    const daysUntilNext = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilNext < 0) return 'en_retard';
    if (daysUntilNext <= 7) return 'urgent';
    if (daysUntilNext <= 30) return 'proche';
    return 'normal';
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'terminee': return 'bg-green-100 text-green-800';
      case 'en_retard': return 'bg-red-100 text-red-800';
      case 'annulee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir la couleur de la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'en_retard': return 'En retard';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  };

  // Obtenir le texte de la priorité
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'haute': return 'Haute';
      case 'moyenne': return 'Moyenne';
      case 'basse': return 'Basse';
      default: return priority;
    }
  };

  // Obtenir le texte du type de surveillance
  const getTypeText = (type: string) => {
    switch (type) {
      case 'hepatique': return 'Hépatique';
      case 'renale': return 'Rénale';
      case 'mixte': return 'Mixte';
      case 'autre': return 'Autre';
      default: return type;
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      patientId: parseInt(formData.get('patientId') as string),
      medicamentId: formData.get('medicamentId') ? parseInt(formData.get('medicamentId') as string) : undefined,
      typeSurveillance: formData.get('typeSurveillance') as SurveillanceBiologique['typeSurveillance'],
      parametres: (formData.get('parametres') as string).split(',').map(p => p.trim()),
      frequenceMois: parseInt(formData.get('frequenceMois') as string),
      dateDebutSurveillance: formData.get('dateDebutSurveillance') as string,
      dateProchaineAnalyse: formData.get('dateProchaineAnalyse') as string,
      priorite: formData.get('priorite') as SurveillanceBiologique['priorite'],
      notes: formData.get('notes') as string,
      laboratoire: formData.get('laboratoire') as string,
      statut: 'en_cours' as const
    };

    if (editingSurveillance) {
      updateSurveillance.mutate({ id: editingSurveillance.id, data });
    } else {
      createSurveillance.mutate(data);
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (surveillance: SurveillanceBiologique) => {
    setEditingSurveillance(surveillance);
    setShowCreateModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setEditingSurveillance(null);
  };

  // Supprimer une surveillance
  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette surveillance ?')) {
      deleteSurveillance.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Surveillance Biologique
          </h1>
          <p className="text-gray-600">
            Gestion des surveillances hépatiques et rénales avec rappels automatiques
          </p>
        </div>

        {/* Actions et Filtres */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Surveillance
              </button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par patient ou médicament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="hepatique">Hépatique</option>
                <option value="renale">Rénale</option>
                <option value="mixte">Mixte</option>
                <option value="autre">Autre</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="en_retard">En retard</option>
                <option value="annulee">Annulée</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes priorités</option>
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table des surveillances */}
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
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSurveillances?.map((surveillance) => {
                  const status = getSurveillanceStatus(surveillance);
                  return (
                    <tr key={surveillance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {surveillance.Patient?.nom} {surveillance.Patient?.prenom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {surveillance.Patient?.dateNaissance && 
                              format(new Date(surveillance.Patient.dateNaissance), 'dd/MM/yyyy', { locale: fr })
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {surveillance.Medicament ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {surveillance.Medicament.nomCommercial}
                            </div>
                            <div className="text-sm text-gray-500">
                              {surveillance.Medicament.dci}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Aucun</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getTypeText(surveillance.typeSurveillance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${
                            status === 'en_retard' ? 'text-red-600 font-medium' :
                            status === 'urgent' ? 'text-orange-600 font-medium' :
                            status === 'proche' ? 'text-yellow-600 font-medium' :
                            'text-gray-900'
                          }`}>
                            {format(new Date(surveillance.dateProchaineAnalyse), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                        {status === 'en_retard' && (
                          <div className="text-xs text-red-600 mt-1">
                            En retard
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(surveillance.statut)}`}>
                          {getStatusText(surveillance.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(surveillance.priorite)}`}>
                          {getPriorityText(surveillance.priorite)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSurveillance(surveillance);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(surveillance)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(surveillance.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de création/édition */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingSurveillance ? 'Modifier la surveillance' : 'Nouvelle surveillance'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient *
                    </label>
                    <select
                      name="patientId"
                      required
                      defaultValue={editingSurveillance?.patientId || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner un patient</option>
                      {patients?.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.nom} {patient.prenom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médicament (optionnel)
                    </label>
                    <select
                      name="medicamentId"
                      defaultValue={editingSurveillance?.medicamentId || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Aucun médicament</option>
                      {medicaments?.map(medicament => (
                        <option key={medicament.id} value={medicament.id}>
                          {medicament.nomCommercial} ({medicament.dci})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de surveillance *
                    </label>
                    <select
                      name="typeSurveillance"
                      required
                      defaultValue={editingSurveillance?.typeSurveillance || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner le type</option>
                      <option value="hepatique">Hépatique</option>
                      <option value="renale">Rénale</option>
                      <option value="mixte">Mixte</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paramètres à surveiller *
                    </label>
                    <input
                      type="text"
                      name="parametres"
                      required
                      defaultValue={editingSurveillance?.parametres.join(', ') || ''}
                      placeholder="ASAT, ALAT, Créatinine (séparés par des virgules)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fréquence (mois) *
                    </label>
                    <input
                      type="number"
                      name="frequenceMois"
                      required
                      min="1"
                      max="12"
                      defaultValue={editingSurveillance?.frequenceMois || 3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      name="dateDebutSurveillance"
                      required
                      defaultValue={editingSurveillance?.dateDebutSurveillance || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prochaine analyse *
                    </label>
                    <input
                      type="date"
                      name="dateProchaineAnalyse"
                      required
                      defaultValue={editingSurveillance?.dateProchaineAnalyse || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorité *
                    </label>
                    <select
                      name="priorite"
                      required
                      defaultValue={editingSurveillance?.priorite || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner la priorité</option>
                      <option value="basse">Basse</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Laboratoire
                    </label>
                    <input
                      type="text"
                      name="laboratoire"
                      defaultValue={editingSurveillance?.laboratoire || ''}
                      placeholder="Nom du laboratoire"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={editingSurveillance?.notes || ''}
                      placeholder="Notes additionnelles..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createSurveillance.isLoading || updateSurveillance.isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {createSurveillance.isLoading || updateSurveillance.isLoading ? 'Enregistrement...' : 
                       editingSurveillance ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {showDetailsModal && selectedSurveillance && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Détails de la surveillance
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Patient:</span>
                    <p className="text-sm text-gray-900">
                      {selectedSurveillance.Patient?.nom} {selectedSurveillance.Patient?.prenom}
                    </p>
                  </div>

                  {selectedSurveillance.Medicament && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Médicament:</span>
                      <p className="text-sm text-gray-900">
                        {selectedSurveillance.Medicament.nomCommercial} ({selectedSurveillance.Medicament.dci})
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <p className="text-sm text-gray-900">
                      {getTypeText(selectedSurveillance.typeSurveillance)}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Paramètres:</span>
                    <p className="text-sm text-gray-900">
                      {selectedSurveillance.parametres.join(', ')}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Fréquence:</span>
                    <p className="text-sm text-gray-900">
                      Tous les {selectedSurveillance.frequenceMois} mois
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Date de début:</span>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedSurveillance.dateDebutSurveillance), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>

                  {selectedSurveillance.dateDerniereAnalyse && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Dernière analyse:</span>
                      <p className="text-sm text-gray-900">
                        {format(new Date(selectedSurveillance.dateDerniereAnalyse), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-gray-700">Prochaine analyse:</span>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedSurveillance.dateProchaineAnalyse), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Statut:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSurveillance.statut)}`}>
                      {getStatusText(selectedSurveillance.statut)}
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Priorité:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedSurveillance.priorite)}`}>
                      {getPriorityText(selectedSurveillance.priorite)}
                    </span>
                  </div>

                  {selectedSurveillance.laboratoire && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Laboratoire:</span>
                      <p className="text-sm text-gray-900">{selectedSurveillance.laboratoire}</p>
                    </div>
                  )}

                  {selectedSurveillance.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notes:</span>
                      <p className="text-sm text-gray-900">{selectedSurveillance.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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

export default SurveillanceBiologique;
