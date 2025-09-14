import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Eye, Trash2, User, X, Save, Calendar, Stethoscope, QrCode, ChevronDown, ChevronRight, Pill, Activity, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PatientCard from '../../components/PatientCard';

interface ConsultationMedicament {
  id: number;
  nomMedicament: string;
  dciMedicament?: string;
  classeTherapeutique?: string;
  posologie: string;
  quantite: number;
  unite: string;
  dateDebutPrise?: string;
  dateFinPrise?: string;
  effetsIndesirablesSignales?: string;
  observance?: 'bonne' | 'moyenne' | 'mauvaise';
  statut: 'en_cours' | 'termine' | 'arrete';
  precaution?: string;
}

interface Consultation {
  id: number;
  numeroConsultation: string;
  medecinConsultant: string;
  dateConsultation: string;
  diagnostic?: string;
  indication?: string;
  prescription?: string;
  notesPharmacien?: string;
  statut: 'active' | 'terminee' | 'annulee' | 'renouvellement';
  typeConsultation: 'courte' | 'longue' | 'renouvellement' | 'urgence';
  medicaments?: ConsultationMedicament[];
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
  email?: string;
  numeroSecu?: string;
  lieuNaissance?: string;
  nationalite?: string;
  profession?: string;
  situationFamiliale?: string;
  nombreEnfants?: number;
  medecinTraitant?: string;
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
  email?: string;
  numeroSecu?: string;
  lieuNaissance?: string;
  nationalite?: string;
  profession?: string;
  situationFamiliale?: string;
  nombreEnfants?: number;
  medecinTraitant?: string;
}

