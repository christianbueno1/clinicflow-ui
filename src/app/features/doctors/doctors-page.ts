import { Component, inject, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';

import { apiErrorMessage } from '../../core/api-error';
import { SpecialtiesApi } from '../specialties/specialties-api';
import { Specialty } from '../specialties/specialty.model';
import { DoctorForm } from './doctor-form';
import { DoctorsApi } from './doctors-api';
import { Doctor } from './doctor.model';

@Component({
  selector: 'app-doctors-page',
  imports: [DoctorForm, FormField],
  template: `
    <section class="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Doctores</h1>
        <button (click)="editing.set('new')" class="rounded bg-blue-600 px-4 py-2 text-white">Nuevo</button>
      </header>

      @if (editing(); as current) {
        <app-doctor-form
          [doctor]="current === 'new' ? null : current"
          (saved)="onSaved()"
          (cancelled)="editing.set(null)"
        />
      }

      <div class="flex gap-3">
        <select [formField]="filterForm.specialty_id" class="rounded border border-gray-300 px-3 py-2">
          <option value="">Todas las especialidades</option>
          @for (s of specialties.value(); track s.id) {
            <option [value]="s.id">{{ s.name }}</option>
          }
        </select>
        <select [formField]="filterForm.is_active" class="rounded border border-gray-300 px-3 py-2">
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      @if (message()) {
        <p class="rounded bg-red-50 p-3 text-sm text-red-700">{{ message() }}</p>
      }

      @if (doctors.isLoading()) {
        <p>Cargando…</p>
      } @else if (doctors.error()) {
        <p class="text-red-600">No se pudo cargar el listado.</p>
      } @else {
        <table class="w-full text-left text-sm">
          <thead class="border-b text-gray-600">
            <tr>
              <th class="p-2">Nombre</th>
              <th class="p-2">Cédula</th>
              <th class="p-2">Licencia</th>
              <th class="p-2">Especialidad</th>
              <th class="p-2">Estado</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (d of doctors.value(); track d.id) {
              <tr>
                <td class="p-2">{{ d.first_name }} {{ d.last_name }}</td>
                <td class="p-2">{{ d.identification_number }}</td>
                <td class="p-2">{{ d.license_number }}</td>
                <td class="p-2">{{ d.specialty.name }}</td>
                <td class="p-2">{{ d.is_active ? 'Activo' : 'Inactivo' }}</td>
                <td class="flex gap-2 p-2">
                  <button (click)="editing.set(d)" class="text-blue-600">Editar</button>
                  <button (click)="remove(d)" class="text-red-600">Eliminar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-3 text-gray-500">No hay doctores.</td></tr>
            }
          </tbody>
        </table>

        <div class="flex items-center gap-3">
          <button (click)="page.set(page() - 1)" [disabled]="page() === 0" class="rounded border px-3 py-1 disabled:opacity-40">
            Anterior
          </button>
          <span class="text-sm">Página {{ page() + 1 }}</span>
          <button
            (click)="page.set(page() + 1)"
            [disabled]="doctors.value().length < pageSize"
            class="rounded border px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      }
    </section>
  `,
})
export class DoctorsPage {
  private readonly api = inject(DoctorsApi);
  private readonly specialtiesApi = inject(SpecialtiesApi);

  protected readonly pageSize = 20;
  protected readonly filters = signal({ specialty_id: '', is_active: '' });
  protected readonly filterForm = form(this.filters);
  protected readonly page = linkedSignal({ source: this.filters, computation: () => 0 });

  protected readonly specialties = httpResource<Specialty[]>(() => this.specialtiesApi.url, {
    defaultValue: [],
  });

  protected readonly doctors = httpResource<Doctor[]>(
    () => {
      const q = new URLSearchParams({
        skip: String(this.page() * this.pageSize),
        limit: String(this.pageSize),
      });
      const { specialty_id, is_active } = this.filters();
      if (specialty_id) q.set('specialty_id', specialty_id);
      if (is_active) q.set('is_active', is_active);
      return `${this.api.url}?${q}`;
    },
    { defaultValue: [] },
  );

  protected readonly editing = signal<Doctor | 'new' | null>(null);
  protected readonly message = signal<string | null>(null);

  protected onSaved() {
    this.editing.set(null);
    this.message.set(null);
    this.doctors.reload();
  }

  protected async remove(d: Doctor) {
    if (!confirm(`¿Eliminar a ${d.first_name} ${d.last_name}?`)) return;
    try {
      await firstValueFrom(this.api.remove(d.id));
      this.message.set(null);
      this.doctors.reload();
    } catch (err) {
      this.message.set(apiErrorMessage(err)); // 409: tiene citas programadas a futuro
    }
  }
}