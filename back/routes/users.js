const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/users
// @desc    Récupérer tous les utilisateurs (Admin)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search, 
      loyaltyLevel,
      isActive 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtres
    if (role) whereClause.role = role;
    if (loyaltyLevel) whereClause.loyaltyLevel = loyaltyLevel;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/users/:id
// @desc    Récupérer un utilisateur par ID (Admin)
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur (Admin)
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide'),
  body('role').optional().isIn(['client', 'admin', 'pharmacien']).withMessage('Rôle invalide'),
  body('loyaltyPoints').optional().isInt({ min: 0 }).withMessage('Points fidélité invalides'),
  body('loyaltyLevel').optional().isIn(['bronze', 'argent', 'or', 'platine']).withMessage('Niveau fidélité invalide'),
  body('isActive').optional().isBoolean().withMessage('Statut actif invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    await user.update(req.body);

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyLevel: user.loyaltyLevel,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Désactiver un utilisateur (Admin)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher la désactivation de son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    // Soft delete
    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Obtenir les statistiques des utilisateurs (Admin)
// @access  Private (Admin)
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    // Statistiques par rôle
    const roleStats = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['role'],
      raw: true
    });

    // Statistiques par niveau fidélité
    const loyaltyStats = await User.findAll({
      attributes: [
        'loyaltyLevel',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
        [User.sequelize.fn('AVG', User.sequelize.col('loyaltyPoints')), 'avgPoints']
      ],
      where: { isActive: true, role: 'client' },
      group: ['loyaltyLevel'],
      raw: true
    });

    // Statistiques globales
    const totalUsers = await User.count({ where: { isActive: true } });
    const totalClients = await User.count({ where: { isActive: true, role: 'client' } });
    const totalPoints = await User.sum('loyaltyPoints', { where: { isActive: true, role: 'client' } });
    const avgPoints = totalClients > 0 ? Math.round(totalPoints / totalClients) : 0;

    // Nouveaux utilisateurs ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.count({
      where: {
        isActive: true,
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalClients,
        totalPoints,
        avgPoints,
        newUsersThisMonth,
        roleStats,
        loyaltyStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 