const User = require('./User');
const Patient = require('./Patient');
const { Consultation, ConsultationMedicament } = require('./Consultation');
const { Medicament } = require('./Medicament');
const { SurveillanceBiologique } = require('./SurveillanceBiologique');
const { Prescription, PrescriptionMedicament } = require('./Prescription');

// Associations simplifiées: les patients ne sont plus liés aux users dans ce modèle minimal

// Associations Patient - Consultation
Patient.hasMany(Consultation, { foreignKey: 'patientId' });
Consultation.belongsTo(Patient, { foreignKey: 'patientId' });

// Associations Consultation - ConsultationMedicament
Consultation.hasMany(ConsultationMedicament, { foreignKey: 'consultationId', as: 'medicaments' });
ConsultationMedicament.belongsTo(Consultation, { foreignKey: 'consultationId' });


// Associations Patient - SurveillanceBiologique
Patient.hasMany(SurveillanceBiologique, { foreignKey: 'patientId' });
SurveillanceBiologique.belongsTo(Patient, { foreignKey: 'patientId' });

// Associations Medicament - SurveillanceBiologique
Medicament.hasMany(SurveillanceBiologique, { foreignKey: 'medicamentId' });
SurveillanceBiologique.belongsTo(Medicament, { foreignKey: 'medicamentId' });

// Associations Patient - Prescription
Patient.hasMany(Prescription, { foreignKey: 'patientId' });
Prescription.belongsTo(Patient, { foreignKey: 'patientId' });

// Associations Prescription - PrescriptionMedicament
Prescription.hasMany(PrescriptionMedicament, { foreignKey: 'prescriptionId', as: 'medicaments' });
PrescriptionMedicament.belongsTo(Prescription, { foreignKey: 'prescriptionId' });

// Associations Medicament - PrescriptionMedicament
Medicament.hasMany(PrescriptionMedicament, { foreignKey: 'medicamentId' });
PrescriptionMedicament.belongsTo(Medicament, { foreignKey: 'medicamentId', as: 'medicament' });

module.exports = {
  User,
  Patient,
  Consultation,
  ConsultationMedicament,
  Medicament,
  SurveillanceBiologique,
  Prescription,
  PrescriptionMedicament
};