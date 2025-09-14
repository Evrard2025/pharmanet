const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Enregistrer un nouvel utilisateur
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('phone').notEmpty().matches(/^[0-9+\-\s()]+$/).withMessage('Numéro de téléphone invalide'),
  body('officine').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le nom de l\'officine doit contenir entre 2 et 100 caractères'),
  body('ville').optional().trim().isLength({ min: 2, max: 50 }).withMessage('La ville doit contenir entre 2 et 50 caractères'),
  body('role').optional().isIn(['client', 'pharmacien', 'admin']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    console.log('📝 Données reçues pour inscription:', JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone, address, officine, ville, role } = req.body;

    // Validation selon le rôle
    const userRole = role || 'client';
    
    // Pour les professionnels, l'email est obligatoire
    if ((userRole === 'pharmacien' || userRole === 'admin') && !email) {
      return res.status(400).json({ message: 'L\'email est obligatoire pour les professionnels' });
    }

    // Vérifier si l'utilisateur existe déjà
    let existingUser = null;
    
    // Vérifier par email si fourni
    if (email) {
      existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
      }
    }
    
    // Vérifier par téléphone
    existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec ce numéro de téléphone existe déjà' });
    }

    // Construire l'adresse si officine et ville sont fournis
    let finalAddress = address;
    if (officine && ville) {
      finalAddress = `${officine}, ${ville}`;
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address: finalAddress,
      role: role || 'client'
    });

    // Si c'est un patient (rôle 'client'), créer automatiquement un dossier patient médical
    if (user.role === 'client') {
      try {
        // Créer un dossier patient médical avec les informations de base
        const patientData = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          telephone: user.phone,
          adresse: user.address,
          // Valeurs par défaut pour les champs obligatoires
          dateNaissance: '1990-01-01', // Date par défaut, à modifier par le patient
          traitementsChroniques: [],
          traitementsPonctuels: [],
          sousContraceptif: false
        };

        const patient = await Patient.create(patientData);
        console.log(`✅ Dossier patient médical créé automatiquement pour l'utilisateur ${user.firstName} ${user.lastName} (ID: ${patient.id})`);
      } catch (patientError) {
        console.error('⚠️ Erreur lors de la création du dossier patient médical:', patientError);
        // Ne pas faire échouer l'inscription si la création du dossier patient échoue
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email ou téléphone requis'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Déterminer si l'identifiant est un email ou un téléphone
    const isEmail = identifier.includes('@');
    
    // Pour les professionnels (pharmacien/admin), seuls les emails sont acceptés
    // Pour les patients (client), seuls les téléphones sont acceptés
    let whereClause;
    if (isEmail) {
      // Connexion par email - chercher d'abord les professionnels
      whereClause = { email: identifier, isActive: true };
    } else {
      // Connexion par téléphone - chercher d'abord les patients
      whereClause = { phone: identifier, isActive: true };
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: whereClause });
    if (!user) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Vérifier que le type de connexion correspond au rôle
    if (isEmail && user.role === 'client') {
      return res.status(401).json({ message: 'Les patients doivent se connecter avec leur numéro de téléphone' });
    }
    if (!isEmail && (user.role === 'pharmacien' || user.role === 'admin')) {
      return res.status(401).json({ message: 'Les professionnels doivent se connecter avec leur email' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

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
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Changer le mot de passe de l'utilisateur connecté
// @access  Private
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 