const express = require('express');
const router = express.Router();
const { Prescription, PrescriptionMedicament, Medicament, Patient } = require('../models');

// Récupérer les prescriptions d'un patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Récupérer les prescriptions du patient avec les médicaments associés
    const prescriptions = await Prescription.findAll({
      where: { patientId },
      include: [
        {
          model: PrescriptionMedicament,
          as: 'medicaments',
          include: [
            {
              model: Medicament,
              as: 'medicament',
              attributes: ['id', 'nom', 'dci', 'forme', 'dosage']
            }
          ]
        }
      ],
      order: [['datePrescription', 'DESC']]
    });

    res.json(prescriptions);
  } catch (error) {
    console.error('Erreur lors de la récupération des prescriptions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer une prescription spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByPk(id, {
      include: [
        {
          model: PrescriptionMedicament,
          as: 'medicaments',
          include: [
            {
              model: Medicament,
              as: 'medicament',
              attributes: ['id', 'nom', 'dci', 'forme', 'dosage']
            }
          ]
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Erreur lors de la récupération de la prescription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une prescription
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const prescription = await Prescription.findByPk(id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    await prescription.update({ statut });
    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
