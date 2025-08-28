import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Eye, Trash2, User, X, Save, Calendar, Stethoscope, Phone, MapPin, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PatientCard from '../../components/PatientCard';

interface Consultation {
  id: number;
  numeroConsultation: string;
  medecinConsultant: string;
  dateConsultation: string;
  diagnostic?: string;
  indication?: string;
  ordonnance?: string;
  notesPharmacien?: string;
  statut: 'active' | 'terminee' | 'annulee' | 'renouvellement';
  typeConsultation: 'courte' | 'longue' | 'renouvellement' | 'urgence';
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: number;
    firstName: string;
    lastName: string;
  dateNaissance: string;
  sexe?: 'M' | 'F';
  poids?: number;
  taille?: number;
  adresse?: string;
  telephone?: string;
  traitementsChroniques: string[];
  traitementsPonctuels: string[];
  effetsIndesirables?: string;
  sousContraceptif: boolean;
  structureEmission?: string;
  serviceEmission?: string;
  medecinPrescripteur?: string;
  groupeSanguin?: string;
  assurance?: string;
}

interface NewPatientForm {
  firstName: string;
  lastName: string;
  dateNaissance: string;
  sexe?: 'M' | 'F';
  poids?: number;
  taille?: number;
  adresse?: string;
  telephone?: string;
  traitementsChroniques?: string;
  traitementsPonctuels?: string;
  effetsIndesirables?: string;
  sousContraceptif?: boolean;
  structureEmission?: string;
  serviceEmission?: string;
  medecinPrescripteur?: string;
  groupeSanguin?: string;
  assurance?: string;
}

