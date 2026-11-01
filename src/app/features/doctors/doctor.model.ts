import { Specialty } from '../specialties/specialty.model';

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  identification_number: string;
  license_number: string;
  specialty_id: string;
  is_active: boolean;
  specialty: Specialty;
  created_at: string;
  updated_at: string;
}

export type DoctorInput = Omit<Doctor, 'id' | 'specialty' | 'created_at' | 'updated_at'>;

export const EMPTY_DOCTOR: DoctorInput = {
  first_name: '',
  last_name: '',
  identification_number: '',
  license_number: '',
  specialty_id: '',
  is_active: true,
};

export function toDoctorInput(d: Doctor): DoctorInput {
  return {
    first_name: d.first_name,
    last_name: d.last_name,
    identification_number: d.identification_number,
    license_number: d.license_number,
    specialty_id: d.specialty.id,
    is_active: d.is_active,
  };
}