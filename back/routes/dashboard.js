const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { User, Patient, Consultation } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Obtenir les statistiques du dashboard
// @access  Private (Admin/Pharmacien)
router.get('/stats', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculer la date de début selon la période
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Statistiques générales
    const totalUsers = await User.count({ where: { isActive: true } });
    const totalPatients = await Patient.count();
    const totalConsultations = await Consultation.count();


    // Statistiques mensuelles
    const monthlyStats = await Promise.all([
      Consultation.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        }
      })
    ]);

    // Activité récente
    const recentActivity = await Promise.all([
      // Consultations récentes
      Consultation.findAll({
        limit: 3,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'medecinConsultant', 'createdAt'],
        include: [{
          model: Patient,
          attributes: ['id', 'firstName', 'lastName']
        }]
      }),
      // Nouveaux utilisateurs
      User.findAll({
        limit: 3,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'createdAt'],
        where: { isActive: true }
      })
    ]);

    // Formater l'activité récente
    const formattedActivity = [
      ...recentActivity[0].map(consultation => ({
        id: `consultation-${consultation.id}`,
        type: 'consultation',
        title: `Consultation #${consultation.id}`,
        description: `${consultation.Patient.firstName} ${consultation.Patient.lastName} - Dr. ${consultation.medecinConsultant}`,
        date: consultation.createdAt
      })),
      ...recentActivity[1].map(user => ({
        id: `user-${user.id}`,
        type: 'user',
        title: `Nouveau membre`,
        description: `${user.firstName} ${user.lastName}`,
        date: user.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPatients,
        totalConsultations,
        recentActivity: formattedActivity,
        monthlyStats: {
          consultations: monthlyStats[0]
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 