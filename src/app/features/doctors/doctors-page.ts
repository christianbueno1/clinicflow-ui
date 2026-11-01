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
    <section class="mx-auto flex max-w-6xl flex-col gap-6">
      <header class="flex items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight">Doctores</h1>
        <button type="button" class="btn-primary" (click)="editing.set('new')">Nuevo</button>
      </header>

      @if (editing(); as current) {
        <app-doctor-form
          [doctor]="current === 'new' ? null : current"
          (saved)="onSaved()"
          (cancelled)="editing.set(null)"
        />
      }

      <div class="grid gap-3 sm:max-w-xl sm:grid-cols-2">
        <select [formField]="filterForm.specialty_id" class="field" aria-label="Filtrar por especialidad">
          <option value="">Todas las especialidades</option>
          @for (s of specialties.value(); track s.id) {
            <option [value]="s.id">{{ s.name }}</option>
          }
        </select>
        <select [formField]="filterForm.is_active" class="field" aria-label="Filtrar por estado">
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      @if (message()) {
        <p role="alert" class="rounded-2xl border border-clinic-rose/40 bg-clinic-rose/10 p-4 text-sm">
          {{ message() }}
        </p>
      }

      @if (doctors.isLoading()) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          @for (i of [1, 2, 3]; track i) {
            <div class="glass flex animate-pulse flex-col gap-4 p-5">
              <div class="h-5 w-40 rounded bg-white/10"></div>
              <div class="h-4 w-24 rounded bg-white/10"></div>
              <div class="h-10 rounded bg-white/10"></div>
            </div>
          }
        </div>
      } @else if (doctors.error()) {
        <div class="glass flex flex-col items-start gap-3 p-5">
          <p class="text-sm">No se pudo cargar el listado.</p>
          <button type="button" class="btn" (click)="doctors.reload()">Reintentar</button>
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (d of doctors.value(); track d.id) {
            <article class="glass flex flex-col gap-4 p-5 transition hover:bg-white/5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate font-semibold">{{ d.first_name }} {{ d.last_name }}</h2>
                  <p class="truncate text-sm text-clinic-muted">{{ d.specialty.name }}</p>
                </div>
                @if (d.is_active) {
                  <span class="shrink-0 rounded-full bg-clinic-teal/15 px-2.5 py-1 text-xs font-medium text-clinic-teal">
                    Activo
                  </span>
                } @else {
                  <span class="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-clinic-muted">
                    Inactivo
                  </span>
                }
              </div>

              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div class="min-w-0">
                  <dt class="text-xs text-clinic-muted">Cédula</dt>
                  <dd class="truncate font-mono">{{ d.identification_number }}</dd>
                </div>
                <div class="min-w-0">
                  <dt class="text-xs text-clinic-muted">Licencia</dt>
                  <dd class="truncate font-mono">{{ d.license_number }}</dd>
                </div>
              </dl>

              <div class="flex gap-2">
                <button type="button" class="btn flex-1" (click)="editing.set(d)">Editar</button>
                <button type="button" class="btn flex-1 hover:text-clinic-rose" (click)="remove(d)">Eliminar</button>
              </div>
            </article>
          } @empty {
            <p class="text-sm text-clinic-muted sm:col-span-2 xl:col-span-3">No hay doctores con esos filtros.</p>
          }
        </div>

        @if (page() > 0 || doctors.value().length >= pageSize) {
        <div class="flex items-center justify-between gap-3 sm:justify-start">
            <div class="flex items-center justify-between gap-3 sm:justify-start">
              <button type="button" class="btn" [disabled]="page() === 0" (click)="page.set(page() - 1)">Anterior</button>
              <span class="text-sm text-clinic-muted">Página {{ page() + 1 }}</span>
              <button type="button" class="btn" [disabled]="doctors.value().length < pageSize" (click)="page.set(page() + 1)">
                Siguiente
              </button>
            </div>
        </div>
        }        
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