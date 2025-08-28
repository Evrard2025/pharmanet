const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { SurveillanceBiologique, Patient, Medicament } = require('../models');

const router = express.Router();

// GET /api/surveillance-biologique - Récupérer toutes les surveillances
router.get('/', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, statut, priorite } = req.query;
    
    const whereClause = {};
    if (type && type !== 'all') whereClause.typeSurveillance = type;
    if (statut && statut !== 'all') whereClause.statut = statut;
    if (priorite && priorite !== 'all') whereClause.priorite = priorite;

    const offset = (page - 1) * limit;
    
    const surveillances = await SurveillanceBiologique.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance']
        },
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci']
        }
      ],
      order: [['dateProchaineAnalyse', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      surveillances: surveillances.rows,
      total: surveillances.count,
      totalPages: Math.ceil(surveillances.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des surveillances:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/surveillance-biologique/search - Recherche de surveillances
router.get('/search', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { q, type, statut } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

    const whereClause = {
      [require('sequelize').Op.or]: [
        { '$Patient.nom$': { [require('sequelize').Op.iLike]: `%${q}%` } },
        { '$Patient.prenom$': { [require('sequelize').Op.iLike]: `%${q}%` } },
        { '$Medicament.nomCommercial$': { [require('sequelize').Op.iLike]: `%${q}%` } },
        { '$Medicament.dci$': { [require('sequelize').Op.iLike]: `%${q}%` } }
      ]
    };

    if (type) whereClause.typeSurveillance = type;
    if (statut) whereClause.statut = statut;

    const surveillances = await SurveillanceBiologique.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance']
        },
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci']
        }
      ],
      order: [['dateProchaineAnalyse', 'ASC']],
      limit: 20
    });

    res.json({ surveillances });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/surveillance-biologique/:id - Récupérer une surveillance par ID
