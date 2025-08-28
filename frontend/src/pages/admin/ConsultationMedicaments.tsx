import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, User, Pill, FlaskConical, Calendar, AlertTriangle, Info } from 'lucide-react';
import api from '../../services/api';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroSecu: string;
  telephone: string;
  email?: string;
}

interface Medicament {
  id: number;
  nomCommercial: string;
  dci: string;
  classeTherapeutique: string;
  sousClasse?: string;
  forme?: string;
  dosage?: string;
  laboratoire?: string;
  indication?: string;
  contreIndication?: string;
  effetsSecondaires?: string;
  interactions?: string;
  posologie?: string;
  surveillanceHepatique: boolean;
  surveillanceRenale: boolean;
  frequenceSurveillance: number;
  codeATC?: string;
  statut: 'actif' | 'inactif' | 'retire';
}

interface Consultation {
  id: number;
  patientId: number;
  medecinConsultant: string;
  dateConsultation: string;
  periodePrise?: string;
  datePriseMedicament?: string;
  diagnostic?: string;
  indication?: string;
  createdAt: string;
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
}

const ConsultationMedicaments: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);

  // Récupérer les patients
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    ['patients'],
    () => api.get('/api/patients')
  );

  // Récupérer les consultations du patient sélectionné
  const { data: consultationsData, isLoading: consultationsLoading } = useQuery(
    ['consultations', selectedPatient?.id],
    () => selectedPatient ? api.get(`/api/consultations?patientId=${selectedPatient.id}`) : null,
    {
      enabled: !!selectedPatient
    }
  );

  // Récupérer les médicaments
  const { data: medicamentsData, isLoading: medicamentsLoading } = useQuery(
    ['medicaments'],
    () => api.get('/api/medicaments')
  );

  // Récupérer les surveillances du patient sélectionné
  const { data: surveillanceData, isLoading: surveillanceLoading } = useQuery(
    ['surveillance', selectedPatient?.id],
    () => selectedPatient ? api.get(`/api/surveillance?patientId=${selectedPatient.id}`) : null,
    {
      enabled: !!selectedPatient
    }
  );

  const patients: Patient[] = patientsData?.data?.patients || [];
  const medicaments: Medicament[] = medicamentsData?.data?.medicaments || [];
  const consultations: Consultation[] = consultationsData?.data?.consultations || [];
  const surveillances: SurveillanceBiologique[] = surveillanceData?.data?.surveillances || [];

  // Filtrer les patients selon la recherche
  const filteredPatients = patients.filter(patient =>
    patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.numeroSecu.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getPeriodeText = (periode: string) => {
    const periodes: { [key: string]: string } = {
      'matin': 'Matin',
      'midi': 'Midi',
      'soir': 'Soir',
      'avant_repas': 'Avant repas',
      'apres_repas': 'Après repas',
      'a_jeun': 'À jeun',
      'toutes_les_8h': 'Toutes les 8h',
      'toutes_les_12h': 'Toutes les 12h',
      'quotidien': 'Quotidien'
    };
    return periodes[periode] || periode;
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

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consultation des Médicaments par Patient</h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez un patient pour consulter ses médicaments et surveillances
          </p>
        </div>

        {/* Sélection du Patient */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sélection du Patient</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un patient par nom, prénom ou numéro de sécurité sociale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {searchTerm && (
            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {patient.nom} {patient.prenom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.numeroSecu} • {formatDate(patient.dateNaissance)}
                        </div>
                      </div>
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500 text-center">
                  Aucun patient trouvé
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informations du Patient Sélectionné */}
        {selectedPatient && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations du Patient</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedPatient.nom} {selectedPatient.prenom}
                    </h3>
                    <p className="text-gray-600">Patient sélectionné</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-700">Numéro de sécurité sociale:</span> {selectedPatient.numeroSecu}</p>
                  <p><span className="font-medium text-gray-700">Date de naissance:</span> {formatDate(selectedPatient.dateNaissance)}</p>
                  <p><span className="font-medium text-gray-700">Téléphone:</span> {selectedPatient.telephone}</p>
                  {selectedPatient.email && (
                    <p><span className="font-medium text-gray-700">Email:</span> {selectedPatient.email}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Changer de patient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Médicaments et Consultations */}
        {selectedPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consultations */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Consultations Récentes</h3>
                <p className="text-sm text-gray-600 mt-1">Historique des consultations avec prescriptions</p>
              </div>
              <div className="p-6">
                {consultationsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : consultations.length > 0 ? (
                  <div className="space-y-4">
                    {consultations.map((consultation) => (
                      <div key={consultation.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">
                            Dr. {consultation.medecinConsultant}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(consultation.dateConsultation)}
                          </div>
                        </div>
                        {consultation.periodePrise && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Période de prise:</span> {getPeriodeText(consultation.periodePrise)}
                          </div>
                        )}
                        {consultation.datePriseMedicament && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Date de début:</span> {formatDate(consultation.datePriseMedicament)}
                          </div>
                        )}
                        {consultation.diagnostic && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Diagnostic:</span> {consultation.diagnostic}
                          </div>
                        )}
                        {consultation.indication && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Indication:</span> {consultation.indication}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune consultation</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Ce patient n'a pas encore de consultations enregistrées.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Surveillances Biologiques */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Surveillances Biologiques</h3>
                <p className="text-sm text-gray-600 mt-1">Suivi hépatique et rénal en cours</p>
              </div>
              <div className="p-6">
                {surveillanceLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : surveillances.length > 0 ? (
                  <div className="space-y-4">
                    {surveillances.map((surveillance) => (
                      <div key={surveillance.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(surveillance.typeSurveillance)}`}>
                                                         <FlaskConical className="w-3 h-3 mr-1" />
                            {getTypeText(surveillance.typeSurveillance)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            surveillance.statut === 'actif' ? 'bg-green-100 text-green-800' :
                            surveillance.statut === 'suspendu' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {surveillance.statut === 'actif' ? 'Actif' : surveillance.statut === 'suspendu' ? 'Suspendu' : 'Terminé'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Fréquence:</span> Tous les {surveillance.frequenceMois} mois
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Début:</span> {formatDate(surveillance.dateDebutSurveillance)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${isOverdue(surveillance.dateProchaineAnalyse) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            <span className="font-medium">Prochaine analyse:</span> {formatDate(surveillance.dateProchaineAnalyse)}
                          </span>
                          {isOverdue(surveillance.dateProchaineAnalyse) && (
                            <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                          )}
                        </div>
                        {surveillance.commentaires && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Commentaires:</span> {surveillance.commentaires}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                                         <FlaskConical className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune surveillance</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Ce patient n'a pas de surveillance biologique en cours.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sélection de Médicament pour Détails */}
        {selectedPatient && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Consulter un Médicament</h3>
              <p className="text-sm text-gray-600 mt-1">Sélectionnez un médicament pour voir ses informations détaillées</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Médicament à consulter
                  </label>
                  <select
                    value={selectedMedicament?.id || ''}
                    onChange={(e) => {
                      const medicamentId = parseInt(e.target.value);
                      const medicament = medicaments.find((m: Medicament) => m.id === medicamentId);
                      setSelectedMedicament(medicament || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un médicament</option>
                    {medicaments.map((medicament: Medicament) => (
                      <option key={medicament.id} value={medicament.id}>
                        {medicament.nomCommercial} ({medicament.dci})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setSelectedMedicament(null)}
                    disabled={!selectedMedicament}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Effacer la sélection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Détails du Médicament Sélectionné */}
        {selectedMedicament && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails du Médicament: {selectedMedicament.nomCommercial}
                </h3>
                <button
                  onClick={() => setSelectedMedicament(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fermer</span>
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nom commercial:</span>
                      <p className="text-gray-900">{selectedMedicament.nomCommercial}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">DCI:</span>
                      <p className="text-gray-900">{selectedMedicament.dci}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Classe thérapeutique:</span>
                      <p className="text-gray-900">{selectedMedicament.classeTherapeutique}</p>
                    </div>
                    {selectedMedicament.sousClasse && (
                      <div>
                        <span className="font-medium text-gray-700">Sous-classe:</span>
                        <p className="text-gray-900">{selectedMedicament.sousClasse}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Forme:</span>
                      <p className="text-gray-900">{selectedMedicament.forme || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dosage:</span>
                      <p className="text-gray-900">{selectedMedicament.dosage || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Laboratoire:</span>
                      <p className="text-gray-900">{selectedMedicament.laboratoire || 'Non spécifié'}</p>
                    </div>
                    {selectedMedicament.codeATC && (
                      <div>
                        <span className="font-medium text-gray-700">Code ATC:</span>
                        <p className="text-gray-900">{selectedMedicament.codeATC}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Surveillance biologique</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                                             <FlaskConical className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-gray-700">Surveillance hépatique:</span>
                      <span className={selectedMedicament.surveillanceHepatique ? 'text-green-600' : 'text-gray-400'}>
                        {selectedMedicament.surveillanceHepatique ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                                             <FlaskConical className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Surveillance rénale:</span>
                      <span className={selectedMedicament.surveillanceRenale ? 'text-green-600' : 'text-gray-400'}>
                        {selectedMedicament.surveillanceRenale ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    {(selectedMedicament.surveillanceHepatique || selectedMedicament.surveillanceRenale) && (
                      <div>
                        <span className="font-medium text-gray-700">Fréquence:</span>
                        <p className="text-gray-900">Tous les {selectedMedicament.frequenceSurveillance} mois</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 mb-3">Informations thérapeutiques</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="font-medium text-gray-700">Indication:</span>
                      <p className="text-gray-900 mt-1">{selectedMedicament.indication || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Contre-indication:</span>
                      <p className="text-gray-900 mt-1">{selectedMedicament.contreIndication || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Effets secondaires:</span>
                      <p className="text-gray-900 mt-1">{selectedMedicament.effetsSecondaires || 'Non spécifiés'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Interactions:</span>
                      <p className="text-gray-900 mt-1">{selectedMedicament.interactions || 'Non spécifiées'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Posologie:</span>
                      <p className="text-gray-900 mt-1">{selectedMedicament.posologie || 'Non spécifiée'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message d'instruction */}
        {!selectedPatient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <User className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Commencez par sélectionner un patient
            </h3>
            <p className="text-blue-700">
              Utilisez la barre de recherche ci-dessus pour trouver et sélectionner un patient. 
              Vous pourrez ensuite consulter ses médicaments et surveillances biologiques.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationMedicaments;
