import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';

import { apiErrorMessage } from '../../../core/api-error';
import { diff } from '../../../core/diff';
import { PatientsApi } from '../patients-api';
import { EMPTY_PATIENT, Patient, PatientInput, toPatientInput } from '../patient.model';

// El formulario usa '' para "vacío"; la API usa null en email y address.
type FormValue = Omit<PatientInput, 'email' | 'address'> & { email: string; address: string };

const toFormValue = (p: PatientInput): FormValue => ({
  ...p,
  email: p.email ?? '',
  address: p.address ?? '',
});

const toInput = (v: FormValue): PatientInput => ({
  first_name: v.first_name.trim(),
  last_name: v.last_name.trim(),
  date_of_birth: v.date_of_birth,
  sex: v.sex,
  phone: v.phone.trim(),
  identification_number: v.identification_number.trim(),
  email: v.email.trim().toLowerCase() || null,
  address: v.address.trim() || null,
});

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

@Component({
  selector: 'app-patient-form',
  imports: [FormField, FormRoot],
  templateUrl: './patient-form.html',
})
export class PatientForm {
  private readonly api = inject(PatientsApi);

  readonly patient = input<Patient | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly today = today();
  protected readonly serverError = signal<string | null>(null);

  protected readonly model = linkedSignal<FormValue>(() => {
    const p = this.patient();
    return toFormValue(p ? toPatientInput(p) : EMPTY_PATIENT);
  });

  protected readonly f = form(
    this.model,
    (path) => {
      required(path.first_name, { message: 'Los nombres son obligatorios' });
      maxLength(path.first_name, 100, { message: 'Máximo 100 caracteres' });

      required(path.last_name, { message: 'Los apellidos son obligatorios' });
      maxLength(path.last_name, 100, { message: 'Máximo 100 caracteres' });

      required(path.date_of_birth, { message: 'La fecha de nacimiento es obligatoria' });
      validate(path.date_of_birth, ({ value }) =>
        value() > today() ? { kind: 'future', message: 'No puede ser una fecha futura' } : null,
      );

      required(path.sex, { message: 'Selecciona el sexo' });

      required(path.phone, { message: 'El teléfono es obligatorio' });
      pattern(path.phone, /^\+?(\s*\d){7,20}\s*$/, {
        message: 'Entre 7 y 20 dígitos (espacios y + inicial opcionales)',
      });

      required(path.identification_number, { message: 'La cédula es obligatoria' });
      pattern(path.identification_number, /^\d{10}$/, { message: 'La cédula debe tener 10 dígitos' });

      email(path.email, { message: 'Correo no válido' });
      maxLength(path.address, 500, { message: 'Máximo 500 caracteres' });
    },
    {
      submission: {
        action: async (field) => {
          this.serverError.set(null);
          const value = toInput(field().value());
          const current = this.patient();
          try {
            if (current) {
              const changes = diff(value, toPatientInput(current));
              if (Object.keys(changes).length > 0) {
                await firstValueFrom(this.api.update(current.id, changes));
              }
            } else {
              await firstValueFrom(this.api.create(value));
            }
          } catch (err) {
            this.serverError.set(apiErrorMessage(err));
            return;
          }
          this.saved.emit();
          return;
        },
      },
    },
  );
}