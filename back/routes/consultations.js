const express = require('express');
const { body, validationResult } = require('express-validator');
const { Consultation, ConsultationMedicament, Patient } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Fonction pour générer le prochain numéro de consultation
const generateNextConsultationNumber = async () => {
  try {
    // Récupérer la dernière consultation pour obtenir le numéro le plus élevé
    const lastConsultation = await Consultation.findOne({
      order: [['numeroConsultation', 'DESC']]
    });

    if (!lastConsultation) {
      // Première consultation
      const currentYear = new Date().getFullYear();
      return `CONS-001-${currentYear}`;
    }

    // Extraire le numéro de la dernière consultation
    const match = lastConsultation.numeroConsultation.match(/CONS-(\d+)-(\d+)/);
    if (match) {
      const currentNumber = parseInt(match[1]);
      const year = match[2];
      const currentYear = new Date().getFullYear().toString();
      
      // Si c'est une nouvelle année, recommencer à 1
      if (year !== currentYear) {
        return `CONS-001-${currentYear}`;
      }
      
      // Incrémenter le numéro
      const nextNumber = currentNumber + 1;
      return `CONS-${nextNumber.toString().padStart(3, '0')}-${currentYear}`;
    }

    // Fallback si le format n'est pas reconnu
    const currentYear = new Date().getFullYear();
    return `CONS-001-${currentYear}`;
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de consultation:', error);
    // Fallback en cas d'erreur
    const currentYear = new Date().getFullYear();
    return `CONS-001-${currentYear}`;
  }
};

// Fonction pour vérifier si un numéro existe déjà et en générer un nouveau si nécessaire
const generateUniqueConsultationNumber = async () => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const numeroConsultation = await generateNextConsultationNumber();
    
    // Vérifier si ce numéro existe déjà
    const existingConsultation = await Consultation.findOne({
      where: { numeroConsultation }
    });
    
    if (!existingConsultation) {
      return numeroConsultation;
    }
    
    attempts++;
  }
  
  // En cas d'échec, générer un numéro avec timestamp
  const timestamp = Date.now();
  const currentYear = new Date().getFullYear();
  return `CONS-${timestamp}-${currentYear}`;
};

