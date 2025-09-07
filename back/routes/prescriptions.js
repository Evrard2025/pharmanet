const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Prescription, PrescriptionMedicament, Patient, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/prescriptions - Récupérer toutes les prescriptions
router.get('/', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, statut, patientId, sortBy = 'datePrescription', sortOrder = 'DESC' } = req.query;
    
    const whereClause = { isActive: true };
    if (search) {
      whereClause[Op.or] = [
        { numeroPrescription: { [Op.iLike]: `%${search}%` } },
        { medecinPrescripteur: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (statut) {
      whereClause.statut = statut;
    }
    if (patientId) {
      whereClause.patientId = patientId;
    }

    const prescriptions = await Prescription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      prescriptions: prescriptions.rows,
      total: prescriptions.count,
      totalPages: Math.ceil(prescriptions.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des prescriptions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/prescriptions/:id - Récupérer une prescription par ID
router.get('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        {
          model: Patient,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
            }
          ]
        },
        {
          model: PrescriptionMedicament,
          as: 'medicaments'
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    // Calculer la durée et vérifier si expirée
    const duree = prescription.getDuree();
    const isExpired = prescription.isExpired();
    const canBeRenewed = prescription.canBeRenewed();

    res.json({
      ...prescription.toJSON(),
      duree,
      isExpired,
      canBeRenewed
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la prescription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/prescriptions - Créer une nouvelle prescription
router.post('/', protect, authorize('admin', 'pharmacien'), [
  body('patientId').isInt().withMessage('ID patient requis'),
  body('numeroPrescription').notEmpty().withMessage('Numéro de prescription requis'),
  body('medecinPrescripteur').notEmpty().withMessage('Médecin prescripteur requis'),
  body('datePrescription').isDate().withMessage('Date de prescription invalide'),
  body('typePrescription').isIn(['courte', 'longue', 'renouvellement', 'urgence']).withMessage('Type de prescription invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Vérifier si le patient existe
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier si le numéro de prescription est unique
    const existingPrescription = await Prescription.findOne({ 
      where: { numeroPrescription: req.body.numeroPrescription } 
    });
    if (existingPrescription) {
      return res.status(400).json({ message: 'Ce numéro de prescription existe déjà' });
    }

    const prescription = await Prescription.create(req.body);
    
    const prescriptionWithDetails = await Prescription.findByPk(prescription.id, {
      include: [
        {
          model: Patient,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    res.status(201).json(prescriptionWithDetails);
  } catch (error) {
    console.error('Erreur lors de la création de la prescription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/prescriptions/:id - Mettre à jour une prescription
router.put('/:id', protect, authorize('admin', 'pharmacien'), [
  body('datePrescription').optional().isDate().withMessage('Date de prescription invalide'),
  body('typePrescription').optional().isIn(['courte', 'longue', 'renouvellement', 'urgence']).withMessage('Type de prescription invalide'),
  body('statut').optional().isIn(['active', 'terminee', 'annulee', 'renouvellement']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    await prescription.update(req.body);
    
    const updatedPrescription = await Prescription.findByPk(prescription.id, {
      include: [
        {
          model: Patient,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la prescription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/prescriptions/:id - Désactiver une prescription
router.delete('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    await prescription.update({ isActive: false });
    res.json({ message: 'Prescription désactivée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la désactivation de la prescription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/prescriptions/:id/renouveler - Renouveler une prescription
router.post('/:id/renouveler', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    if (!prescription.canBeRenewed()) {
      return res.status(400).json({ message: 'Cette prescription ne peut pas être renouvelée' });
    }

    await prescription.renew();
    res.json({ message: 'Prescription renouvelée avec succès', prescription });
  } catch (error) {
    console.error('Erreur lors du renouvellement de la prescription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/prescriptions/:id/medicaments - Ajouter un médicament à la prescription
router.post('/:id/medicaments', protect, authorize('admin', 'pharmacien'), [
  body('nom').notEmpty().withMessage('Nom du médicament requis'),
  body('posologie').notEmpty().withMessage('Posologie requise'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('unite').notEmpty().withMessage('Unité requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription non trouvée' });
    }

    const medicament = await PrescriptionMedicament.create({
      prescriptionId: prescription.id,
      nom: req.body.nom,
      description: req.body.description || null,
      categorie: req.body.categorie || null,
      marque: req.body.marque || null,
      posologie: req.body.posologie,
      quantite: req.body.quantite,
      unite: req.body.unite,
      dateDebutPrise: req.body.dateDebutPrise || null,
      dateFinPrise: req.body.dateFinPrise || null,
      precaution: req.body.precaution || null,
      duree: req.body.duree || null
    });

    res.status(201).json(medicament);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/prescriptions/:id/medicaments/:medicamentId - Mettre à jour un médicament
router.put('/:id/medicaments/:medicamentId', protect, authorize('admin', 'pharmacien'), [
  body('posologie').optional().notEmpty().withMessage('Posologie requise'),
  body('quantite').optional().isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('statut').optional().isIn(['en_cours', 'termine', 'arrete']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicament = await PrescriptionMedicament.findOne({
      where: { 
        id: req.params.medicamentId, 
        prescriptionId: req.params.id 
      }
    });

    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }

    await medicament.update(req.body);
    
    const updatedMedicament = await PrescriptionMedicament.findByPk(medicament.id);
    res.json(updatedMedicament);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/prescriptions/:id/medicaments/:medicamentId - Supprimer un médicament
router.delete('/:id/medicaments/:medicamentId', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const medicament = await PrescriptionMedicament.findOne({
      where: { 
        id: req.params.medicamentId, 
        prescriptionId: req.params.id 
      }
    });

    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }

    await medicament.destroy();
    res.json({ message: 'Médicament supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/prescriptions/expirees - Récupérer les prescriptions expirées
router.get('/expirees', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: {
        isActive: true,
        dateFin: {
          [Op.lt]: new Date()
        }
      },
      include: [
        {
          model: Patient,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [['dateFin', 'ASC']]
    });

    res.json(prescriptions);
  } catch (error) {
    console.error('Erreur lors de la récupération des prescriptions expirées:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 