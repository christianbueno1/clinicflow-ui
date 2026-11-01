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
    <section class="mx-auto flex max-w-2xl flex-col gap-6">
      <header class="flex items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight">Especialidades</h1>
        <button type="button" class="btn-primary" (click)="editing.set('new')">Nueva</button>
      </header>

      @if (editing(); as current) {
        <app-specialty-form
          [specialty]="current === 'new' ? null : current"
          (saved)="onSaved()"
          (cancelled)="editing.set(null)"
        />
      }

      @if (message()) {
        <p role="alert" class="rounded-2xl border border-clinic-rose/40 bg-clinic-rose/10 p-4 text-sm">
          {{ message() }}
        </p>
      }

      @if (specialties.isLoading()) {
        <div class="glass divide-y divide-clinic-border" aria-busy="true">
          @for (i of [1, 2, 3]; track i) {
            <div class="p-4"><div class="h-5 w-40 animate-pulse rounded bg-white/10"></div></div>
          }
        </div>
      } @else if (specialties.error()) {
        <div class="glass flex flex-col items-start gap-3 p-5">
          <p class="text-sm">No se pudo cargar el listado.</p>
          <button type="button" class="btn" (click)="specialties.reload()">Reintentar</button>
        </div>
      } @else {
        <ul class="glass divide-y divide-clinic-border overflow-hidden">
          @for (s of specialties.value(); track s.id) {
            <li class="flex items-center justify-between gap-3 px-4 py-2 transition hover:bg-white/5">
              <span class="min-w-0 truncate font-medium">{{ s.name }}</span>
              <span class="flex shrink-0">
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded-xl text-clinic-muted transition hover:bg-white/5 hover:text-clinic-text"
                  [attr.aria-label]="'Editar ' + s.name"
                  (click)="editing.set(s)"
                >
                  <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded-xl text-clinic-muted transition hover:bg-white/5 hover:text-clinic-rose"
                  [attr.aria-label]="'Eliminar ' + s.name"
                  (click)="remove(s)"
                >
                  <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </span>
            </li>
          } @empty {
            <li class="p-5 text-sm text-clinic-muted">No hay especialidades todavía.</li>
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