import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Bell, 
  CheckCircle,
  AlertCircle,
  Pill,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Reminder {
  id: number;
  patientId: number;
  medicamentId: number;
  heure: string;
  jours: string[];
  actif: boolean;
  medicament: {
    nom: string;
    dci: string;
    forme: string;
  };
}

const Reminders: React.FC = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Récupérer les rappels du patient
  const { data: reminders, isLoading, error, refetch } = useQuery(
    ['reminders', user?.id],
    async () => {
      const response = await api.get(`/api/reminders/patient/${user?.id}`);
      return response.data;
    },
    {
      enabled: !!user?.id,
    }
  );

  const getDayNames = (days: string[]) => {
    const dayMap: { [key: string]: string } = {
      'monday': 'Lun',
      'tuesday': 'Mar',
      'wednesday': 'Mer',
      'thursday': 'Jeu',
      'friday': 'Ven',
      'saturday': 'Sam',
      'sunday': 'Dim'
    };
    return days.map(day => dayMap[day] || day).join(', ');
  };

  const getNextReminder = (reminder: Reminder) => {
    const now = new Date();
    const today = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const reminderHour = parseInt(reminder.heure.split(':')[0]);
    const reminderMinute = parseInt(reminder.heure.split(':')[1]);
    
    const dayMap: { [key: string]: number } = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };
    
    const reminderDays = reminder.jours.map(day => dayMap[day]).sort();
    
    // Vérifier si c'est aujourd'hui et que l'heure n'est pas encore passée
    if (reminderDays.includes(today)) {
      if (reminderHour > currentHour || (reminderHour === currentHour && reminderMinute > currentMinute)) {
        return `Aujourd'hui à ${reminder.heure}`;
      }
    }
    
    // Trouver le prochain jour
    for (let i = 1; i <= 7; i++) {
      const nextDay = (today + i) % 7;
      if (reminderDays.includes(nextDay)) {
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return `${dayNames[nextDay]} à ${reminder.heure}`;
      }
    }
    
    return 'Aucun rappel programmé';
  };

  const toggleReminder = async (reminderId: number, actif: boolean) => {
    try {
      await api.patch(`/api/reminders/${reminderId}`, { actif: !actif });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rappel:', error);
    }
  };

  const deleteReminder = async (reminderId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?')) {
      try {
        await api.delete(`/api/reminders/${reminderId}`);
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression du rappel:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos rappels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger vos rappels.</p>
          <Link to="/" className="btn bg-primary-600 text-white">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="w-8 h-8 mr-3 text-primary-600" />
                Mes Rappels
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez vos rappels de prise de médicaments
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn bg-primary-600 text-white hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un rappel
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total des rappels</p>
                <p className="text-2xl font-bold text-gray-900">{reminders?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Rappels actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders?.filter((r: Reminder) => r.actif).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Rappels inactifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders?.filter((r: Reminder) => !r.actif).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des rappels */}
        {reminders?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun rappel configuré
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre premier rappel pour ne jamais oublier de prendre vos médicaments.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn bg-primary-600 text-white hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un rappel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders?.map((reminder: Reminder) => (
              <div key={reminder.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${reminder.actif ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {reminder.medicament.nom}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {reminder.medicament.dci} - {reminder.medicament.forme}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingReminder(reminder)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Heure</p>
                      <p className="text-sm font-medium text-gray-900">{reminder.heure}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Jours</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getDayNames(reminder.jours)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Prochain rappel</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getNextReminder(reminder)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      reminder.actif 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {reminder.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleReminder(reminder.id, reminder.actif)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      reminder.actif
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {reminder.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message d'information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Comment fonctionnent les rappels ?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Les rappels vous aideront à ne jamais oublier de prendre vos médicaments. 
                  Vous recevrez une notification à l'heure programmée pour chaque jour sélectionné.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
