import { Component, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { apiErrorMessage } from '../../core/api-error';
import { SpecialtiesApi } from './specialties-api';
import { SpecialtyForm } from './specialty-form';
import { Specialty } from './specialty.model';

@Component({
  selector: 'app-specialties-page',
  imports: [SpecialtyForm],
  template: `
    <section class="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Especialidades</h1>
        <button (click)="editing.set('new')" class="rounded bg-blue-600 px-4 py-2 text-white">
          Nueva
        </button>
      </header>

      @if (editing(); as current) {
        <app-specialty-form
          [specialty]="current === 'new' ? null : current"
          (saved)="onSaved()"
          (cancelled)="editing.set(null)"
        />
      }

      @if (message()) {
        <p class="rounded bg-red-50 p-3 text-sm text-red-700">{{ message() }}</p>
      }

      @if (specialties.isLoading()) {
        <p>Cargando…</p>
      } @else if (specialties.error()) {
        <p class="text-red-600">No se pudo cargar el listado.</p>
      } @else {
        <ul class="divide-y rounded-lg border">
          @for (s of specialties.value(); track s.id) {
            <li class="flex items-center justify-between p-3">
              <span>{{ s.name }}</span>
              <span class="flex gap-2">
                <button (click)="editing.set(s)" class="text-blue-600">Editar</button>
                <button (click)="remove(s)" class="text-red-600">Eliminar</button>
              </span>
            </li>
          } @empty {
            <li class="p-3 text-gray-500">No hay especialidades.</li>
          }
        </ul>
      }
    </section>
  `,
})
export class SpecialtiesPage {
  private readonly api = inject(SpecialtiesApi);

  protected readonly specialties = httpResource<Specialty[]>(() => this.api.url, {
    defaultValue: [],
  });
  protected readonly editing = signal<Specialty | 'new' | null>(null);
  protected readonly message = signal<string | null>(null);

  protected onSaved() {
    this.editing.set(null);
    this.message.set(null);
    this.specialties.reload();
  }

  protected async remove(s: Specialty) {
    if (!confirm(`¿Eliminar "${s.name}"?`)) return;
    try {
      await firstValueFrom(this.api.remove(s.id));
      this.message.set(null);
      this.specialties.reload();
    } catch (err) {
      this.message.set(apiErrorMessage(err)); // p. ej. 409: tiene doctores
    }
  }
}