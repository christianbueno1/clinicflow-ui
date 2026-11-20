export type Sex = 'male' | 'female';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  sex: Sex;
  phone: string;
  identification_number: string;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export type PatientInput = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;

export const EMPTY_PATIENT: PatientInput = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  sex: 'female',
  phone: '',
  identification_number: '',
  email: null,
  address: null,
};

export function toPatientInput(p: Patient): PatientInput {
  const { id, created_at, updated_at, ...input } = p;
  return input;
}