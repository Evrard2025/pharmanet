import React from 'react';
import { useQuery } from 'react-query';
import { Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SurveillanceUrgente {
  id: number;
  dateProchaineAnalyse: string;
  priorite: 'basse' | 'moyenne' | 'haute';
  typeSurveillance: 'hepatique' | 'renale' | 'mixte' | 'autre';
  Patient: {
    nom: string;
    prenom: string;
    telephone?: string;
  };
  Medicament?: {
    nomCommercial: string;
    dci: string;
  };
}

const SurveillanceDashboard: React.FC = () => {
  // Récupérer les surveillances urgentes
  const { data: surveillancesUrgentes, isLoading } = useQuery<{ surveillances: SurveillanceUrgente[] }>(
    'surveillancesUrgentes',
    async () => {
      const response = await fetch('/api/surveillance-biologique/urgentes');
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return response.json();
    },
    {
      refetchInterval: 300000, // Rafraîchir toutes les 5 minutes
      refetchIntervalInBackground: true
    }
  );

  // Calculer le statut de la surveillance
  const getSurveillanceStatus = (dateProchaineAnalyse: string) => {
    const today = new Date();
    const nextDate = new Date(dateProchaineAnalyse);
    const daysUntilNext = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilNext < 0) return { status: 'en_retard', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
    if (daysUntilNext <= 3) return { status: 'urgent', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle };
    if (daysUntilNext <= 7) return { status: 'proche', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock };
    return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const surveillances = surveillancesUrgentes?.surveillances || [];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Surveillance Biologique - Rappels
            </h3>
            <p className="text-sm text-gray-600">
              Surveillances nécessitant une attention immédiate
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-900">
              {surveillances.length} surveillance{surveillances.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {surveillances.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Aucune surveillance urgente
            </h4>
            <p className="text-gray-600">
              Toutes les surveillances sont à jour
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {surveillances.map((surveillance) => {
              const status = getSurveillanceStatus(surveillance.dateProchaineAnalyse);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={surveillance.id}
                  className={`p-4 rounded-lg border ${status.bgColor} border-l-4 border-l-${status.status === 'en_retard' ? 'red' : status.status === 'urgent' ? 'orange' : status.status === 'proche' ? 'yellow' : 'green'}-500`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        <h4 className="font-medium text-gray-900">
                          {surveillance.Patient.nom} {surveillance.Patient.prenom}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(surveillance.priorite)}`}>
                          {getPriorityText(surveillance.priorite)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {getTypeText(surveillance.typeSurveillance)}
                          </span>
                        </div>
                        
                        {surveillance.Medicament && (
                          <div>
                            <span className="text-gray-600">Médicament:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {surveillance.Medicament.nomCommercial}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-gray-600">Prochaine analyse:</span>
                          <div className="flex items-center mt-1">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className={`font-medium ${status.color}`}>
                              {format(new Date(surveillance.dateProchaineAnalyse), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {surveillance.Patient.telephone && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-600">Contact:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {surveillance.Patient.telephone}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Voir détails
                      </button>
                    </div>
                  </div>
                  
                  {/* Indicateur de statut */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.status === 'en_retard' && '⚠️ En retard'}
                        {status.status === 'urgent' && '🚨 Urgent (≤ 3 jours)'}
                        {status.status === 'proche' && '⏰ Proche (≤ 7 jours)'}
                        {status.status === 'normal' && '✅ Normal'}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">
                          Planifier
                        </button>
                        <button className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200">
                          Marquer comme fait
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer avec actions */}
      {surveillances.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Actions recommandées:</span>
              <span className="ml-2">
                Contacter les patients, planifier les analyses, mettre à jour les statuts
              </span>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Gérer toutes les surveillances
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveillanceDashboard;
