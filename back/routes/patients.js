const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Patient, Prescription, PrescriptionMedicament, Consultation } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');

const router = express.Router();

// GET /api/patients - Récupérer tous les patients
router.get('/', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const patients = await Patient.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      patients: patients.rows,
      total: patients.count,
      totalPages: Math.ceil(patients.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des patients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/patients/:id - Récupérer un patient par ID
router.get('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Calculer l'IMC et l'âge
    const imc = patient.calculateIMC();
    const age = patient.getAge();

    res.json({
      ...patient.toJSON(),
      imc,
      age
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/patients - Créer un nouveau patient
router.post('/', protect, authorize('admin', 'pharmacien'), [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('dateNaissance').isDate(),
  body('sexe').optional().isIn(['M','F']),
  body('poids').optional().isFloat({ min: 0, max: 500 }),
  body('taille').optional().isInt({ min: 50, max: 250 }),
  body('groupeSanguin').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']),
  body('telephone').optional().matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/).withMessage('Format de téléphone invalide (8-20 chiffres, espaces, tirets, parenthèses autorisés)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    console.error('Erreur lors de la création du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/patients/:id - Mettre à jour un patient
router.put('/:id', protect, authorize('admin', 'pharmacien'), [
  body('firstName').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('lastName').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('dateNaissance').optional().isDate().withMessage('Date de naissance invalide'),
  body('sexe').optional().isIn(['M', 'F']).withMessage('Sexe doit être M ou F'),
  body('poids').optional().isFloat({ min: 0, max: 500 }).withMessage('Poids invalide'),
  body('taille').optional().isInt({ min: 50, max: 250 }).withMessage('Taille invalide'),
  body('groupeSanguin').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Groupe sanguin invalide'),
  body('telephone').optional().matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/).withMessage('Format de téléphone invalide (8-20 chiffres, espaces, tirets, parenthèses autorisés)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    await patient.update(req.body);
    
    res.json(patient);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/patients/:id - Supprimer un patient
router.delete('/:id', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    await patient.destroy();
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/patients/:id/historique - Récupérer l'historique complet du patient
// Historique retiré dans ce modèle minimal

// POST /api/patients/:id/pathologies - Ajouter une pathologie
// Endpoints pathologies supprimés pour simplification

// GET /api/patients/:id/card - Générer la carte virtuelle du patient
router.get('/:id/card', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { Consultation, ConsultationMedicament, SurveillanceBiologique } = require('../models');
    
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: Consultation,
          attributes: ['id', 'numeroConsultation', 'dateConsultation', 'medecinConsultant', 'diagnostic', 'indication', 'ordonnance', 'statut', 'typeConsultation', 'notesPharmacien', 'dateDebut', 'dateFin', 'isRenouvelable', 'nombreRenouvellements', 'renouvellementsRestants', 'createdAt', 'updatedAt'],
          order: [['dateConsultation', 'DESC']],
          include: [{
            model: ConsultationMedicament,
            as: 'medicaments',
            attributes: ['id', 'nomMedicament', 'dciMedicament', 'classeTherapeutique', 'posologie', 'quantite', 'unite', 'dateDebutPrise', 'dateFinPrise', 'effetsIndesirablesSignales', 'observance', 'statut', 'precaution']
          }]
        },
        {
          model: SurveillanceBiologique,
          attributes: ['id', 'typeSurveillance', 'parametres', 'frequenceMois', 'dateDebut', 'dateProchaineAnalyse', 'dateDerniereAnalyse', 'resultatsDerniereAnalyse', 'statut', 'priorite', 'notes', 'laboratoire', 'contactLaboratoire']
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Calculer l'âge
    const age = patient.getAge();

    // Créer les données pour le QR code avec toutes les informations
    const patientData = {
      id: patient.id,
      nom: patient.lastName,
      prenom: patient.firstName,
      dateNaissance: patient.dateNaissance,
      age: age,
      sexe: patient.sexe,
      poids: patient.poids,
      taille: patient.taille,
      groupeSanguin: patient.groupeSanguin,
      adresse: patient.adresse,
      telephone: patient.telephone,
      email: patient.email || null,
      numeroSecu: patient.numeroSecu || null,
      lieuNaissance: patient.lieuNaissance || null,
      nationalite: patient.nationalite || null,
      profession: patient.profession || null,
      situationFamiliale: patient.situationFamiliale || null,
      nombreEnfants: patient.nombreEnfants || null,
      traitementsChroniques: patient.traitementsChroniques || [],
      traitementsPonctuels: patient.traitementsPonctuels || [],
      allergies: patient.allergies || [],
      antecedentsMedicaux: patient.antecedentsMedicaux || [],
      antecedentsChirurgicaux: patient.antecedentsChirurgicaux || [],
      antecedentsFamiliaux: patient.antecedentsFamiliaux || [],
      effetsIndesirables: patient.effetsIndesirables || null,
      sousContraceptif: patient.sousContraceptif,
      assurance: patient.assurance,
      structureEmission: patient.structureEmission,
      serviceEmission: patient.serviceEmission,
      medecinPrescripteur: patient.medecinPrescripteur,
      medecinTraitant: patient.medecinTraitant || null,
      consultations: patient.Consultations?.length || 0,
      derniereConsultation: patient.Consultations?.[0]?.dateConsultation || null,
      // Ajouter toutes les consultations détaillées avec médicaments
      consultationsDetaillees: patient.Consultations?.map(consultation => ({
        id: consultation.id,
        numero: consultation.numeroConsultation,
        date: consultation.dateConsultation,
        medecin: consultation.medecinConsultant,
        diagnostic: consultation.diagnostic,
        indication: consultation.indication,
        ordonnance: consultation.ordonnance,
        statut: consultation.statut,
        type: consultation.typeConsultation,
        notesPharmacien: consultation.notesPharmacien,
        dateDebut: consultation.dateDebut,
        dateFin: consultation.dateFin,
        isRenouvelable: consultation.isRenouvelable,
        nombreRenouvellements: consultation.nombreRenouvellements,
        renouvellementsRestants: consultation.renouvellementsRestants,
        medicaments: consultation.medicaments || []
      })) || [],
      // Ajouter les informations de surveillance biologique
      surveillanceBiologique: patient.SurveillanceBiologiques?.map(surveillance => ({
        id: surveillance.id,
        typeSurveillance: surveillance.typeSurveillance,
        parametres: surveillance.parametres,
        frequenceMois: surveillance.frequenceMois,
        dateDebut: surveillance.dateDebut,
        dateProchaineAnalyse: surveillance.dateProchaineAnalyse,
        dateDerniereAnalyse: surveillance.dateDerniereAnalyse,
        resultatsDerniereAnalyse: surveillance.resultatsDerniereAnalyse,
        statut: surveillance.statut,
        priorite: surveillance.priorite,
        notes: surveillance.notes,
        laboratoire: surveillance.laboratoire,
        contactLaboratoire: surveillance.contactLaboratoire
      })) || []
    };



    // Générer le QR code avec toutes les données
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(patientData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });



    // Créer la carte virtuelle
    const cardData = {
      patient: patientData,
      qrCode: qrCodeDataUrl,
      generatedAt: new Date().toISOString(),
      cardNumber: `CARD-${patient.id.toString().padStart(6, '0')}-${new Date().getFullYear()}`,
      // Ajouter un hash pour vérifier les modifications
      dataHash: Buffer.from(JSON.stringify(patientData)).toString('base64').substring(0, 16)
    };

    res.json(cardData);
  } catch (error) {
    console.error('Erreur lors de la génération de la carte patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/patients/:id/card/pdf - Générer la carte virtuelle en PDF (optionnel)
router.get('/:id/card/pdf', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Pour l'instant, retourner un message indiquant que c'est en développement
    res.json({ 
      message: 'Export PDF en cours de développement',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/patients/:id/card/check-update - Vérifier si la carte doit être mise à jour
router.get('/:id/card/check-update', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    const { lastUpdate, dataHash } = req.query;
    
    const patient = await Patient.findByPk(req.params.id, {
      include: [{
        model: Consultation,
        attributes: ['id', 'updatedAt'],
        order: [['updatedAt', 'DESC']],
        limit: 1
      }]
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Calculer le hash actuel des données
    const currentData = {
      patient: {
        id: patient.id,
        updatedAt: patient.updatedAt,
        traitementsChroniques: patient.traitementsChroniques,
        traitementsPonctuels: patient.traitementsPonctuels,
        consultations: patient.Consultations?.length || 0
      },
      lastConsultationUpdate: patient.Consultations?.[0]?.updatedAt || null
    };

    const currentHash = Buffer.from(JSON.stringify(currentData)).toString('base64').substring(0, 16);
    
    // Vérifier si des modifications ont été apportées
    const hasChanges = !dataHash || dataHash !== currentHash;
    const lastPatientUpdate = patient.updatedAt;
    const lastConsultationUpdate = patient.Consultations?.[0]?.updatedAt;

    res.json({
      hasChanges,
      currentHash,
      lastPatientUpdate,
      lastConsultationUpdate,
      needsUpdate: hasChanges
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de mise à jour:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/patients/:id/card/refresh - Forcer la mise à jour de la carte
router.post('/:id/card/refresh', protect, authorize('admin', 'pharmacien'), async (req, res) => {
  try {
    // Invalider le cache React Query côté frontend
    // Cette route peut être utilisée pour déclencher une mise à jour manuelle
    
    res.json({ 
      message: 'Mise à jour de la carte déclenchée',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour forcée:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 