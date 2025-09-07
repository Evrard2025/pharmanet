import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Download, Printer, QrCode, User, Calendar, Phone, MapPin, Heart, Activity, Pill, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface PatientCardProps {
  patientId: number;
  onClose: () => void;
}

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

interface SurveillanceBiologique {
  id: number;
  typeSurveillance: string;
  parametres: string[];
  frequenceMois: number;
  dateDebut: string;
  dateProchaineAnalyse: string;
  dateDerniereAnalyse?: string;
  resultatsDerniereAnalyse?: any;
  statut: string;
  priorite: string;
  notes?: string;
  laboratoire?: string;
  contactLaboratoire?: string;
}

interface PatientData {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  age?: number;
  sexe: string;
  poids: number;
  taille: number;
  groupeSanguin: string;
  adresse: string;
  telephone: string;
  email?: string;
  numeroSecu?: string;
  lieuNaissance?: string;
  nationalite?: string;
  profession?: string;
  situationFamiliale?: string;
  nombreEnfants?: number;
  traitementsChroniques: string[];
  traitementsPonctuels: string[];
  allergies?: string[];
  antecedentsMedicaux?: string[];
  antecedentsChirurgicaux?: string[];
  antecedentsFamiliaux?: string[];
  effetsIndesirables?: string;
  sousContraceptif: boolean;
  assurance: string;
  structureEmission: string;
  serviceEmission: string;
  medecinPrescripteur: string;
  medecinTraitant?: string;
  consultations: number;
  derniereConsultation: string | null;
  // Ajouter les consultations détaillées avec médicaments
  consultationsDetaillees: Array<{
    id: number;
    numero: string;
    date: string;
    medecin: string;
    diagnostic: string;
    indication: string;
    ordonnance: string;
    statut: string;
    type: string;
    notesPharmacien?: string;
    dateDebut?: string;
    dateFin?: string;
    isRenouvelable?: boolean;
    nombreRenouvellements?: number;
    renouvellementsRestants?: number;
    medicaments?: ConsultationMedicament[];
  }>;
  // Ajouter les informations de surveillance biologique
  surveillanceBiologique?: SurveillanceBiologique[];
}

// interface CardData {
//   patient: PatientData;
//   qrCode: string;
//   generatedAt: string;
//   cardNumber: string;
//   dataHash: string; // Hash pour vérifier les modifications
// }

