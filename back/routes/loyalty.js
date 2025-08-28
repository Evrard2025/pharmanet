const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { Op } = require('sequelize');

const router = express.Router();

// Fonction utilitaire pour obtenir le prochain niveau
const getNextLevel = (currentLevel, currentPoints) => {
  const levels = {
    bronze: { min: 0, max: 99, next: 'argent', pointsNeeded: 100 },
    argent: { min: 100, max: 499, next: 'or', pointsNeeded: 500 },
    or: { min: 500, max: 999, next: 'platine', pointsNeeded: 1000 },
    platine: { min: 1000, max: Infinity, next: null, pointsNeeded: null }
  };

  const level = levels[currentLevel];
  if (!level) return null;

  return {
    currentLevel,
    currentPoints,
    nextLevel: level.next,
    pointsNeeded: level.next ? level.pointsNeeded - currentPoints : 0,
    progress: level.next ? ((currentPoints - level.min) / (level.pointsNeeded - level.min)) * 100 : 100
  };
};

// @route   GET /api/loyalty/profile
// @desc    Obtenir le profil fidélité de l'utilisateur
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'loyaltyPoints', 'loyaltyLevel']
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const levelInfo = getNextLevel(user.loyaltyLevel, user.loyaltyPoints);

    res.json({
      success: true,
      profile: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyLevel: user.loyaltyLevel
        },
        levelInfo
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil fidélité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/loyalty/history
// @desc    Obtenir l'historique des points fidélité
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    // Pour l'instant, retourner un historique vide car nous n'avons plus de commandes
    // Dans un système complet, cela pourrait être basé sur les prescriptions ou consultations
    res.json({
      success: true,
      history: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/loyalty/benefits
// @desc    Obtenir les avantages par niveau de fidélité
// @access  Public
router.get('/benefits', (req, res) => {
  const benefits = {
    bronze: {
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 99,
      benefits: [
        'Accès au programme de fidélité',
        'Points gagnés sur chaque achat',
        'Newsletter exclusive'
      ]
    },
    argent: {
      name: 'Argent',
      minPoints: 100,
      maxPoints: 499,
      benefits: [
        'Tous les avantages Bronze',
        'Réduction de 5% sur les cosmétiques',
        'Livraison gratuite dès 30€',
        'Accès prioritaire aux promotions'
      ]
    },
    or: {
      name: 'Or',
      minPoints: 500,
      maxPoints: 999,
      benefits: [
        'Tous les avantages Argent',
        'Réduction de 10% sur tous les produits',
        'Livraison gratuite dès 20€',
        'Service client prioritaire',
        'Accès aux produits exclusifs'
      ]
    },
    platine: {
      name: 'Platine',
      minPoints: 1000,
      maxPoints: null,
      benefits: [
        'Tous les avantages Or',
        'Réduction de 15% sur tous les produits',
        'Livraison gratuite illimitée',
        'Conciergerie personnelle',
        'Accès anticipé aux nouveautés',
        'Programme de parrainage'
      ]
    }
  };

  res.json({
    success: true,
    benefits
  });
});

// @route   POST /api/loyalty/points/manual
// @desc    Ajouter/supprimer des points fidélité manuellement (Admin)
// @access  Private (Admin)
router.post('/points/manual', protect, authorize('admin'), [
  body('userId').isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  body('points').isInt().withMessage('Points invalides'),
  body('reason').notEmpty().withMessage('Raison requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, points, reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.updateLoyaltyPoints(points);

    res.json({
      success: true,
      message: `${points > 0 ? 'Ajout' : 'Suppression'} de ${Math.abs(points)} points effectué`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyLevel: user.loyaltyLevel
      }
    });
  } catch (error) {
    console.error('Erreur lors de la modification des points:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/loyalty/stats
// @desc    Obtenir les statistiques fidélité (Admin)
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Statistiques par niveau
    const levelStats = await User.findAll({
      attributes: [
        'loyaltyLevel',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
        [User.sequelize.fn('AVG', User.sequelize.col('loyaltyPoints')), 'avgPoints']
      ],
      where: { isActive: true },
      group: ['loyaltyLevel'],
      raw: true
    });

    // Top 10 des clients les plus fidèles
    const topCustomers = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'loyaltyPoints', 'loyaltyLevel'],
      where: { isActive: true },
      order: [['loyaltyPoints', 'DESC']],
      limit: 10
    });

    // Statistiques globales
    const totalUsers = await User.count({ where: { isActive: true } });
    const totalPoints = await User.sum('loyaltyPoints', { where: { isActive: true } });
    const avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPoints,
        avgPoints,
        levelStats,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 