const Patients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Hook form pour le nouveau patient
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewPatientForm>();

  // Récupérer les patients
  const { data: patientsData, isLoading, error } = useQuery(
    ['patients', currentPage, searchTerm],
    () => api.get(`/api/patients?page=${currentPage}&search=${searchTerm}`),
    {
      keepPreviousData: true,
    }
  );

  // Récupérer les consultations d'un patient spécifique
  const { data: patientConsultations, refetch: refetchConsultations, error: consultationsError, isLoading: consultationsLoading } = useQuery(
    ['patient-consultations', selectedPatient?.id],
    () => selectedPatient ? api.get(`/api/consultations/patient/${selectedPatient.id}`) : null,
    {
      enabled: !!selectedPatient,
      keepPreviousData: false,
      onSuccess: (data) => {
        // Consultations récupérées avec succès
      },
      onError: (error: any) => {
        console.error('Erreur lors de la récupération des consultations:', error);
      }
    }
  );

  // Mutation pour créer un patient (accepte un payload transformé)
  const createPatient = useMutation(
    (patientData: any) => api.post('/api/patients', patientData),
    {
      onSuccess: () => {
        toast.success('Patient créé avec succès');
        queryClient.invalidateQueries('patients');
        setShowModal(false);
        reset();
      },
      onError: (error: any) => {
        console.error('Erreur détaillée:', error.response?.data);
        if (error.response?.data?.errors) {
          // Afficher les erreurs de validation
          const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
          toast.error(`Erreurs de validation: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de la création du patient');
        }
      },
    }
  );

  // Mutation pour supprimer un patient
  const deletePatient = useMutation(
    (patientId: number) => api.delete(`/api/patients/${patientId}`),
    {
      onSuccess: () => {
        toast.success('Patient supprimé avec succès');
        queryClient.invalidateQueries('patients');
      },
      onError: () => {
        toast.error('Erreur lors de la suppression du patient');
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = (patientId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.')) {
      deletePatient.mutate(patientId);
    }
  };

  const onSubmitPatient = (data: NewPatientForm) => {
    // Convertir les traitements en tableaux et nettoyer les données
    const patientData = {
      ...data,
      traitementsChroniques: data.traitementsChroniques ? 
        data.traitementsChroniques.split(',').map(p => p.trim()).filter(p => p.length > 0) : [],
      traitementsPonctuels: data.traitementsPonctuels ? 
        data.traitementsPonctuels.split(',').map(p => p.trim()).filter(p => p.length > 0) : [],
      // S'assurer que les champs numériques sont bien des nombres
      poids: data.poids ? Number(data.poids) : undefined,
      taille: data.taille ? Number(data.taille) : undefined,
      // S'assurer que le champ sousContraceptif est un booléen
      sousContraceptif: Boolean(data.sousContraceptif)
    };
    
    console.log('Données du patient à envoyer:', patientData);
    createPatient.mutate(patientData);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const calculateIMC = (poids: number, taille: number) => {
    if (poids && taille) {
      const tailleEnMetres = taille / 100;
      return (poids / (tailleEnMetres * tailleEnMetres)).toFixed(1);
    }
    return 'N/A';
  };

  const getAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
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

  // Ouvrir automatiquement la fiche d'un patient si un patientId est passé en paramètre
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && patientsData?.data?.patients) {
      const patient = patientsData.data.patients.find((p: Patient) => p.id === parseInt(patientId));
      if (patient) {
        setSelectedPatient(patient);
        setShowDetailsModal(true);
      }
    }
  }, [searchParams, patientsData]);

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
        Erreur lors du chargement des patients
      </div>
    );
  }

  // Debug - Afficher la structure des consultations
  console.log('Debug - Structure des consultations:', {
    consultationsLoading,
    consultationsError,
    patientConsultations,
    dataType: typeof patientConsultations?.data,
    isArray: Array.isArray(patientConsultations?.data),
    length: patientConsultations?.data?.length
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Patients</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nouveau Patient
        </button>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom ou prénom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Tableau des patients */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Âge</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chroniques</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ponctuels</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patientsData?.data?.patients?.map((patient: Patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                         {patient.firstName} {patient.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">{getAge(patient.dateNaissance)} ans</td>
                 <td className="px-6 py-4 whitespace-nowrap">{patient.poids || 'N/A'} kg</td>
                 <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                     {patient.traitementsChroniques?.length ? patient.traitementsChroniques.slice(0,2).join(', ') : 'Aucun'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                     {patient.traitementsPonctuels?.length ? patient.traitementsPonctuels.slice(0,2).join(', ') : 'Aucun'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowCardModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="Voir la carte virtuelle"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Voir les détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {patientsData?.data?.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
                         <span className="px-3 py-2 text-sm text-gray-700">
               Page {currentPage} sur {patientsData?.data?.totalPages || 1}
             </span>
             <button
               onClick={() => setCurrentPage(currentPage + 1)}
               disabled={currentPage === (patientsData?.data?.totalPages || 1)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}

      {/* Modal d'ajout de patient */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Nouveau Patient</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitPatient)} className="p-6">
              {/* Informations personnelles */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Informations personnelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'Le prénom est requis' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Jean"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Le nom est requis' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Dupont"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      {...register('dateNaissance', { required: 'La date de naissance est requise' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.dateNaissance && (
                      <p className="text-red-500 text-sm mt-1">{errors.dateNaissance.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sexe *
                    </label>
                    <select
                      {...register('sexe', { required: 'Le sexe est requis' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                    {errors.sexe && (
                      <p className="text-red-500 text-sm mt-1">{errors.sexe.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      {...register('poids', { min: 0, max: 300 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taille (cm)
                    </label>
                    <input
                      type="number"
                      {...register('taille', { min: 0, max: 250 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Groupe sanguin
                    </label>
                    <select
                      {...register('groupeSanguin')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      {...register('adresse')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12 rue de Paris, Lyon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      {...register('telephone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>

              {/* Informations médicales détaillées */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Informations médicales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médicaments chroniques (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      {...register('traitementsChroniques')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Metformine, Lévothyrox"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médicaments ponctuels (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      {...register('traitementsPonctuels')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Paracétamol, Ibuprofène"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effets indésirables déjà ressentis
                  </label>
                  <textarea
                      {...register('effetsIndesirables')}
                    rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: éruption cutanée avec pénicilline"
                    />
                  </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assurance maladie / Mutuelle
                    </label>
                    <input
                      type="text"
                      {...register('assurance')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AXA, CNAM, ..."
                  />
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médecin prescripteur
                    </label>
                    <input
                      type="text"
                      {...register('medecinPrescripteur')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Dr. Martin"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Structure d'émission
                    </label>
                    <input
                      type="text"
                      {...register('structureEmission')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CHU Cocody"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service d'émission
                  </label>
                    <input
                      type="text"
                      {...register('serviceEmission')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cardiologie"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">État de santé</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                    {...register('sousContraceptif')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  <span className="ml-2 text-sm text-gray-700">Sous contraceptif</span>
                  </label>
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
                  disabled={createPatient.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {createPatient.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Créer le patient
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails du patient */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Détails du Patient</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Informations personnelles</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nom:</span> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p><span className="font-medium">Date de naissance:</span> {new Date(selectedPatient.dateNaissance).toLocaleDateString()}</p>
                  <p><span className="font-medium">Âge:</span> {getAge(selectedPatient.dateNaissance)} ans</p>
                  <p><span className="font-medium">Sexe:</span> {selectedPatient.sexe === 'M' ? 'Masculin' : selectedPatient.sexe === 'F' ? 'Féminin' : 'N/A'}</p>
                  <p><span className="font-medium">Poids:</span> {selectedPatient.poids || 'N/A'} kg</p>
                  <p><span className="font-medium">Taille:</span> {selectedPatient.taille || 'N/A'} cm</p>
                  <p><span className="font-medium">Groupe sanguin:</span> {selectedPatient.groupeSanguin || 'N/A'}</p>
                  <p><span className="font-medium">Adresse:</span> {selectedPatient.adresse || 'N/A'}</p>
                  <p><span className="font-medium">Téléphone:</span> {selectedPatient.telephone || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                 <h3 className="font-semibold text-gray-900 mb-2">Santé</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Traitements chroniques:</span> {selectedPatient.traitementsChroniques?.join(', ') || 'Aucun'}</p>
                  <p><span className="font-medium">Traitements ponctuels:</span> {selectedPatient.traitementsPonctuels?.join(', ') || 'Aucun'}</p>
                  <p><span className="font-medium">Effets indésirables:</span> {selectedPatient.effetsIndesirables || 'Aucun'}</p>
                  <p><span className="font-medium">Sous contraceptif:</span> {selectedPatient.sousContraceptif ? 'Oui' : 'Non'}</p>
                  <p><span className="font-medium">Assurance:</span> {selectedPatient.assurance || 'N/A'}</p>
                  <p><span className="font-medium">Structure d'émission:</span> {selectedPatient.structureEmission || 'N/A'}</p>
                  <p><span className="font-medium">Service d'émission:</span> {selectedPatient.serviceEmission || 'N/A'}</p>
                  <p><span className="font-medium">Médecin prescripteur:</span> {selectedPatient.medecinPrescripteur || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Section des consultations affiliées */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                  Consultations affiliées
                </h3>
                <button
                  onClick={() => refetchConsultations()}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Actualiser
                </button>
              </div>
              
              {/* Contenu des consultations */}
              {(() => {
                if (consultationsLoading) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p>Chargement des consultations...</p>
                    </div>
                  );
                }
                
                if (consultationsError) {
                  return (
                    <div className="text-center py-8 text-red-500">
                      <p>Erreur lors du chargement des consultations</p>
                      <p className="text-sm">
                        {consultationsError && typeof consultationsError === 'object' && 'message' in consultationsError 
                          ? (consultationsError as any).message 
                          : 'Erreur inconnue'}
                      </p>
                      <button
                        onClick={() => refetchConsultations()}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Réessayer
                      </button>
                    </div>
                  );
                }
                
                if (patientConsultations?.data?.consultations && Array.isArray(patientConsultations.data.consultations) && patientConsultations.data.consultations.length > 0) {
                  return (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {patientConsultations.data.consultations.map((consultation: Consultation) => (
                          <div key={consultation.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-blue-600">
                                  #{consultation.numeroConsultation}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consultation.statut)}`}>
                                  {getStatusText(consultation.statut)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(consultation.dateConsultation)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><span className="font-medium">Médecin:</span> Dr. {consultation.medecinConsultant}</p>
                                <p><span className="font-medium">Type:</span> {consultation.typeConsultation}</p>
                              </div>
                              <div>
                                {consultation.diagnostic && (
                                  <p><span className="font-medium">Diagnostic:</span> {consultation.diagnostic}</p>
                                )}
                                {consultation.indication && (
                                  <p><span className="font-medium">Indication:</span> {consultation.indication}</p>
                                )}
                              </div>
                            </div>
                            
                            {(consultation.ordonnance || consultation.notesPharmacien) && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {consultation.ordonnance && (
                                  <p className="text-sm"><span className="font-medium">Ordonnance:</span> {consultation.ordonnance}</p>
                                )}
                                {consultation.notesPharmacien && (
                                  <p className="text-sm"><span className="font-medium">Notes:</span> {consultation.notesPharmacien}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune consultation trouvée pour ce patient</p>
                    <p className="text-sm">Les consultations apparaîtront ici une fois créées</p>
                  </div>
                );
              })()}
            </div>

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
      )}

      {/* Modal de la carte virtuelle */}
      {showCardModal && selectedPatient && (
        <PatientCard
          patientId={selectedPatient.id}
          onClose={() => {
            setShowCardModal(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default Patients; 