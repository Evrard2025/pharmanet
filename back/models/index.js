const User = require('./User');
const Patient = require('./Patient');
const { Consultation, ConsultationMedicament } = require('./Consultation');
const { Medicament } = require('./Medicament');
const { SurveillanceBiologique } = require('./SurveillanceBiologique');

// Associations simplifiées: les patients ne sont plus liés aux users dans ce modèle minimal

// Associations Patient - Consultation
Patient.hasMany(Consultation, { foreignKey: 'patientId' });
Consultation.belongsTo(Patient, { foreignKey: 'patientId' });

// Associations Consultation - ConsultationMedicament
Consultation.hasMany(ConsultationMedicament, { foreignKey: 'consultationId', as: 'medicaments' });
ConsultationMedicament.belongsTo(Consultation, { foreignKey: 'consultationId' });

// Associations Consultation - Medicament
Consultation.belongsTo(Medicament, { foreignKey: 'medicamentId' });
Medicament.hasMany(Consultation, { foreignKey: 'medicamentId' });

// Associations Patient - SurveillanceBiologique
Patient.hasMany(SurveillanceBiologique, { foreignKey: 'patientId' });
SurveillanceBiologique.belongsTo(Patient, { foreignKey: 'patientId' });

// Associations Medicament - SurveillanceBiologique
Medicament.hasMany(SurveillanceBiologique, { foreignKey: 'medicamentId' });
SurveillanceBiologique.belongsTo(Medicament, { foreignKey: 'medicamentId' });

module.exports = {
  User,
  Patient,
  Consultation,
  ConsultationMedicament,
  Medicament,
  SurveillanceBiologique
};