// GET /api/consultations - Récupérer toutes les consultations
router.get('/', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { numeroConsultation: { [Op.iLike]: `%${search}%` } },
        { medecinConsultant: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const consultations = await Consultation.findAndCountAll({
      where: whereClause,
      include: [{
        model: Patient,
        attributes: ['id', 'firstName', 'lastName']
      }, {
        model: ConsultationMedicament,
        as: 'medicaments'
      }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      consultations: consultations.rows,
      total: consultations.count,
      totalPages: Math.ceil(consultations.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des consultations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/consultations/next-number - Récupérer le prochain numéro de consultation
router.get('/next-number', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const nextNumber = await generateNextConsultationNumber();
    res.json({ nextNumber });
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de consultation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/consultations/:id - Récupérer une consultation par ID
router.get('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    // Vérifier que l'ID est un nombre
    if (isNaN(req.params.id)) {
      return res.status(400).json({ message: 'ID de consultation invalide' });
    }

    const consultation = await Consultation.findOne({
      where: { id: parseInt(req.params.id) },
      include: [{
        model: Patient,
        attributes: ['id', 'firstName', 'lastName']
      }, {
        model: ConsultationMedicament,
        as: 'medicaments'
      }]
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation non trouvée' });
    }

    res.json(consultation);
  } catch (error) {
    console.error('Erreur lors de la récupération de la consultation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/consultations/next-number - Récupérer le prochain numéro de consultation
router.get('/next-number', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const nextNumber = await generateNextConsultationNumber();
    res.json({ nextNumber });
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de consultation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/consultations - Créer une nouvelle consultation
router.post('/', protect, authorize('admin', 'pharmacien'), [
  body('patientId').isInt().withMessage('ID du patient invalide'),
  body('medecinConsultant').notEmpty().withMessage('Le médecin consultant est requis'),
  body('dateConsultation').isDate().withMessage('Date de consultation invalide'),
  body('diagnostic').optional().isString(),
  body('indication').optional().isString(),
  body('ordonnance').optional().isString(),
  body('notesPharmacien').optional().isString(),
  body('typeConsultation').optional().isIn(['courte', 'longue', 'renouvellement', 'urgence'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Générer automatiquement le numéro de consultation
    const numeroConsultation = await generateUniqueConsultationNumber();

    // Créer la consultation avec le numéro généré
    const consultationData = {
      ...req.body,
      numeroConsultation,
      statut: 'active' // Statut par défaut
    };

    const consultation = await Consultation.create(consultationData);
    
    // Récupérer la consultation avec les détails du patient
    const consultationComplete = await Consultation.findOne({
      where: { id: consultation.id },
      include: [{
        model: Patient,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    res.status(201).json(consultationComplete);
  } catch (error) {
    console.error('Erreur lors de la création de la consultation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/consultations/:id - Mettre à jour une consultation
router.put('/:id', protect, authorize('admin', 'pharmacien'), [
  body('medecinConsultant').optional().isString(),
  body('diagnostic').optional().isString(),
  body('indication').optional().isString(),
  body('ordonnance').optional().isString(),
  body('notesPharmacien').optional().isString(),
  body('statut').optional().isIn(['active', 'terminee', 'annulee', 'renouvellement'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation non trouvée' });
    }

    await consultation.update(req.body);
    
    // Récupérer la consultation mise à jour avec les détails du patient
    const consultationMiseAJour = await Consultation.findOne({
      where: { id: consultation.id },
      include: [{
        model: Patient,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    res.json(consultationMiseAJour);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la consultation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/consultations/:id - Supprimer une consultation
router.delete('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation non trouvée' });
    }

    await consultation.destroy();
    res.json({ message: 'Consultation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la consultation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/consultations/patient/:patientId - Récupérer toutes les consultations d'un patient
router.get('/patient/:patientId', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const consultations = await Consultation.findAll({
      where: { patientId: req.params.patientId },
      include: [{
        model: Patient,
        attributes: ['id', 'firstName', 'lastName']
      }, {
        model: ConsultationMedicament,
        as: 'medicaments'
      }],
      order: [['dateConsultation', 'DESC']]
    });

    res.json({
      consultations: consultations,
      total: consultations.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des consultations du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/consultations/:id/medicaments - Ajouter un médicament à une consultation
router.post('/:id/medicaments', protect, authorize('admin', 'pharmacien'), [
  body('nomMedicament').notEmpty().withMessage('Nom du médicament requis'),
  body('posologie').notEmpty().withMessage('Posologie requise'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('unite').notEmpty().withMessage('Unité requise')
], async (req, res) => {
  try {
    console.log('=== AJOUT MÉDICAMENT ===');
    console.log('ID consultation:', req.params.id);
    console.log('Données reçues:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) {
      console.log('Consultation non trouvée');
      return res.status(404).json({ message: 'Consultation non trouvée' });
    }

    console.log('Consultation trouvée:', consultation.id);
    const medicament = await ConsultationMedicament.create({
      consultationId: consultation.id,
      nomMedicament: req.body.nomMedicament,
      dciMedicament: req.body.dciMedicament || null,
      classeTherapeutique: req.body.classeTherapeutique || null,
      posologie: req.body.posologie,
      quantite: req.body.quantite,
      unite: req.body.unite,
      dateDebutPrise: req.body.dateDebutPrise || null,
      dateFinPrise: req.body.dateFinPrise || null,
      effetsIndesirablesSignales: req.body.effetsIndesirablesSignales || null,
      observance: req.body.observance || null,
      precaution: req.body.precaution || null
    });

    console.log('Médicament créé avec succès:', medicament.id);
    res.status(201).json(medicament);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/consultations/:id/medicaments/:medicamentId - Mettre à jour un médicament
router.put('/:id/medicaments/:medicamentId', protect, authorize('admin', 'pharmacien'), [
  body('posologie').optional().notEmpty().withMessage('Posologie requise'),
  body('quantite').optional().isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('unite').optional().notEmpty().withMessage('Unité requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicament = await ConsultationMedicament.findOne({
      where: {
        id: req.params.medicamentId,
        consultationId: req.params.id
      }
    });

    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }

    await medicament.update(req.body);
    res.json(medicament);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/consultations/:id/medicaments/:medicamentId - Supprimer un médicament
router.delete('/:id/medicaments/:medicamentId', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const medicament = await ConsultationMedicament.findOne({
      where: {
        id: req.params.medicamentId,
        consultationId: req.params.id
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

module.exports = {
  router,
  generateNextConsultationNumber,
  generateUniqueConsultationNumber
};