const PatientCard: React.FC<PatientCardProps> = ({ patientId, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedConsultations, setExpandedConsultations] = useState<Set<number>>(new Set());

  // Récupérer les données de la carte
  const { data: cardData, isLoading: isCardLoading, error, refetch } = useQuery(
    ['patient-card', patientId],
    () => api.get(`/api/patients/${patientId}/card`),
    {
      enabled: !!patientId,
      onSuccess: (data) => {
        setLastUpdate(new Date());
      },
      onError: (error: any) => {
        toast.error('Erreur lors du chargement de la carte patient');
        console.error('Erreur carte patient:', error);
      }
    }
  );

  // Vérifier les mises à jour toutes les 30 secondes
  useEffect(() => {
    if (!cardData?.data?.dataHash) return;

    const checkForUpdates = async () => {
      try {
        const response = await api.get(`/api/patients/${patientId}/card/check-update`, {
          params: {
            dataHash: cardData.data.dataHash,
            lastUpdate: lastUpdate?.toISOString()
          }
        });

        if (response.data.needsUpdate) {
          toast.success('Mise à jour de la carte disponible');
          refetch();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    };

    const interval = setInterval(checkForUpdates, 30000); // Vérifier toutes les 30 secondes
    return () => clearInterval(interval);
  }, [patientId, cardData?.data?.dataHash, lastUpdate, refetch]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      await api.get(`/api/patients/${patientId}/card/pdf`);
      toast.success('Export PDF en cours de développement');
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      await api.post(`/api/patients/${patientId}/card/refresh`);
      await refetch();
      toast.success('Carte mise à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isCardLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Génération de la carte patient...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cardData?.data) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement de la carte patient</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { patient, qrCode, cardNumber, generatedAt } = cardData.data;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* En-tête de la carte */}
        <div className="text-center mb-6 print:mb-4">
          <div className="flex items-center justify-center mb-2">
            <Heart className="w-8 h-8 text-red-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Carte Patient</h2>
          </div>
          <p className="text-gray-600">Numéro: {cardNumber}</p>
          <p className="text-sm text-gray-500">Générée le: {new Date(generatedAt).toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Résumé complet du patient */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 print:bg-white print:border">
          <div className="flex items-center mb-3">
            <Heart className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-bold text-blue-800">Résumé complet du patient</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-bold text-blue-900">Identité:</span>
              <p className="text-gray-700">{patient.prenom} {patient.nom}</p>
              <p className="text-gray-600 text-xs">Né(e) le {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')} ({patient.sexe})</p>
              {patient.age && <p className="text-gray-600 text-xs">Âge: {patient.age} ans</p>}
            </div>
            <div>
              <span className="font-bold text-blue-900">Contact:</span>
              <p className="text-gray-700">{patient.telephone}</p>
              <p className="text-gray-600 text-xs">{patient.adresse}</p>
            </div>
            <div>
              <span className="font-bold text-blue-900">Médical:</span>
              <p className="text-gray-700">Groupe sanguin: {patient.groupeSanguin}</p>
              <p className="text-gray-600 text-xs">{patient.consultations} consultation(s) - Dernière: {patient.derniereConsultation ? new Date(patient.derniereConsultation).toLocaleDateString('fr-FR') : 'Aucune'}</p>
            </div>
          </div>
        </div>

        {/* Contenu de la carte */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:gap-4">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identité du patient complète */}
            <div className="bg-blue-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Identité complète</h3>
              </div>
              <div className="space-y-3">
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nom:</span> {patient.nom}
                  </div>
                  <div>
                    <span className="font-medium">Prénom:</span> {patient.prenom}
                  </div>
                  <div>
                    <span className="font-medium">Date de naissance:</span> {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}
                  </div>
                  <div>
                    <span className="font-medium">Sexe:</span> {patient.sexe}
                  </div>
                  <div>
                    <span className="font-medium">Groupe sanguin:</span> {patient.groupeSanguin}
                  </div>
                  {patient.numeroSecu && (
                    <div>
                      <span className="font-medium">N° Sécurité Sociale:</span> {patient.numeroSecu}
                    </div>
                  )}
                </div>

                {/* Informations complémentaires */}
                {(patient.email || patient.lieuNaissance || patient.nationalite || patient.profession) && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Informations complémentaires</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {patient.email && (
                        <div>
                          <span className="font-medium">Email:</span> {patient.email}
                        </div>
                      )}
                      {patient.lieuNaissance && (
                        <div>
                          <span className="font-medium">Lieu de naissance:</span> {patient.lieuNaissance}
                        </div>
                      )}
                      {patient.nationalite && (
                        <div>
                          <span className="font-medium">Nationalité:</span> {patient.nationalite}
                        </div>
                      )}
                      {patient.profession && (
                        <div>
                          <span className="font-medium">Profession:</span> {patient.profession}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Situation familiale */}
                {(patient.situationFamiliale || patient.nombreEnfants) && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Situation familiale</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {patient.situationFamiliale && (
                        <div>
                          <span className="font-medium">Situation:</span> {patient.situationFamiliale}
                        </div>
                      )}
                      {patient.nombreEnfants && (
                        <div>
                          <span className="font-medium">Nombre d'enfants:</span> {patient.nombreEnfants}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations physiques */}
            <div className="bg-green-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <Activity className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-800">Informations physiques</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Poids:</span> {patient.poids} kg
                </div>
                <div>
                  <span className="font-medium">Taille:</span> {patient.taille} cm
                </div>
              </div>
            </div>

            {/* Contact et adresse */}
            <div className="bg-purple-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-800">Contact</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-purple-600 mr-2" />
                  <span>{patient.telephone}</span>
                </div>
                <div>
                  <span className="font-medium">Adresse:</span> {patient.adresse}
                </div>
              </div>
            </div>

            {/* Traitements et antécédents complets */}
            <div className="bg-orange-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <Pill className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">Traitements et antécédents</h3>
              </div>
              <div className="space-y-3">
                {/* Traitements actuels */}
                <div>
                  <h4 className="font-medium text-orange-900 mb-2 text-sm">Traitements actuels</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Chroniques:</span> 
                      {patient.traitementsChroniques?.length > 0 ? (
                        <span className="ml-2">{patient.traitementsChroniques.join(', ')}</span>
                      ) : (
                        <span className="ml-2 text-gray-500">Aucun</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Ponctuels:</span> 
                      {patient.traitementsPonctuels?.length > 0 ? (
                        <span className="ml-2">{patient.traitementsPonctuels.join(', ')}</span>
                      ) : (
                        <span className="ml-2 text-gray-500">Aucun</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Sous contraceptif:</span> 
                      <span className="ml-2">{patient.sousContraceptif ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                </div>

                {/* Allergies */}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-red-900 mb-2 text-sm">⚠️ Allergies</h4>
                    <div className="text-sm">
                      <span className="text-red-700">{patient.allergies.join(', ')}</span>
                    </div>
                  </div>
                )}

                {/* Effets indésirables */}
                {patient.effetsIndesirables && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-orange-900 mb-2 text-sm">⚠️ Effets indésirables signalés</h4>
                    <div className="text-sm">
                      <span className="text-orange-700">{patient.effetsIndesirables}</span>
                    </div>
                  </div>
                )}

                {/* Antécédents médicaux */}
                {patient.antecedentsMedicaux && patient.antecedentsMedicaux.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-orange-900 mb-2 text-sm">Antécédents médicaux</h4>
                    <div className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        {patient.antecedentsMedicaux.map((antecedent: string, index: number) => (
                          <li key={index} className="text-gray-700">{antecedent}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Antécédents chirurgicaux */}
                {patient.antecedentsChirurgicaux && patient.antecedentsChirurgicaux.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-orange-900 mb-2 text-sm">Antécédents chirurgicaux</h4>
                    <div className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        {patient.antecedentsChirurgicaux.map((antecedent: string, index: number) => (
                          <li key={index} className="text-gray-700">{antecedent}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Antécédents familiaux */}
                {patient.antecedentsFamiliaux && patient.antecedentsFamiliaux.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-orange-900 mb-2 text-sm">Antécédents familiaux</h4>
                    <div className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        {patient.antecedentsFamiliaux.map((antecedent: string, index: number) => (
                          <li key={index} className="text-gray-700">{antecedent}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations médicales complètes */}
            <div className="bg-red-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-800">Informations médicales</h3>
              </div>
              <div className="space-y-3">
                {/* Informations de base */}
                <div>
                  <h4 className="font-medium text-red-900 mb-2 text-sm">Informations de base</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Assurance:</span> {patient.assurance || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Structure d'émission:</span> {patient.structureEmission}
                    </div>
                    <div>
                      <span className="font-medium">Service d'émission:</span> {patient.serviceEmission}
                    </div>
                    <div>
                      <span className="font-medium">Médecin prescripteur:</span> {patient.medecinPrescripteur}
                    </div>
                    {patient.medecinTraitant && (
                      <div>
                        <span className="font-medium">Médecin traitant:</span> {patient.medecinTraitant}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiques des consultations */}
                <div className="border-t pt-3">
                  <h4 className="font-medium text-red-900 mb-2 text-sm">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Nombre de consultations:</span> {patient.consultations}
                    </div>
                    {patient.derniereConsultation && (
                      <div>
                        <span className="font-medium">Dernière consultation:</span> {new Date(patient.derniereConsultation).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Surveillance biologique */}
            {patient.surveillanceBiologique && patient.surveillanceBiologique.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 print:bg-white print:border">
                <div className="flex items-center mb-3">
                  <Activity className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">Surveillance biologique</h3>
                </div>
                <div className="space-y-3">
                  {patient.surveillanceBiologique.map((surveillance: SurveillanceBiologique, index: number) => (
                    <div key={surveillance.id} className="bg-white rounded-lg border border-yellow-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-yellow-900 text-sm">
                          {surveillance.typeSurveillance.charAt(0).toUpperCase() + surveillance.typeSurveillance.slice(1)}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          surveillance.priorite === 'urgente' ? 'bg-red-100 text-red-800' :
                          surveillance.priorite === 'haute' ? 'bg-orange-100 text-orange-800' :
                          surveillance.priorite === 'normale' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {surveillance.priorite.charAt(0).toUpperCase() + surveillance.priorite.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Paramètres:</span>
                          <p className="text-gray-700">{surveillance.parametres.join(', ')}</p>
                        </div>
                        <div>
                          <span className="font-medium">Fréquence:</span>
                          <p className="text-gray-700">{surveillance.frequenceMois} mois</p>
                        </div>
                        <div>
                          <span className="font-medium">Date début:</span>
                          <p className="text-gray-700">{formatDate(surveillance.dateDebut)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Prochaine analyse:</span>
                          <p className="text-gray-700">{formatDate(surveillance.dateProchaineAnalyse)}</p>
                        </div>
                        {surveillance.dateDerniereAnalyse && (
                          <div>
                            <span className="font-medium">Dernière analyse:</span>
                            <p className="text-gray-700">{formatDate(surveillance.dateDerniereAnalyse)}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Statut:</span>
                          <p className="text-gray-700 capitalize">{surveillance.statut}</p>
                        </div>
                      </div>

                      {surveillance.laboratoire && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs">
                            <span className="font-medium">Laboratoire:</span> {surveillance.laboratoire}
                          </div>
                          {surveillance.contactLaboratoire && (
                            <div className="text-xs">
                              <span className="font-medium">Contact:</span> {surveillance.contactLaboratoire}
                            </div>
                          )}
                        </div>
                      )}

                      {surveillance.notes && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="font-medium text-xs">Notes:</span>
                          <p className="text-gray-700 text-xs mt-1">{surveillance.notes}</p>
                        </div>
                      )}

                      {surveillance.resultatsDerniereAnalyse && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="font-medium text-xs">Derniers résultats:</span>
                          <div className="text-xs mt-1">
                            {typeof surveillance.resultatsDerniereAnalyse === 'object' ? 
                              JSON.stringify(surveillance.resultatsDerniereAnalyse, null, 2) :
                              surveillance.resultatsDerniereAnalyse
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historique des consultations */}
            {patient.consultationsDetaillees && patient.consultationsDetaillees.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4 print:bg-white print:border">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-indigo-800">Historique des consultations</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto print:max-h-none">
                  {patient.consultationsDetaillees.map((consultation: any, index: number) => (
                    <div key={consultation.id} className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                      {/* En-tête de la consultation (toujours visible) */}
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleConsultation(consultation.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-indigo-700">
                              #{consultation.numero}
                            </span>
                            {consultation.medicaments && consultation.medicaments.length > 0 && (
                              <div className="flex items-center text-xs text-blue-600">
                                <Pill className="w-3 h-3 mr-1" />
                                {consultation.medicaments.length} médicament{consultation.medicaments.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(consultation.date)}
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
                        <div className="border-t border-indigo-200 p-3 bg-gray-50">
                          <div className="space-y-3">
                            {/* Informations de base complètes */}
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2 text-xs">Informations de la consultation</h4>
                              <div className="space-y-2">
                                {/* Informations principales */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-blue-900">Médecin:</span>
                                    <p className="text-gray-700">Dr. {consultation.medecin}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-900">Type:</span>
                                    <p className="text-gray-700 capitalize">{consultation.type}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-900">Date:</span>
                                    <p className="text-gray-700">{formatDate(consultation.date)}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-900">Statut:</span>
                                    <div className="mt-1">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        consultation.statut === 'active' ? 'bg-green-100 text-green-800' :
                                        consultation.statut === 'terminee' ? 'bg-blue-100 text-blue-800' :
                                        consultation.statut === 'annulee' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {consultation.statut === 'active' ? 'Active' :
                                         consultation.statut === 'terminee' ? 'Terminée' :
                                         consultation.statut === 'annulee' ? 'Annulée' :
                                         consultation.statut}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>

                            {/* Informations médicales complètes */}
                            {(consultation.diagnostic || consultation.indication || consultation.notesPharmacien) && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2 text-xs">Informations médicales</h4>
                                <div className="space-y-2 text-xs">
                                  {consultation.diagnostic && (
                                    <div>
                                      <span className="font-medium text-blue-900">Diagnostic:</span>
                                      <p className="text-gray-700 mt-1">{consultation.diagnostic}</p>
                                    </div>
                                  )}
                                  {consultation.indication && (
                                    <div>
                                      <span className="font-medium text-blue-900">Indication:</span>
                                      <p className="text-gray-700 mt-1">{consultation.indication}</p>
                                    </div>
                                  )}
                                  {consultation.notesPharmacien && (
                                    <div>
                                      <span className="font-medium text-blue-900">Notes du pharmacien:</span>
                                      <p className="text-gray-700 mt-1">{consultation.notesPharmacien}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Informations complémentaires de la consultation */}
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2 text-xs">Informations complémentaires</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium text-gray-600">ID Consultation:</span>
                                  <p className="text-gray-500">#{consultation.id}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Numéro:</span>
                                  <p className="text-gray-500">{consultation.numero}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Médecin:</span>
                                  <p className="text-gray-500">Dr. {consultation.medecin}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Type:</span>
                                  <p className="text-gray-500 capitalize">{consultation.type}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Date:</span>
                                  <p className="text-gray-500">{formatDate(consultation.date)}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Statut:</span>
                                  <p className="text-gray-500">{consultation.statut}</p>
                                </div>
                                {consultation.dateFin && (
                                  <div>
                                    <span className="font-medium text-gray-600">Date de fin:</span>
                                    <p className="text-gray-500">{formatDate(consultation.dateFin)}</p>
                                  </div>
                                )}
                                {consultation.ordonnance && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium text-gray-600">Ordonnance:</span>
                                    <p className="text-gray-500">{consultation.ordonnance}</p>
                                  </div>
                                )}
                                {consultation.isRenouvelable !== undefined && (
                                  <div>
                                    <span className="font-medium text-gray-600">Renouvelable:</span>
                                    <p className="text-gray-500">{consultation.isRenouvelable ? 'Oui' : 'Non'}</p>
                                  </div>
                                )}
                                {consultation.nombreRenouvellements !== undefined && (
                                  <div>
                                    <span className="font-medium text-gray-600">Renouvellements:</span>
                                    <p className="text-gray-500">{consultation.nombreRenouvellements}</p>
                                  </div>
                                )}
                                {consultation.renouvellementsRestants !== undefined && (
                                  <div>
                                    <span className="font-medium text-gray-600">Restants:</span>
                                    <p className="text-gray-500">{consultation.renouvellementsRestants}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Médicaments prescrits */}
                            {consultation.medicaments && consultation.medicaments.length > 0 && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2 text-xs flex items-center">
                                  <Pill className="w-3 h-3 mr-1 text-blue-600" />
                                  Médicaments prescrits ({consultation.medicaments.length})
                                </h4>
                                <div className="space-y-2">
                                  {consultation.medicaments.map((medicament: ConsultationMedicament, medIndex: number) => (
                                    <div key={medicament.id} className="bg-gray-50 p-2 rounded border-l-2 border-blue-400">
                                      <div className="flex justify-between items-start mb-1">
                                        <h5 className="font-medium text-gray-900 text-xs">
                                          {medIndex + 1}. {medicament.nomMedicament}
                                        </h5>
                                        <span className={`px-1 py-0.5 text-xs rounded-full ${
                                          medicament.statut === 'en_cours' ? 'bg-green-100 text-green-800' :
                                          medicament.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {medicament.statut === 'en_cours' ? 'En cours' :
                                           medicament.statut === 'termine' ? 'Terminé' : 'Arrêté'}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
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
                                        <div className="mt-1 text-xs">
                                          <span className="font-medium">Période:</span>
                                          <div className="ml-2">
                                            {medicament.dateDebutPrise && <p>• Début: {formatDate(medicament.dateDebutPrise)}</p>}
                                            {medicament.dateFinPrise && <p>• Fin: {formatDate(medicament.dateFinPrise)}</p>}
                                          </div>
                                        </div>
                                      )}

                                      {medicament.effetsIndesirablesSignales && (
                                        <div className="mt-1 text-xs">
                                          <span className="font-medium text-red-900">Effets:</span>
                                          <p className="text-red-700">{medicament.effetsIndesirablesSignales}</p>
                                        </div>
                                      )}

                                      {medicament.observance && (
                                        <div className="mt-1 text-xs">
                                          <span className="font-medium">Observance:</span>
                                          <span className={`ml-1 px-1 py-0.5 text-xs rounded-full ${
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
                                        <div className="mt-1 text-xs">
                                          <span className="font-medium text-orange-900">Précautions:</span>
                                          <p className="text-orange-700">{medicament.precaution}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}


                            {/* Résumé complet de la consultation */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded border border-blue-200">
                              <h4 className="font-medium text-blue-900 mb-2 text-xs">Résumé de la consultation</h4>
                              <div className="space-y-3">
                                {/* Informations de base */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-blue-800">Numéro:</span>
                                    <p className="text-gray-700">#{consultation.numero}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">Médecin:</span>
                                    <p className="text-gray-700">Dr. {consultation.medecin}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">Type:</span>
                                    <p className="text-gray-700 capitalize">{consultation.type}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">Date:</span>
                                    <p className="text-gray-700">{formatDate(consultation.date)}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">Statut:</span>
                                    <div className="mt-1">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        consultation.statut === 'active' ? 'bg-green-100 text-green-800' :
                                        consultation.statut === 'terminee' ? 'bg-blue-100 text-blue-800' :
                                        consultation.statut === 'annulee' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {consultation.statut === 'active' ? 'Active' :
                                         consultation.statut === 'terminee' ? 'Terminée' :
                                         consultation.statut === 'annulee' ? 'Annulée' :
                                         consultation.statut}
                                      </span>
                                    </div>
                                  </div>
                                  {consultation.medicaments && consultation.medicaments.length > 0 && (
                                    <div>
                                      <span className="font-medium text-blue-800">Médicaments:</span>
                                      <p className="text-gray-700">{consultation.medicaments.length} prescrit(s)</p>
                                    </div>
                                  )}
                                </div>

                                {/* Liste des médicaments dans le résumé */}
                                {consultation.medicaments && consultation.medicaments.length > 0 && (
                                  <div className="border-t pt-2 mt-2">
                                    <h5 className="font-medium text-blue-800 mb-2 text-xs flex items-center">
                                      <Pill className="w-3 h-3 mr-1" />
                                      Médicaments prescrits
                                    </h5>
                                    <div className="space-y-1">
                                      {consultation.medicaments.map((medicament: ConsultationMedicament, medIndex: number) => (
                                        <div key={medicament.id} className="bg-white p-2 rounded border border-blue-200">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <p className="font-medium text-gray-900 text-xs">
                                                {medIndex + 1}. {medicament.nomMedicament}
                                              </p>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1 text-xs">
                                                <p><span className="font-medium">Posologie:</span> {medicament.posologie}</p>
                                                <p><span className="font-medium">Quantité:</span> {medicament.quantite} {medicament.unite}</p>
                                                {medicament.dciMedicament && (
                                                  <p><span className="font-medium">DCI:</span> {medicament.dciMedicament}</p>
                                                )}
                                                {(medicament.dateDebutPrise || medicament.dateFinPrise) && (
                                                  <p><span className="font-medium">Période:</span> 
                                                    {medicament.dateDebutPrise && ` ${formatDate(medicament.dateDebutPrise)}`}
                                                    {medicament.dateFinPrise && ` - ${formatDate(medicament.dateFinPrise)}`}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="ml-2">
                                              <span className={`px-2 py-1 text-xs rounded-full ${
                                                medicament.statut === 'en_cours' ? 'bg-green-100 text-green-800' :
                                                medicament.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {medicament.statut === 'en_cours' ? 'En cours' :
                                                 medicament.statut === 'termine' ? 'Terminé' : 'Arrêté'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-600 mt-2 print:text-xs">
                  {patient.consultationsDetaillees.length} consultation(s) au total
                </p>
              </div>
            )}
          </div>

          {/* QR Code et actions */}
          <div className="space-y-4">
            {/* QR Code */}
            <div className="bg-gray-50 rounded-lg p-4 text-center print:bg-white print:border">
              <div className="flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">QR Code</h3>
              </div>
              <div className="bg-white p-2 rounded-lg inline-block">
                <img 
                  src={qrCode} 
                  alt="QR Code Patient" 
                  className="w-32 h-32 print:w-24 print:h-24"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 print:text-xs">
                Scannez pour accéder aux informations
              </p>
            </div>

            {/* Actions */}
            <div className="bg-blue-50 rounded-lg p-4 print:hidden">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isLoading ? 'Export...' : 'Exporter PDF'}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rafraîchir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton fermer */}
        <div className="text-center mt-6 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
