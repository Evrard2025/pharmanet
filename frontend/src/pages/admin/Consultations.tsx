import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Eye, Trash2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ConsultationMedicament {
  id: number;
  consultationId: number;
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
  patientId: number;
  medecinConsultant: string;
  dateConsultation: string;
  diagnostic?: string;
  indication?: string;
  prescription?: string;
  notesPharmacien?: string;
  statut: 'active' | 'terminee' | 'annulee' | 'renouvellement';
  typeConsultation: 'courte' | 'longue' | 'renouvellement' | 'urgence';
  Patient: {
    firstName: string;
    lastName: string;
  };
  medicaments?: ConsultationMedicament[];
  createdAt: string;
  updatedAt: string;
}

interface NewConsultationForm {
  patientId: number;
  medecinConsultant: string;
  dateConsultation: string;
  diagnostic: string;
  indication: string;
  prescription: string;
  notesPharmacien: string;
  typeConsultation: 'courte' | 'longue' | 'renouvellement' | 'urgence';
}

interface NewMedicamentForm {
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
  precaution?: string;
}

const Consultations: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [nextConsultationNumber, setNextConsultationNumber] = useState<string>('');
  // const [selectedMedicament, setSelectedMedicament] = useState<any>(null);
  // const [medicamentResults, setMedicamentResults] = useState<any[]>([]);
  // const [showMedicamentResults, setShowMedicamentResults] = useState(false);
  const [consultationMedicaments, setConsultationMedicaments] = useState<NewMedicamentForm[]>([]);
  const [showMedicamentForm, setShowMedicamentForm] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'terminee': 'Terminée',
      'annulee': 'Annulée',
      'renouvellement': 'Renouvellement'
    };
    return statusMap[status] || status;
  };

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
  // Utilisation de nextNumberData pour éviter le warning
  console.log('Next number data:', nextNumberData);

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

  const handleSubmitConsultation = async (data: NewConsultationForm) => {
    try {
      console.log('Données de consultation à envoyer:', data);
      console.log('Médicaments à ajouter:', consultationMedicaments);
      
      // Créer la consultation d'abord
      const consultationResponse = await api.post('/api/consultations', data);
      const consultationId = consultationResponse.data.id;
      console.log('Consultation créée avec ID:', consultationId);
      
      // Ajouter les médicaments si il y en a
      if (consultationMedicaments.length > 0) {
        console.log(`Ajout de ${consultationMedicaments.length} médicaments...`);
        for (const medicament of consultationMedicaments) {
          console.log('Ajout du médicament:', medicament);
          const medicamentResponse = await api.post(`/api/consultations/${consultationId}/medicaments`, medicament);
          console.log('Médicament ajouté:', medicamentResponse.data);
        }
        console.log('Tous les médicaments ont été ajoutés');
      } else {
        console.log('Aucun médicament à ajouter');
      }
      
      toast.success('Consultation créée avec succès');
      resetForm();
      queryClient.invalidateQueries(['consultations']);
    } catch (error: any) {
      console.error('Erreur détaillée:', error.response?.data);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        toast.error(`Erreurs de validation: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la création de la consultation');
      }
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette consultation ?')) {
      deleteConsultation.mutate(id);
    }
  };

  const handleViewPatient = (patientId: number) => {
    navigate(`/admin/patients?patientId=${patientId}`);
  };

  // const handleMedicamentSearch = async (query: string) => {
  //   if (query.length < 2) {
  //     setMedicamentResults([]);
  //     setShowMedicamentResults(false);
  //     return;
  //   }

  //   try {
  //     const response = await api.get(`/api/medicaments/search?q=${encodeURIComponent(query)}`);
  //     setMedicamentResults(response.data.medicaments);
  //     setShowMedicamentResults(true);
  //   } catch (error) {
  //     console.error('Erreur lors de la recherche de médicaments:', error);
  //     setMedicamentResults([]);
  //   }
  // };

  // const selectMedicament = (medicament: any) => {
  //   setSelectedMedicament(medicament);
  //   setShowMedicamentResults(false);
  //   // Mettre à jour le champ caché
  //   const medicamentIdInput = document.getElementById('medicamentId') as HTMLInputElement;
  //   if (medicamentIdInput) {
  //     medicamentIdInput.value = medicament.id.toString();
  //   }
  // };

  const resetForm = () => {
    // setSelectedMedicament(null);
    // setMedicamentResults([]);
    // setShowMedicamentResults(false);
    setConsultationMedicaments([]);
    setShowMedicamentForm(false);
    setIsModalOpen(false);
  };

  // Fonctions pour gérer les médicaments
  const addMedicament = (medicament: NewMedicamentForm) => {
    console.log('Ajout du médicament à la liste:', medicament);
    console.log('Liste actuelle des médicaments:', consultationMedicaments);
    setConsultationMedicaments([...consultationMedicaments, medicament]);
    setShowMedicamentForm(false);
    console.log('Médicament ajouté, formulaire fermé');
  };

  const removeMedicament = (index: number) => {
    setConsultationMedicaments(consultationMedicaments.filter((_, i) => i !== index));
  };

  const handleMedicamentSubmit = () => {
    // Récupérer les valeurs des champs par leur nom
    const nomMedicament = (document.querySelector('input[name="nomMedicament"]') as HTMLInputElement)?.value;
    const dciMedicament = (document.querySelector('input[name="dciMedicament"]') as HTMLInputElement)?.value;
    const classeTherapeutique = (document.querySelector('input[name="classeTherapeutique"]') as HTMLInputElement)?.value;
    const posologie = (document.querySelector('textarea[name="posologie"]') as HTMLTextAreaElement)?.value;
    const quantite = (document.querySelector('input[name="quantite"]') as HTMLInputElement)?.value;
    const unite = (document.querySelector('select[name="unite"]') as HTMLSelectElement)?.value;
    const dateDebutPrise = (document.querySelector('input[name="dateDebutPrise"]') as HTMLInputElement)?.value;
    const dateFinPrise = (document.querySelector('input[name="dateFinPrise"]') as HTMLInputElement)?.value;
    const effetsIndesirablesSignales = (document.querySelector('textarea[name="effetsIndesirablesSignales"]') as HTMLTextAreaElement)?.value;
    const observance = (document.querySelector('select[name="observance"]') as HTMLSelectElement)?.value;
    const precaution = (document.querySelector('textarea[name="precaution"]') as HTMLTextAreaElement)?.value;

    // Validation des champs obligatoires
    if (!nomMedicament || !posologie || !quantite || !unite) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const medicament: NewMedicamentForm = {
      nomMedicament,
      dciMedicament: dciMedicament || undefined,
      classeTherapeutique: classeTherapeutique || undefined,
      posologie,
      quantite: parseInt(quantite),
      unite,
      dateDebutPrise: dateDebutPrise || undefined,
      dateFinPrise: dateFinPrise || undefined,
      effetsIndesirablesSignales: effetsIndesirablesSignales || undefined,
      observance: observance as 'bonne' | 'moyenne' | 'mauvaise' || undefined,
      precaution: precaution || undefined
    };
    
    console.log('Médicament soumis:', medicament);
    addMedicament(medicament);
    
    // Réinitialiser le formulaire
    const form = document.querySelector('.bg-blue-50');
    if (form) {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input: any) => {
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = false;
        } else {
          input.value = '';
        }
      });
    }
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
                      {consultation.medicaments && consultation.medicaments.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          💊 {consultation.medicaments.length} médicament{consultation.medicaments.length > 1 ? 's' : ''}
                        </div>
                      )}
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
                    diagnostic: formData.get('diagnostic') as string,
                    indication: formData.get('indication') as string,
                    prescription: formData.get('prescription') as string,
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                      <textarea
                        name="prescription"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Détails de la prescription..."
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

                    {/* Section Médicaments */}
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-medium text-gray-900">Médicaments prescrits</h4>
                        <button
                          type="button"
                          onClick={() => setShowMedicamentForm(!showMedicamentForm)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          {showMedicamentForm ? 'Annuler' : 'Ajouter un médicament'}
                        </button>
                      </div>

                      {/* Liste des médicaments ajoutés */}
                      {consultationMedicaments.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {consultationMedicaments.map((medicament, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{medicament.nomMedicament}</h5>
                                  {medicament.dciMedicament && (
                                    <p className="text-sm text-gray-600">DCI: {medicament.dciMedicament}</p>
                                  )}
                                  <p className="text-sm text-gray-600">Posologie: {medicament.posologie}</p>
                                  <p className="text-sm text-gray-600">Quantité: {medicament.quantite} {medicament.unite}</p>
                                  {medicament.dateDebutPrise && medicament.dateFinPrise && (
                                    <p className="text-sm text-gray-600">
                                      Période: {formatDate(medicament.dateDebutPrise)} - {formatDate(medicament.dateFinPrise)}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMedicament(index)}
                                  className="ml-2 text-red-600 hover:text-red-800"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulaire d'ajout de médicament */}
                      {showMedicamentForm && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-blue-900 mb-3">Nouveau médicament</h5>
                          <div onSubmit={handleMedicamentSubmit} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médicament *</label>
                                <input
                                  type="text"
                                  name="nomMedicament"
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Ex: Paracétamol 1000mg"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DCI</label>
                                <input
                                  type="text"
                                  name="dciMedicament"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Ex: Acétaminophène"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classe thérapeutique</label>
                                <input
                                  type="text"
                                  name="classeTherapeutique"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Ex: Analgésique, Antipyrétique"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                                <input
                                  type="number"
                                  name="quantite"
                                  required
                                  min="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
                                <select
                                  name="unite"
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="comprimé">Comprimé</option>
                                  <option value="gélule">Gélule</option>
                                  <option value="ml">ml</option>
                                  <option value="mg">mg</option>
                                  <option value="g">g</option>
                                  <option value="dose">Dose</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                <input
                                  type="date"
                                  name="dateDebutPrise"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                <input
                                  type="date"
                                  name="dateFinPrise"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observance</label>
                                <select
                                  name="observance"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Sélectionner</option>
                                  <option value="bonne">Bonne</option>
                                  <option value="moyenne">Moyenne</option>
                                  <option value="mauvaise">Mauvaise</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Posologie *</label>
                              <textarea
                                name="posologie"
                                required
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: 1 comprimé 3 fois par jour pendant 7 jours"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Effets indésirables signalés</label>
                              <textarea
                                name="effetsIndesirablesSignales"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Nausées, maux de tête, éruption cutanée"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Précautions</label>
                              <textarea
                                name="precaution"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Précautions particulières..."
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowMedicamentForm(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={handleMedicamentSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Ajouter le médicament
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
                  
                  {/* Informations médicales */}
                  {selectedConsultation.diagnostic && (
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium text-gray-900 mb-1">Diagnostic:</p>
                      <p className="text-gray-700">{selectedConsultation.diagnostic}</p>
                    </div>
                  )}
                  
                  {selectedConsultation.indication && (
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium text-gray-900 mb-1">Indication:</p>
                      <p className="text-gray-700">{selectedConsultation.indication}</p>
                    </div>
                  )}
                  
                  {selectedConsultation.prescription && (
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium text-gray-900 mb-1">Prescription:</p>
                      <p className="text-gray-700">{selectedConsultation.prescription}</p>
                    </div>
                  )}
                  
                  {selectedConsultation.notesPharmacien && (
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium text-gray-900 mb-1">Notes du pharmacien:</p>
                      <p className="text-gray-700">{selectedConsultation.notesPharmacien}</p>
                    </div>
                  )}

                  {/* Médicaments prescrits */}
                  {selectedConsultation.medicaments && selectedConsultation.medicaments.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium text-blue-900 mb-3">Médicaments prescrits ({selectedConsultation.medicaments.length}):</p>
                      <div className="space-y-4">
                        {selectedConsultation.medicaments.map((medicament, index) => (
                          <div key={medicament.id} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">
                                {index + 1}. {medicament.nomMedicament}
                              </h4>
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
                          </div>
                        ))}
                      </div>
                    </div>
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
