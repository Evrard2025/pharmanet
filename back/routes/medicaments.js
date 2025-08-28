const express = require('express');
const { body, validationResult } = require('express-validator');
const { Medicament } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/medicaments - Récupérer tous les médicaments avec filtres
router.get('/', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      classeTherapeutique,
      statut = 'actif',
      sortBy = 'nomCommercial',
      sortOrder = 'ASC'
    } = req.query;
    
    const whereClause = { isActive: true };
    
    // Filtre par statut
    if (statut && statut !== 'tous') {
      whereClause.statut = statut;
    }
    
    // Filtre par classe thérapeutique
    if (classeTherapeutique) {
      whereClause.classeTherapeutique = classeTherapeutique;
    }
    
    // Recherche textuelle
    if (search) {
      whereClause[Op.or] = [
        { nomCommercial: { [Op.iLike]: `%${search}%` } },
        { dci: { [Op.iLike]: `%${search}%` } },
        { classeTherapeutique: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const medicaments = await Medicament.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // Récupérer toutes les classes thérapeutiques pour les filtres
    const classesTherapeutiques = await Medicament.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('classeTherapeutique')), 'classeTherapeutique']],
      where: { isActive: true },
      raw: true
    });

    res.json({
      medicaments: medicaments.rows,
      total: medicaments.count,
      totalPages: Math.ceil(medicaments.count / limit),
      currentPage: parseInt(page),
      classesTherapeutiques: classesTherapeutiques.map(c => c.classeTherapeutique)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des médicaments:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/medicaments/search - Recherche rapide de médicaments
router.get('/search', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ medicaments: [] });
    }

    const medicaments = await Medicament.findAll({
      where: {
        isActive: true,
        statut: 'actif',
        [Op.or]: [
          { nomCommercial: { [Op.iLike]: `%${q}%` } },
          { dci: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'nomCommercial', 'dci', 'classeTherapeutique', 'formePharmaceutique', 'dosage'],
      limit: parseInt(limit),
      order: [['nomCommercial', 'ASC']]
    });

    res.json({ medicaments });
  } catch (error) {
    console.error('Erreur lors de la recherche de médicaments:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/medicaments/:id - Récupérer un médicament par ID
router.get('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const medicament = await Medicament.findByPk(req.params.id);
    
    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }

    res.json(medicament);
  } catch (error) {
    console.error('Erreur lors de la récupération du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/medicaments - Créer un nouveau médicament
router.post('/', protect, authorize('admin'), [
  body('nomCommercial').notEmpty().withMessage('Le nom commercial est requis'),
  body('dci').notEmpty().withMessage('La DCI est requise'),
  body('classeTherapeutique').notEmpty().withMessage('La classe thérapeutique est requise'),
  body('formePharmaceutique').optional().isString(),
  body('dosage').optional().isString(),
  body('laboratoire').optional().isString(),
  body('indication').optional().isString(),
  body('contreIndication').optional().isString(),
  body('effetsSecondaires').optional().isString(),
  body('posologie').optional().isString(),
  body('interactions').optional().isString(),
  body('surveillanceHepatique').optional().isBoolean(),
  body('surveillanceRenale').optional().isBoolean(),
  body('frequenceSurveillance').optional().isInt({ min: 1, max: 12 }),
  body('parametresSurveillance').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicament = await Medicament.create(req.body);
    
    res.status(201).json(medicament);
  } catch (error) {
    console.error('Erreur lors de la création du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/medicaments/:id - Mettre à jour un médicament
router.put('/:id', protect, authorize('admin'), [
  body('nomCommercial').optional().isString(),
  body('dci').optional().isString(),
  body('classeTherapeutique').optional().isString(),
  body('formePharmaceutique').optional().isString(),
  body('dosage').optional().isString(),
  body('laboratoire').optional().isString(),
  body('indication').optional().isString(),
  body('contreIndication').optional().isString(),
  body('effetsSecondaires').optional().isString(),
  body('posologie').optional().isString(),
  body('interactions').optional().isString(),
  body('surveillanceHepatique').optional().isBoolean(),
  body('surveillanceRenale').optional().isBoolean(),
  body('frequenceSurveillance').optional().isInt({ min: 1, max: 12 }),
  body('parametresSurveillance').optional().isArray(),
  body('statut').optional().isIn(['actif', 'inactif', 'retire'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicament = await Medicament.findByPk(req.params.id);
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

// DELETE /api/medicaments/:id - Supprimer un médicament (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const medicament = await Medicament.findByPk(req.params.id);
    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }

    // Soft delete
    await medicament.update({ isActive: false, statut: 'retire' });
    
    res.json({ message: 'Médicament supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du médicament:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
