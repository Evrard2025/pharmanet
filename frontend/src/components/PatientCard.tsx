import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Download, Printer, QrCode, User, Calendar, Phone, MapPin, Heart, Activity, Pill, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface PatientCardProps {
  patientId: number;
  onClose: () => void;
}

interface PatientData {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  age: number;
  sexe: string;
  poids: number;
  taille: number;
  groupeSanguin: string;
  adresse: string;
  telephone: string;
  traitementsChroniques: string[];
  traitementsPonctuels: string[];
  sousContraceptif: boolean;
  assurance: string;
  structureEmission: string;
  serviceEmission: string;
  medecinPrescripteur: string;
  consultations: number;
  derniereConsultation: string | null;
  // Ajouter les consultations détaillées
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
  }>;
}

interface CardData {
  patient: PatientData;
  qrCode: string;
  generatedAt: string;
  cardNumber: string;
  dataHash: string; // Hash pour vérifier les modifications
}

const PatientCard: React.FC<PatientCardProps> = ({ patientId, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
      const response = await api.get(`/api/patients/${patientId}/card/pdf`);
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

        {/* Contenu de la carte */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:gap-4">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identité du patient */}
            <div className="bg-blue-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Identité</h3>
              </div>
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
                  <span className="font-medium">Âge:</span> {patient.age} ans
                </div>
                <div>
                  <span className="font-medium">Sexe:</span> {patient.sexe}
                </div>
                <div>
                  <span className="font-medium">Groupe sanguin:</span> {patient.groupeSanguin}
                </div>
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

            {/* Traitements */}
            <div className="bg-orange-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <Pill className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">Traitements</h3>
              </div>
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

            {/* Informations médicales */}
            <div className="bg-red-50 rounded-lg p-4 print:bg-white print:border">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-800">Informations médicales</h3>
              </div>
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
                <div>
                  <span className="font-medium">Consultations:</span> {patient.consultations}
                </div>
                {patient.derniereConsultation && (
                  <div>
                    <span className="font-medium">Dernière consultation:</span> {new Date(patient.derniereConsultation).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>

            {/* Historique des consultations */}
            {patient.consultationsDetaillees && patient.consultationsDetaillees.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4 print:bg-white print:border">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-indigo-800">Historique des consultations</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto print:max-h-none">
                  {patient.consultationsDetaillees.map((consultation: any, index: number) => (
                    <div key={consultation.id} className="bg-white rounded-lg p-3 border border-indigo-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-indigo-700">
                          #{consultation.numero}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(consultation.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Médecin:</span> {consultation.medecin}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {consultation.type}
                        </div>
                        {consultation.diagnostic && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Diagnostic:</span> {consultation.diagnostic}
                          </div>
                        )}
                        {consultation.indication && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Indication:</span> {consultation.indication}
                          </div>
                        )}
                        {consultation.ordonnance && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Ordonnance:</span> {consultation.ordonnance}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          consultation.statut === 'active' ? 'bg-green-100 text-green-800' :
                          consultation.statut === 'terminee' ? 'bg-blue-100 text-blue-800' :
                          consultation.statut === 'annulee' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consultation.statut}
                        </span>
                      </div>
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
