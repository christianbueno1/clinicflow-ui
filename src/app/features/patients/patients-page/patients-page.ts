import { Component, DestroyRef, effect, inject, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { apiErrorMessage } from '../../../core/api-error';
import { Modal } from '../../../core/modal';
import { emptyPage, Page } from '../../../core/page';
import { PatientForm } from '../patient-form/patient-form';
import { PatientsApi } from '../patients-api';
import { Patient } from '../patient.model';

@Component({
  imports: [Modal, PatientForm],
  selector: 'app-patients-page',
  templateUrl: './patients-page.html',
})
export class PatientsPage {
  private readonly api = inject(PatientsApi);

  protected readonly pageSize = 20;

  // `q` es el término ya aplicado (con retardo); el input solo lo actualiza tras una pausa.
  protected readonly q = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  // La API pagina desde 1; al cambiar la búsqueda se vuelve a la primera página.
  protected readonly page = linkedSignal({ source: this.q, computation: () => 1 });

  protected readonly patients = httpResource<Page<Patient>>(
    () => {
      const params = new URLSearchParams({
        page: String(this.page()),
        page_size: String(this.pageSize),
      });
      if (this.q()) params.set('q', this.q());
      return `${this.api.url}?${params}`;
    },
    { defaultValue: emptyPage<Patient>(this.pageSize) },
  );

  protected readonly editing = signal<Patient | 'new' | null>(null);
  protected readonly message = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));

    // Si se elimina el último registro de la última página, retrocede a una página válida.
    effect(() => {
      const { total_pages } = this.patients.value();
      if (total_pages > 0 && this.page() > total_pages) this.page.set(total_pages);
    });
  }

  protected onSearch(value: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.q.set(value.trim()), 300);
  }

  protected onSaved() {
    this.editing.set(null);
    this.message.set(null);
    this.patients.reload();
  }

  protected async remove(p: Patient) {
    if (!confirm(`¿Eliminar a ${p.first_name} ${p.last_name}?`)) return;
    try {
      await firstValueFrom(this.api.remove(p.id));
      this.message.set(null);
      this.patients.reload();
    } catch (err) {
      this.message.set(apiErrorMessage(err)); // 409: tiene citas programadas a futuro
    }
  }
}