router.get('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const surveillance = await SurveillanceBiologique.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance', 'telephone', 'email']
        },
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci', 'classeTherapeutique', 'surveillanceHepatique', 'surveillanceRenale']
        }
      ]
    });

    if (!surveillance) {
      return res.status(404).json({ message: 'Surveillance non trouvée' });
    }

    res.json(surveillance);
  } catch (error) {
    console.error('Erreur lors de la récupération de la surveillance:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// POST /api/surveillance-biologique - Créer une nouvelle surveillance
router.post('/', protect, authorize('admin', 'pharmacien'), [
  body('patientId').isInt().withMessage('ID patient invalide'),
  body('medicamentId').optional().isInt().withMessage('ID médicament invalide'),
  body('typeSurveillance').isIn(['hepatique', 'renale', 'mixte', 'autre']).withMessage('Type de surveillance invalide'),
  body('parametres').isArray().withMessage('Paramètres requis'),
  body('frequenceMois').isInt({ min: 1, max: 12 }).withMessage('Fréquence invalide (1-12 mois)'),
  body('dateDebutSurveillance').isDate().withMessage('Date de début invalide'),
  body('dateProchaineAnalyse').isDate().withMessage('Date prochaine analyse invalide'),
  body('priorite').isIn(['basse', 'moyenne', 'haute']).withMessage('Priorité invalide'),
  body('notes').optional().isString().withMessage('Notes invalides'),
  body('laboratoire').optional().isString().withMessage('Laboratoire invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    // Vérifier que le patient existe
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier que le médicament existe si fourni
    if (req.body.medicamentId) {
      const medicament = await Medicament.findByPk(req.body.medicamentId);
      if (!medicament) {
        return res.status(404).json({ message: 'Médicament non trouvé' });
      }
    }

    const surveillance = await SurveillanceBiologique.create({
      ...req.body,
      statut: 'en_cours'
    });

    // Récupérer la surveillance avec les relations
    const surveillanceComplete = await SurveillanceBiologique.findByPk(surveillance.id, {
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance']
        },
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci']
        }
      ]
    });

    res.status(201).json(surveillanceComplete);
  } catch (error) {
    console.error('Erreur lors de la création de la surveillance:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// PUT /api/surveillance-biologique/:id - Mettre à jour une surveillance
router.put('/:id', protect, authorize('admin', 'pharmacien'), [
  body('medicamentId').optional().isInt().withMessage('ID médicament invalide'),
  body('typeSurveillance').optional().isIn(['hepatique', 'renale', 'mixte', 'autre']).withMessage('Type de surveillance invalide'),
  body('parametres').optional().isArray().withMessage('Paramètres invalides'),
  body('frequenceMois').optional().isInt({ min: 1, max: 12 }).withMessage('Fréquence invalide (1-12 mois)'),
  body('dateDebutSurveillance').optional().isDate().withMessage('Date de début invalide'),
  body('dateProchaineAnalyse').optional().isDate().withMessage('Date prochaine analyse invalide'),
  body('dateDerniereAnalyse').optional().isDate().withMessage('Date dernière analyse invalide'),
  body('resultats').optional().isString().withMessage('Résultats invalides'),
  body('statut').optional().isIn(['en_cours', 'terminee', 'en_retard', 'annulee']).withMessage('Statut invalide'),
  body('priorite').optional().isIn(['basse', 'moyenne', 'haute']).withMessage('Priorité invalide'),
  body('notes').optional().isString().withMessage('Notes invalides'),
  body('laboratoire').optional().isString().withMessage('Laboratoire invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const surveillance = await SurveillanceBiologique.findByPk(req.params.id);
    if (!surveillance) {
      return res.status(404).json({ message: 'Surveillance non trouvée' });
    }

    // Vérifier que le médicament existe si fourni
    if (req.body.medicamentId) {
      const medicament = await Medicament.findByPk(req.body.medicamentId);
      if (!medicament) {
        return res.status(404).json({ message: 'Médicament non trouvé' });
      }
    }

    await surveillance.update(req.body);

    // Récupérer la surveillance mise à jour avec les relations
    const surveillanceMiseAJour = await SurveillanceBiologique.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance']
        },
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci']
        }
      ]
    });

    res.json(surveillanceMiseAJour);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la surveillance:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// DELETE /api/surveillance-biologique/:id - Supprimer une surveillance
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const surveillance = await SurveillanceBiologique.findByPk(req.params.id);
    if (!surveillance) {
      return res.status(404).json({ message: 'Surveillance non trouvée' });
    }

    await surveillance.destroy();
    res.json({ message: 'Surveillance supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la surveillance:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/surveillance-biologique/patient/:patientId - Récupérer les surveillances d'un patient
router.get('/patient/:patientId', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const surveillances = await SurveillanceBiologique.findAll({
      where: { patientId: req.params.patientId },
      include: [
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci', 'classeTherapeutique']
        }
      ],
      order: [['dateProchaineAnalyse', 'ASC']]
    });

    res.json({ surveillances });
  } catch (error) {
    console.error('Erreur lors de la récupération des surveillances du patient:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/surveillance-biologique/medicament/:medicamentId - Récupérer les surveillances d'un médicament
router.get('/medicament/:medicamentId', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const surveillances = await SurveillanceBiologique.findAll({
      where: { medicamentId: req.params.medicamentId },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance']
        }
      ],
      order: [['dateProchaineAnalyse', 'ASC']]
    });

    res.json({ surveillances });
  } catch (error) {
    console.error('Erreur lors de la récupération des surveillances du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/surveillance-biologique/urgentes - Récupérer les surveillances urgentes
router.get('/urgentes', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const surveillances = await SurveillanceBiologique.findAll({
      where: {
        dateProchaineAnalyse: {
          [require('sequelize').Op.lte]: nextWeek
        },
        statut: {
          [require('sequelize').Op.in]: ['en_cours', 'en_retard']
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'nom', 'prenom', 'dateNaissance', 'telephone']
        },
        {
          model: Medicament,
          as: 'Medicament',
          attributes: ['id', 'nomCommercial', 'dci']
        }
      ],
      order: [['dateProchaineAnalyse', 'ASC']]
    });

    res.json({ surveillances });
  } catch (error) {
    console.error('Erreur lors de la récupération des surveillances urgentes:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

module.exports = router;
