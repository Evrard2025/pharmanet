const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = authorize('admin');

// GET /api/admin/users - Récupérer tous les utilisateurs avec pagination et filtres
router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const offset = (page - 1) * limit;
    
    // Construire les conditions de recherche
    const whereClause = {};
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    // Récupérer les utilisateurs avec pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone', 'role', 
        'loyaltyPoints', 'loyaltyLevel', 'address', 'isActive', 
        'createdAt', 'lastLogin'
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: count,
        usersPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/admin/users/:id - Récupérer un utilisateur par ID
router.get('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone', 'role', 
        'loyaltyPoints', 'loyaltyLevel', 'address', 'isActive', 
        'createdAt', 'lastLogin'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de l\'utilisateur'
    });
  }
});

// POST /api/admin/users - Créer un nouvel utilisateur
router.post('/', protect, requireAdmin, [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('phone').notEmpty().withMessage('Le téléphone est requis'),
  body('role').isIn(['client', 'pharmacien', 'admin']).withMessage('Rôle invalide'),
  body('address').optional().isString().withMessage('Adresse invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, role, address } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      address,
      isActive: true,
      loyaltyPoints: role === 'client' ? 0 : undefined,
      loyaltyLevel: role === 'client' ? 'bronze' : undefined
    });

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      address: newUser.address,
      isActive: newUser.isActive,
      loyaltyPoints: newUser.loyaltyPoints,
      loyaltyLevel: newUser.loyaltyLevel,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'utilisateur'
    });
  }
});

// PUT /api/admin/users/:id - Mettre à jour un utilisateur
router.put('/:id', protect, requireAdmin, [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('phone').notEmpty().withMessage('Le téléphone est requis'),
  body('role').isIn(['client', 'pharmacien', 'admin']).withMessage('Rôle invalide'),
  body('address').optional().isString().withMessage('Adresse invalide'),
  body('isActive').isBoolean().withMessage('Statut invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const { firstName, lastName, phone, role, address, isActive } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour l'utilisateur
    await user.update({
      firstName,
      lastName,
      phone,
      role,
      address,
      isActive
    });

    // Mettre à jour les points de fidélité si le rôle change
    if (role === 'client' && !user.loyaltyPoints) {
      await user.update({
        loyaltyPoints: 0,
        loyaltyLevel: 'bronze'
      });
    } else if (role !== 'client') {
      await user.update({
        loyaltyPoints: null,
        loyaltyLevel: null
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        isActive: user.isActive,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyLevel: user.loyaltyLevel,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de l\'utilisateur'
    });
  }
});

// PATCH /api/admin/users/:id/status - Activer/Désactiver un utilisateur
router.patch('/:id/status', protect, requireAdmin, [
  body('isActive').isBoolean().withMessage('Statut invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour le statut
    await user.update({ isActive });

    res.json({
      success: true,
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur (soft delete)
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que l'utilisateur n'est pas l'administrateur principal
    if (user.role === 'admin' && user.id === 1) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer l\'administrateur principal'
      });
    }

    // Supprimer l'utilisateur (soft delete)
    await user.destroy();

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'utilisateur'
    });
  }
});

// GET /api/admin/users/stats - Statistiques des utilisateurs
router.get('/stats/overview', protect, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });
    
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['role']
    });

    const roleStats = {};
    usersByRole.forEach(stat => {
      roleStats[stat.role] = parseInt(stat.dataValues.count);
    });

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: roleStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