const Patients: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [expandedConsultations, setExpandedConsultations] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  
  // États pour les modals d'ajout
  const [showAddConsultationModal, setShowAddConsultationModal] = useState(false);
  const [showAddMedicamentModal, setShowAddMedicamentModal] = useState(false);
  const [showAddBiologiqueModal, setShowAddBiologiqueModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  
  // États pour la protection des données
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authenticatedPatients, setAuthenticatedPatients] = useState<Set<number>>(new Set());
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // États pour la recherche directe
  const [directSearchCode, setDirectSearchCode] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [showDirectSearch, setShowDirectSearch] = useState(false);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Hook form pour le nouveau patient
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewPatientForm>();

  // Récupérer les patients
  const { data: patientsData, isLoading, error } = useQuery(
    ['patients', currentPage],
    () => api.get(`/api/patients?page=${currentPage}`),
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
        setIsEditing(false);
        setSelectedPatient(null);
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

  // Mutation pour mettre à jour un patient
  const updatePatient = useMutation(
    ({ id, data }: { id: number; data: any }) => api.put(`/api/patients/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Patient modifié avec succès');
        queryClient.invalidateQueries('patients');
        setShowModal(false);
        setIsEditing(false);
        setSelectedPatient(null);
        reset();
      },
      onError: (error: any) => {
        console.error('Erreur détaillée:', error.response?.data);
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
          toast.error(`Erreurs de validation: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de la modification du patient');
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


  // Fonctions de gestion de l'authentification
  const handleAccessPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowAccessModal(true);
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient && accessCode) {
      // Vérifier le code d'accès avec seulement la date de naissance
      const expectedCode = selectedPatient.dateNaissance.replace(/-/g, '');
      if (accessCode === expectedCode) {
        setAuthenticatedPatients(prev => new Set(Array.from(prev).concat(selectedPatient.id)));
        setShowAccessModal(false);
        setAccessCode('');
        toast.success('Accès autorisé');
      } else {
        toast.error('Code d\'accès incorrect');
      }
    }
  };

  const handleQRScan = (qrData: string) => {
    try {
      const data = JSON.parse(qrData);
      if (data.patientId && data.accessCode) {
        const patient = patientsData?.data?.patients?.find((p: Patient) => p.id === data.patientId);
        if (patient) {
          const expectedCode = patient.dateNaissance.replace(/-/g, '');
          if (data.accessCode === expectedCode) {
            setAuthenticatedPatients(prev => new Set(Array.from(prev).concat(patient.id)));
            setShowQRScanner(false);
            toast.success('Accès autorisé via QR');
          } else {
            toast.error('Code QR invalide');
          }
        }
      }
    } catch (error) {
      toast.error('QR Code invalide');
    }
  };

  const isPatientAuthenticated = (patientId: number) => {
    return authenticatedPatients.has(patientId);
  };

  // Fonction de recherche directe par code
  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSearchCode.trim()) return;

    // Rechercher le patient par date de naissance
    const patient = patientsData?.data?.patients?.find((p: Patient) => 
      p.dateNaissance.replace(/-/g, '') === directSearchCode.trim()
    );

    if (patient) {
      setFoundPatient(patient);
      setShowDirectSearch(true);
      // Auto-authentifier le patient trouvé
      setAuthenticatedPatients(prev => new Set(Array.from(prev).concat(patient.id)));
      toast.success(`Patient trouvé : ${patient.firstName} ${patient.lastName}`);
    } else {
      toast.error('Aucun patient trouvé avec ce code');
    }
  };

  const clearDirectSearch = () => {
    setDirectSearchCode('');
    setFoundPatient(null);
    setShowDirectSearch(false);
  };

  // Fonction pour ouvrir le modal de modification
  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(true);
    setShowModal(true);
    // Pré-remplir le formulaire avec les données du patient
    reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateNaissance: patient.dateNaissance,
      sexe: patient.sexe,
      poids: patient.poids,
      taille: patient.taille,
      adresse: patient.adresse,
      telephone: patient.telephone,
      groupeSanguin: patient.groupeSanguin,
      assurance: patient.assurance,
      email: patient.email,
      numeroSecu: patient.numeroSecu,
      lieuNaissance: patient.lieuNaissance,
      nationalite: patient.nationalite,
      profession: patient.profession,
      situationFamiliale: patient.situationFamiliale,
      nombreEnfants: patient.nombreEnfants,
      medecinTraitant: patient.medecinTraitant
    });
  };

  // Fonction pour ouvrir le modal d'ajout
  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsEditing(false);
    setShowModal(true);
    reset();
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
    
    if (isEditing && selectedPatient) {
      // Mode édition
      updatePatient.mutate({ id: selectedPatient.id, data: patientData });
    } else {
      // Mode création
      createPatient.mutate(patientData);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedPatient(null);
    reset();
  };

  // const calculateIMC = (poids: number, taille: number) => {
  //   if (poids && taille) {
  //     const tailleEnMetres = taille / 100;
  //     return (poids / (tailleEnMetres * tailleEnMetres)).toFixed(1);
  //   }
  //   return 'N/A';
  // };

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

  // Fonctions pour gérer les dépliants
  const toggleConsultation = (consultationId: number) => {
    setExpandedConsultations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(consultationId)) {
        newSet.delete(consultationId);
      } else {
        newSet.add(consultationId);
      }
      return newSet;
    });
  };

  const isConsultationExpanded = (consultationId: number) => {
    return expandedConsultations.has(consultationId);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Patients</h1>
          <p className="text-sm text-gray-600 mt-1">
            🔒 Les informations médicales sont protégées par code d'accès ou QR Code
          </p>
        </div>
        <button
          onClick={handleAddPatient}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nouveau Patient
        </button>
      </div>

      {/* Recherche directe par code */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">🔍 Recherche directe par code d'accès</h3>
        <form onSubmit={handleDirectSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={20} />
              <input
                type="text"
                placeholder="Entrez le code d'accès (date de naissance)..."
                value={directSearchCode}
                onChange={(e) => setDirectSearchCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Accéder au profil
          </button>
        </form>
        <p className="text-sm text-blue-600 mt-2">
          💡 Saisissez le code d'accès du patient pour accéder directement à son profil
        </p>
      </div>


      {/* Affichage du profil trouvé ou liste des patients */}
      {showDirectSearch && foundPatient ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Profil Patient - {foundPatient.firstName} {foundPatient.lastName}
              </h2>
              <button
                onClick={clearDirectSearch}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
              >
                <X size={20} />
                Retour à la liste
              </button>
            </div>
            
            {/* Informations du patient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Informations personnelles</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nom:</span> {foundPatient.firstName} {foundPatient.lastName}</p>
                  <p><span className="font-medium">Date de naissance:</span> {new Date(foundPatient.dateNaissance).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Âge:</span> {getAge(foundPatient.dateNaissance)} ans</p>
                  <p><span className="font-medium">Poids:</span> {foundPatient.poids || 'N/A'} kg</p>
                  <p><span className="font-medium">Taille:</span> {foundPatient.taille || 'N/A'} cm</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Traitements</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Chroniques:</span> {foundPatient.traitementsChroniques?.length ? foundPatient.traitementsChroniques.join(', ') : 'Aucun'}</p>
                  <p><span className="font-medium">Ponctuels:</span> {foundPatient.traitementsPonctuels?.length ? foundPatient.traitementsPonctuels.join(', ') : 'Aucun'}</p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedPatient(foundPatient);
                  setShowCardModal(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <QrCode size={16} />
                Carte virtuelle
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(foundPatient);
                  setShowDetailsModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Eye size={16} />
                Détails complets
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(foundPatient);
                  setShowModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Modifier
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Informations</th>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {isPatientAuthenticated(patient.id) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                      Accès autorisé
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                      Accès restreint
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isPatientAuthenticated(patient.id) ? (
                    <div className="text-sm text-gray-900">
                      <div>Âge: {getAge(patient.dateNaissance)} ans</div>
                      <div>Poids: {patient.poids || 'N/A'} kg</div>
                      <div>Chroniques: {patient.traitementsChroniques?.length ? patient.traitementsChroniques.slice(0,2).join(', ') : 'Aucun'}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      🔒 Informations protégées
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {isPatientAuthenticated(patient.id) ? (
                      <>
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
                          onClick={() => handleEditPatient(patient)}
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
                      </>
                    ) : (
                      <button
                        onClick={() => handleAccessPatient(patient)}
                        className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                        title="Accéder aux informations"
                      >
                        <div className="w-4 h-4 border-2 border-orange-600 rounded"></div>
                        Accès
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

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
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Modifier le Patient' : 'Nouveau Patient'}
              </h3>
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
                  disabled={createPatient.isLoading || updatePatient.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {(createPatient.isLoading || updatePatient.isLoading) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditing ? 'Modification...' : 'Création...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {isEditing ? 'Modifier le patient' : 'Créer le patient'}
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddConsultationModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Ajouter une consultation"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Consultation
                  </button>
                  <button
                    onClick={() => refetchConsultations()}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Actualiser
                  </button>
                </div>
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
                          <div key={consultation.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* En-tête de la consultation (toujours visible) */}
                            <div 
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleConsultation(consultation.id)}
                            >
                              <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-blue-600">
                                  #{consultation.numeroConsultation}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consultation.statut)}`}>
                                  {getStatusText(consultation.statut)}
                                </span>
                                  {consultation.medicaments && consultation.medicaments.length > 0 && (
                                    <div className="flex items-center text-xs text-blue-600">
                                      <Pill className="w-3 h-3 mr-1" />
                                      {consultation.medicaments.length} médicament{consultation.medicaments.length > 1 ? 's' : ''}
                              </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {formatDate(consultation.dateConsultation)}
                              </span>
                                  {isConsultationExpanded(consultation.id) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Contenu dépliable */}
                            {isConsultationExpanded(consultation.id) && (
                              <div className="border-t border-gray-200 p-4 bg-gray-50">
                                <div className="space-y-4">
                                  {/* Informations de base */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><span className="font-medium">Médecin:</span> Dr. {consultation.medecinConsultant}</p>
                                <p><span className="font-medium">Type:</span> {consultation.typeConsultation}</p>
                              </div>
                              <div>
                                      <p><span className="font-medium">Date:</span> {formatDate(consultation.dateConsultation)}</p>
                                      <p><span className="font-medium">Statut:</span> {getStatusText(consultation.statut)}</p>
                                    </div>
                                  </div>

                                  {/* Informations médicales */}
                                  {(consultation.diagnostic || consultation.indication) && (
                                    <div className="border-t pt-3">
                                      <h4 className="font-medium text-gray-900 mb-2">Informations médicales</h4>
                                      <div className="space-y-2 text-sm">
                                {consultation.diagnostic && (
                                  <p><span className="font-medium">Diagnostic:</span> {consultation.diagnostic}</p>
                                )}
                                {consultation.indication && (
                                  <p><span className="font-medium">Indication:</span> {consultation.indication}</p>
                                )}
                              </div>
                            </div>
                                  )}

                                  {/* Médicaments prescrits */}
                                  {consultation.medicaments && consultation.medicaments.length > 0 && (
                                    <div className="border-t pt-3">
                                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                        <Pill className="w-4 h-4 mr-2 text-blue-600" />
                                        Médicaments prescrits ({consultation.medicaments.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {consultation.medicaments.map((medicament, index) => (
                                          <div key={medicament.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                              <h5 className="font-medium text-gray-900">
                                                {index + 1}. {medicament.nomMedicament}
                                              </h5>
                                              <span className={`px-2 py-1 text-xs rounded-full ${
                                                medicament.statut === 'en_cours' ? 'bg-green-100 text-green-800' :
                                                medicament.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {medicament.statut === 'en_cours' ? 'En cours' :
                                                 medicament.statut === 'termine' ? 'Terminé' : 'Arrêté'}
                                              </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                              {medicament.dciMedicament && (
                                                <p><span className="font-medium">DCI:</span> {medicament.dciMedicament}</p>
                                              )}
                                              {medicament.classeTherapeutique && (
                                                <p><span className="font-medium">Classe:</span> {medicament.classeTherapeutique}</p>
                                              )}
                                              <p><span className="font-medium">Posologie:</span> {medicament.posologie}</p>
                                              <p><span className="font-medium">Quantité:</span> {medicament.quantite} {medicament.unite}</p>
                                            </div>

                                            {(medicament.dateDebutPrise || medicament.dateFinPrise) && (
                                              <div className="mt-2 text-sm">
                                                <span className="font-medium">Période de prise:</span>
                                                <div className="ml-4">
                                                  {medicament.dateDebutPrise && <p>• Début: {formatDate(medicament.dateDebutPrise)}</p>}
                                                  {medicament.dateFinPrise && <p>• Fin: {formatDate(medicament.dateFinPrise)}</p>}
                                                </div>
                                              </div>
                                            )}

                                            {medicament.effetsIndesirablesSignales && (
                                              <div className="mt-2 text-sm">
                                                <span className="font-medium text-red-900">Effets indésirables:</span>
                                                <p className="text-red-700">{medicament.effetsIndesirablesSignales}</p>
                                              </div>
                                            )}

                                            {medicament.observance && (
                                              <div className="mt-2 text-sm">
                                                <span className="font-medium">Observance:</span>
                                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                                  medicament.observance === 'bonne' ? 'bg-green-100 text-green-800' :
                                                  medicament.observance === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                                                  'bg-red-100 text-red-800'
                                                }`}>
                                                  {medicament.observance === 'bonne' ? 'Bonne' :
                                                   medicament.observance === 'moyenne' ? 'Moyenne' : 'Mauvaise'}
                                                </span>
                                              </div>
                                            )}

                                            {medicament.precaution && (
                                              <div className="mt-2 text-sm">
                                                <span className="font-medium">Précautions:</span>
                                                <p className="text-gray-700">{medicament.precaution}</p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Prescription et notes */}
                            {(consultation.prescription || consultation.notesPharmacien) && (
                              <div className="border-t pt-3">
                                      <h4 className="font-medium text-gray-900 mb-2">Prescription et notes</h4>
                                      <div className="space-y-2 text-sm">
                                {consultation.prescription && (
                                          <p><span className="font-medium">Prescription:</span> {consultation.prescription}</p>
                                )}
                                {consultation.notesPharmacien && (
                                          <p><span className="font-medium">Notes du pharmacien:</span> {consultation.notesPharmacien}</p>
                                )}
                                      </div>
                                    </div>
                                  )}
                                </div>
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

            {/* Section d'actions - Boutons d'ajout */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-600" />
                Ajouter de nouvelles données
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Bouton Ajouter Consultation */}
                <button
                  onClick={() => setShowAddConsultationModal(true)}
                  className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                >
                  <Stethoscope className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-blue-900">Nouvelle Consultation</span>
                  <span className="text-xs text-blue-600 mt-1">Examen médical</span>
                </button>

                {/* Bouton Ajouter Médicament */}
                <button
                  onClick={() => setShowAddMedicamentModal(true)}
                  className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
                >
                  <Pill className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-green-900">Nouveau Médicament</span>
                  <span className="text-xs text-green-600 mt-1">Prescription</span>
                </button>

                {/* Bouton Ajouter Constantes Biologiques */}
                <button
                  onClick={() => setShowAddBiologiqueModal(true)}
                  className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
                >
                  <Activity className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-purple-900">Constantes Biologiques</span>
                  <span className="text-xs text-purple-600 mt-1">Analyses</span>
                </button>

                {/* Bouton Ajouter Prescription */}
                <button
                  onClick={() => setShowAddPrescriptionModal(true)}
                  className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors group"
                >
                  <FileText className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-orange-900">Nouvelle Prescription</span>
                  <span className="text-xs text-orange-600 mt-1">Prescription</span>
                </button>
              </div>
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

      {/* Modal d'ajout de consultation */}
      {showAddConsultationModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle Consultation</h2>
              <button
                onClick={() => setShowAddConsultationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const consultationData = {
                  patientId: selectedPatient.id,
                  numeroConsultation: `CONS-${Date.now()}`,
                  medecinConsultant: formData.get('medecinConsultant') as string,
                  dateConsultation: formData.get('dateConsultation') as string,
                  diagnostic: formData.get('diagnostic') as string,
                  indication: formData.get('indication') as string,
                  typeConsultation: formData.get('typeConsultation') as string,
                  prescription: formData.get('prescription') as string,
                  notesPharmacien: formData.get('notesPharmacien') as string
                };

                await api.post('/api/consultations', consultationData);
                toast.success('Consultation ajoutée avec succès');
                setShowAddConsultationModal(false);
                refetchConsultations();
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de la consultation');
              }
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médecin consultant *
                    </label>
                    <input
                      type="text"
                      name="medecinConsultant"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Dr. Nom du médecin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de consultation *
                    </label>
                    <input
                      type="datetime-local"
                      name="dateConsultation"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de consultation *
                  </label>
                  <select
                    name="typeConsultation"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="courte">Consultation courte</option>
                    <option value="longue">Consultation longue</option>
                    <option value="renouvellement">Renouvellement</option>
                    <option value="urgence">Urgence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnostic
                  </label>
                  <textarea
                    name="diagnostic"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Diagnostic établi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indication
                  </label>
                  <textarea
                    name="indication"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Indication du traitement..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prescription
                  </label>
                  <textarea
                    name="prescription"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Détails de la prescription..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes du pharmacien
                  </label>
                  <textarea
                    name="notesPharmacien"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes et observations..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddConsultationModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Créer la consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout de médicament */}
      {showAddMedicamentModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouveau Médicament</h2>
              <button
                onClick={() => setShowAddMedicamentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const medicamentData = {
                  nomCommercial: formData.get('nomCommercial') as string,
                  dci: formData.get('dci') as string,
                  classeTherapeutique: formData.get('classeTherapeutique') as string,
                  formePharmaceutique: formData.get('formePharmaceutique') as string,
                  dosage: formData.get('dosage') as string,
                  laboratoire: formData.get('laboratoire') as string,
                  indication: formData.get('indication') as string,
                  posologie: formData.get('posologie') as string
                };

                await api.post('/api/medicaments', medicamentData);
                toast.success('Médicament ajouté avec succès');
                setShowAddMedicamentModal(false);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du médicament');
              }
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du médicament *
                    </label>
                    <input
                      type="text"
                      name="nomCommercial"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Paracétamol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DCI
                    </label>
                    <input
                      type="text"
                      name="dci"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Dénomination Commune Internationale"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posologie *
                    </label>
                    <input
                      type="text"
                      name="posologie"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: 1 comprimé matin et soir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité *
                    </label>
                    <input
                      type="number"
                      name="quantite"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unité
                    </label>
                    <select name="unite" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="comprimé">Comprimé</option>
                      <option value="gélule">Gélule</option>
                      <option value="ml">ml</option>
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select name="statut" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                      <option value="arrete">Arrêté</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classe thérapeutique
                    </label>
                    <input
                      type="text"
                      name="classeTherapeutique"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Analgésique"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forme pharmaceutique
                    </label>
                    <input
                      type="text"
                      name="formePharmaceutique"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Comprimé"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      name="dosage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Laboratoire
                    </label>
                    <input
                      type="text"
                      name="laboratoire"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Sanofi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indication
                  </label>
                  <textarea
                    name="indication"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Indications thérapeutiques..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddMedicamentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Pill className="w-4 h-4 mr-2" />
                  Ajouter le médicament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout de constantes biologiques */}
      {showAddBiologiqueModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Constantes Biologiques</h2>
              <button
                onClick={() => setShowAddBiologiqueModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              toast.success('Fonctionnalité d\'ajout de constantes biologiques en cours de développement');
              setShowAddBiologiqueModal(false);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'analyse *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="glycemie">Glycémie</option>
                      <option value="cholesterol">Cholestérol</option>
                      <option value="triglycerides">Triglycérides</option>
                      <option value="creatinine">Créatinine</option>
                      <option value="uree">Urée</option>
                      <option value="hemoglobine">Hémoglobine</option>
                      <option value="autres">Autres</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de prélèvement *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valeur *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 5.2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unité *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: g/L, mmol/L"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeurs de référence
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 3.9 - 6.1 mmol/L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaires
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Observations et commentaires..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddBiologiqueModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Enregistrer les constantes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout de prescription */}
      {showAddPrescriptionModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle Prescription</h2>
              <button
                onClick={() => setShowAddPrescriptionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              toast.success('Fonctionnalité d\'ajout de prescription en cours de développement');
              setShowAddPrescriptionModal(false);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de prescription *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: RX-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de prescription *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médecin prescripteur *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Dr. Nom du médecin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spécialité
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: Médecine générale"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prescription *
                  </label>
                  <textarea
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Détails de la prescription..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Notes et observations..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddPrescriptionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Créer la prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'accès aux informations patient */}
      {showAccessModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Accès aux informations</h2>
              <button
                onClick={() => setShowAccessModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Code d'accès requis pour consulter les informations médicales
              </p>
            </div>

            <div className="space-y-4">
              {/* Code d'accès */}
              <form onSubmit={handleAccessCodeSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code d'accès
                  </label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Entrez le code d'accès"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: Date de naissance (ex: 20231201)
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Accéder aux informations
                </button>
              </form>

              {/* Scan QR */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Ou scanner le QR Code</p>
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode size={20} />
                  Scanner QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de scan QR */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Scanner QR Code</h2>
              <button
                onClick={() => setShowQRScanner(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <QrCode size={48} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Zone de scan QR</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Placez le QR Code du patient dans cette zone
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  // Simulation d'un scan QR réussi
                  const mockQRData = JSON.stringify({
                    patientId: selectedPatient?.id,
                    accessCode: selectedPatient?.dateNaissance.replace(/-/g, '')
                  });
                  handleQRScan(mockQRData);
                }}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Simuler le scan (démo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients; 