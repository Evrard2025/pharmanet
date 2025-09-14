const express = require('express');
const router = express.Router();
const { Prescription, Medicament, Patient, Consultation, SurveillanceBiologique } = require('../models');

// Récupérer l'historique médical d'un patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Récupérer les consultations
    const consultations = await Consultation.findAll({
      where: { patientId },
      order: [['dateConsultation', 'DESC']]
    });

    // Récupérer les prescriptions
    const prescriptions = await Prescription.findAll({
      where: { patientId },
      include: [
        {
          model: Medicament,
          as: 'medicament',
          attributes: ['id', 'nom', 'dci', 'forme']
        }
      ],
      order: [['dateDebut', 'DESC']]
    });

    // Récupérer les surveillances biologiques
    const surveillances = await SurveillanceBiologique.findAll({
      where: { patientId },
      order: [['dateSurveillance', 'DESC']]
    });

    // Construire l'historique médical
    const medicalHistory = [];

    // Ajouter les consultations
    consultations.forEach(consultation => {
      medicalHistory.push({
        id: `consultation_${consultation.id}`,
        type: 'consultation',
        date: consultation.dateConsultation,
        title: `Consultation du ${new Date(consultation.dateConsultation).toLocaleDateString('fr-FR')}`,
        description: consultation.observations || 'Consultation médicale',
        doctor: consultation.medecin || 'Dr. Médecin',
        status: 'completed'
      });
    });

    // Ajouter les prescriptions
    prescriptions.forEach(prescription => {
      medicalHistory.push({
        id: `prescription_${prescription.id}`,
        type: 'prescription',
        date: prescription.dateDebut,
        title: `Prescription - ${prescription.medicament?.nom || 'Médicament'}`,
        description: prescription.posologie || 'Prescription médicamenteuse',
        medicament: prescription.medicament,
        status: prescription.statut === 'active' ? 'completed' : prescription.statut
      });
    });

    // Ajouter les surveillances biologiques
    surveillances.forEach(surveillance => {
      const values = [];
      
      // Ajouter les paramètres mesurés
      if (surveillance.creatinine !== null) {
        values.push({
          parameter: 'Créatinine',
          value: surveillance.creatinine.toString(),
          unit: 'mg/dL',
          normal: surveillance.creatinine >= 0.6 && surveillance.creatinine <= 1.2
        });
      }
      
      if (surveillance.uree !== null) {
        values.push({
          parameter: 'Urée',
          value: surveillance.uree.toString(),
          unit: 'mg/dL',
          normal: surveillance.uree >= 15 && surveillance.uree <= 50
        });
      }
      
      if (surveillance.alt !== null) {
        values.push({
          parameter: 'ALT',
          value: surveillance.alt.toString(),
          unit: 'U/L',
          normal: surveillance.alt >= 7 && surveillance.alt <= 56
        });
      }
      
      if (surveillance.ast !== null) {
        values.push({
          parameter: 'AST',
          value: surveillance.ast.toString(),
          unit: 'U/L',
          normal: surveillance.ast >= 10 && surveillance.ast <= 40
        });
      }

      medicalHistory.push({
        id: `surveillance_${surveillance.id}`,
        type: 'surveillance',
        date: surveillance.dateSurveillance,
        title: `Surveillance biologique du ${new Date(surveillance.dateSurveillance).toLocaleDateString('fr-FR')}`,
        description: 'Contrôle des paramètres hépatiques et rénaux',
        values: values,
        status: 'completed'
      });
    });

    // Trier par date décroissante
    medicalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(medicalHistory);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique médical:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les statistiques d'un patient
router.get('/patient/:patientId/stats', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Compter les différents types d'événements
    const [consultationsCount, prescriptionsCount, surveillancesCount] = await Promise.all([
      Consultation.count({ where: { patientId } }),
      Prescription.count({ where: { patientId } }),
      SurveillanceBiologique.count({ where: { patientId } })
    ]);

    res.json({
      consultations: consultationsCount,
      prescriptions: prescriptionsCount,
      surveillances: surveillancesCount,
      traitements: prescriptionsCount // Pour l'instant, on considère les prescriptions comme des traitements
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
