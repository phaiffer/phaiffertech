export const petMedicalRecordPermissions = [
  'pet.medical-record.read',
  'pet.medical-record.create',
  'pet.medical-record.update',
  'pet.medical-record.delete'
];

export const petVaccinationPermissions = [
  'pet.vaccination.read',
  'pet.vaccination.create',
  'pet.vaccination.update',
  'pet.vaccination.delete'
];

export const petPrescriptionPermissions = [
  'pet.prescription.read',
  'pet.prescription.create',
  'pet.prescription.update',
  'pet.prescription.delete'
];

export const petMedicalRoutePermissions = [
  ...petMedicalRecordPermissions,
  ...petVaccinationPermissions,
  ...petPrescriptionPermissions
];
