const express = require('express');
const router = express.Router();
const { Prescription, Medicament, Patient } = require('../models');

// Récupérer les rappels d'un patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Pour l'instant, on génère des rappels basés sur les prescriptions actives
    // Dans une vraie application, vous auriez une table Rappels dédiée
    const prescriptions = await Prescription.findAll({
      where: { 
        patientId,
        statut: 'active'
      },
      include: [
        {
          model: Medicament,
          as: 'medicament',
          attributes: ['id', 'nom', 'dci', 'forme']
        }
      ]
    });

    // Générer des rappels fictifs basés sur les prescriptions
    const reminders = prescriptions.map((prescription, index) => ({
      id: `reminder_${prescription.id}`,
      patientId: prescription.patientId,
      medicamentId: prescription.medicamentId,
      heure: '08:00', // Heure par défaut
      jours: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      actif: true,
      medicament: prescription.medicament
    }));

    res.json(reminders);
  } catch (error) {
    console.error('Erreur lors de la récupération des rappels:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouveau rappel
router.post('/', async (req, res) => {
  try {
    const { patientId, medicamentId, heure, jours, actif = true } = req.body;

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier que le médicament existe
    const medicament = await Medicament.findByPk(medicamentId);
    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }

    // Pour l'instant, on simule la création d'un rappel
    // Dans une vraie application, vous sauvegarderiez en base
    const reminder = {
      id: `reminder_${Date.now()}`,
      patientId,
      medicamentId,
      heure,
      jours,
      actif,
      medicament: {
        id: medicament.id,
        nom: medicament.nom,
        dci: medicament.dci,
        forme: medicament.forme
      }
    };

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Erreur lors de la création du rappel:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un rappel
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, heure, jours } = req.body;

    // Pour l'instant, on simule la mise à jour
    // Dans une vraie application, vous mettriez à jour en base
    const updatedReminder = {
      id,
      actif,
      heure: heure || '08:00',
      jours: jours || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    };

    res.json(updatedReminder);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rappel:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un rappel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Pour l'instant, on simule la suppression
    // Dans une vraie application, vous supprimeriez de la base
    res.json({ message: 'Rappel supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du rappel:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
