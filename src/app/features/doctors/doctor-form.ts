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
      <div class="glass animate-pulse p-5 text-sm text-clinic-muted" aria-busy="true">Cargando…</div>
    } @else if (specialties.error()) {
      <div class="glass flex flex-col items-start gap-3 p-5">
        <p class="text-sm">No se pudieron cargar las especialidades.</p>
        <div class="flex gap-2">
          <button type="button" class="btn" (click)="specialties.reload()">Reintentar</button>
          <button type="button" class="btn" (click)="cancelled.emit()">Cancelar</button>
        </div>
      </div>
    } @else {
      <form [formRoot]="f" class="glass grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" for="first_name">Nombres</label>
          <input id="first_name" [formField]="f.first_name" class="field" autocomplete="off" />
          @if (f.first_name().touched() && f.first_name().invalid()) {
            <ul class="text-sm text-clinic-rose">
              @for (e of f.first_name().errors(); track e) { <li>{{ e.message }}</li> }
            </ul>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" for="last_name">Apellidos</label>
          <input id="last_name" [formField]="f.last_name" class="field" autocomplete="off" />
          @if (f.last_name().touched() && f.last_name().invalid()) {
            <ul class="text-sm text-clinic-rose">
              @for (e of f.last_name().errors(); track e) { <li>{{ e.message }}</li> }
            </ul>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" for="identification_number">Cédula</label>
          <input id="identification_number" [formField]="f.identification_number" class="field font-mono" inputmode="numeric" autocomplete="off" />
          @if (f.identification_number().touched() && f.identification_number().invalid()) {
            <ul class="text-sm text-clinic-rose">
              @for (e of f.identification_number().errors(); track e) { <li>{{ e.message }}</li> }
            </ul>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" for="license_number">N.º de licencia</label>
          <input id="license_number" [formField]="f.license_number" class="field font-mono" autocomplete="off" />
          @if (f.license_number().touched() && f.license_number().invalid()) {
            <ul class="text-sm text-clinic-rose">
              @for (e of f.license_number().errors(); track e) { <li>{{ e.message }}</li> }
            </ul>
          }
        </div>

        <div class="flex flex-col gap-2 sm:col-span-2">
          <label class="text-sm font-medium" for="specialty_id">Especialidad</label>
          <select id="specialty_id" [formField]="f.specialty_id" class="field">
            <option value="">Selecciona una especialidad</option>
            @for (s of specialties.value(); track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
          @if (f.specialty_id().touched() && f.specialty_id().invalid()) {
            <ul class="text-sm text-clinic-rose">
              @for (e of f.specialty_id().errors(); track e) { <li>{{ e.message }}</li> }
            </ul>
          }
        </div>

        <label class="flex items-center gap-3 py-1 text-sm font-medium sm:col-span-2">
          <input type="checkbox" [formField]="f.is_active" class="size-5 accent-clinic-teal" />
          Doctor activo
        </label>

        @if (serverError()) {
          <p role="alert" class="rounded-2xl border border-clinic-rose/40 bg-clinic-rose/10 p-4 text-sm sm:col-span-2">
            {{ serverError() }}
          </p>
        }

        <div class="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <button type="button" class="btn" (click)="cancelled.emit()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="f().submitting()">
            {{ f().submitting() ? 'Guardando…' : 'Guardar' }}
          </button>
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
