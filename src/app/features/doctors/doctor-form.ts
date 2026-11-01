import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';

import { apiErrorMessage } from '../../core/api-error';
import { diff } from '../../core/diff';
import { SpecialtiesApi } from '../specialties/specialties-api';
import { Specialty } from '../specialties/specialty.model';
import { DoctorsApi } from './doctors-api';
import { Doctor, DoctorInput, EMPTY_DOCTOR, toDoctorInput } from './doctor.model';

const normalize = (v: DoctorInput): DoctorInput => ({
  ...v,
  first_name: v.first_name.trim(),
  last_name: v.last_name.trim(),
  identification_number: v.identification_number.trim(),
  license_number: v.license_number.trim(),
});

@Component({
  selector: 'app-doctor-form',
  imports: [FormField, FormRoot],
  template: `
    @if (specialties.isLoading()) {
      <p>Cargando…</p>
    } @else {
      <form [formRoot]="f" class="flex max-w-xl flex-col gap-3 rounded-lg border border-gray-200 p-4">
        <label class="flex flex-col gap-1 text-sm font-medium">
          Nombres
          <input [formField]="f.first_name" class="rounded border border-gray-300 px-3 py-2 font-normal" />
        </label>
        @if (f.first_name().touched() && f.first_name().invalid()) {
          <ul class="text-sm text-red-600">
            @for (e of f.first_name().errors(); track e) { <li>{{ e.message }}</li> }
          </ul>
        }

        <label class="flex flex-col gap-1 text-sm font-medium">
          Apellidos
          <input [formField]="f.last_name" class="rounded border border-gray-300 px-3 py-2 font-normal" />
        </label>
        @if (f.last_name().touched() && f.last_name().invalid()) {
          <ul class="text-sm text-red-600">
            @for (e of f.last_name().errors(); track e) { <li>{{ e.message }}</li> }
          </ul>
        }

        <label class="flex flex-col gap-1 text-sm font-medium">
          Cédula
          <input [formField]="f.identification_number" inputmode="numeric" class="rounded border border-gray-300 px-3 py-2 font-normal" />
        </label>
        @if (f.identification_number().touched() && f.identification_number().invalid()) {
          <ul class="text-sm text-red-600">
            @for (e of f.identification_number().errors(); track e) { <li>{{ e.message }}</li> }
          </ul>
        }

        <label class="flex flex-col gap-1 text-sm font-medium">
          N.º de licencia
          <input [formField]="f.license_number" class="rounded border border-gray-300 px-3 py-2 font-normal" />
        </label>
        @if (f.license_number().touched() && f.license_number().invalid()) {
          <ul class="text-sm text-red-600">
            @for (e of f.license_number().errors(); track e) { <li>{{ e.message }}</li> }
          </ul>
        }

        <label class="flex flex-col gap-1 text-sm font-medium">
          Especialidad
          <select [formField]="f.specialty_id" class="rounded border border-gray-300 px-3 py-2 font-normal">
            <option value="">Selecciona una especialidad</option>
            @for (s of specialties.value(); track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </label>
        @if (f.specialty_id().touched() && f.specialty_id().invalid()) {
          <ul class="text-sm text-red-600">
            @for (e of f.specialty_id().errors(); track e) { <li>{{ e.message }}</li> }
          </ul>
        }

        <label class="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" [formField]="f.is_active" />
          Activo
        </label>

        @if (serverError()) {
          <p class="rounded bg-red-50 p-3 text-sm text-red-700">{{ serverError() }}</p>
        }

        <div class="flex gap-2">
          <button
            type="submit"
            [disabled]="f().submitting()"
            class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ f().submitting() ? 'Guardando…' : 'Guardar' }}
          </button>
          <button type="button" (click)="cancelled.emit()" class="rounded border px-4 py-2">Cancelar</button>
        </div>
      </form>
    }
  `,
})
export class DoctorForm {
  private readonly api = inject(DoctorsApi);
  private readonly specialtiesApi = inject(SpecialtiesApi);

  readonly doctor = input<Doctor | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly serverError = signal<string | null>(null);
  protected readonly specialties = httpResource<Specialty[]>(() => this.specialtiesApi.url, {
    defaultValue: [],
  });

  protected readonly model = linkedSignal<DoctorInput>(() => {
    const d = this.doctor();
    return d ? toDoctorInput(d) : { ...EMPTY_DOCTOR };
  });

  protected readonly f = form(
    this.model,
    (path) => {
      required(path.first_name, { message: 'Los nombres son obligatorios' });
      maxLength(path.first_name, 100, { message: 'Máximo 100 caracteres' });

      required(path.last_name, { message: 'Los apellidos son obligatorios' });
      maxLength(path.last_name, 100, { message: 'Máximo 100 caracteres' });

      required(path.identification_number, { message: 'La cédula es obligatoria' });
      pattern(path.identification_number, /^\d{10}$/, { message: 'La cédula debe tener 10 dígitos' });

      required(path.license_number, { message: 'La licencia es obligatoria' });
      maxLength(path.license_number, 50, { message: 'Máximo 50 caracteres' });

      required(path.specialty_id, { message: 'Selecciona una especialidad' });
    },
    {
      submission: {
        action: async (field) => {
          this.serverError.set(null);
          const value = normalize(field().value());
          const current = this.doctor();
          try {
            if (current) {
              const changes = diff(value, toDoctorInput(current));
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