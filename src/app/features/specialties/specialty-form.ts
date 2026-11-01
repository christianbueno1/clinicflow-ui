import { Component, inject, input, linkedSignal, output } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, FormRoot, maxLength, minLength, required } from '@angular/forms/signals';

import { apiErrorMessage } from '../../core/api-error';
import { SpecialtiesApi } from './specialties-api';
import { Specialty } from './specialty.model';

@Component({
  selector: 'app-specialty-form',
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="f" class="glass flex flex-col gap-4 p-5 sm:p-6">
      <label class="flex flex-col gap-2 text-sm font-medium">
        Nombre
        <input [formField]="f.name" class="field" autocomplete="off" />
      </label>

      @if (f.name().touched() && f.name().invalid()) {
        <ul class="text-sm text-clinic-rose">
          @for (error of f.name().errors(); track error) {
            <li>{{ error.message }}</li>
          }
        </ul>
      }

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="btn" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn-primary" [disabled]="f().submitting()">
          {{ f().submitting() ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>
  `,
})
export class SpecialtyForm {
  private readonly api = inject(SpecialtiesApi);

  readonly specialty = input<Specialty | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly model = linkedSignal(() => ({ name: this.specialty()?.name ?? '' }));

  protected readonly f = form(
    this.model,
    (path) => {
      required(path.name, { message: 'El nombre es obligatorio' });
      minLength(path.name, 2, { message: 'Mínimo 2 caracteres' });
      maxLength(path.name, 100, { message: 'Máximo 100 caracteres' });
    },
    {
      submission: {
        action: async (field) => {
          const body = { name: field().value().name.trim() };
          const current = this.specialty();
          try {
            await firstValueFrom(
              current ? this.api.update(current.id, body) : this.api.create(body),
            );
          } catch (err) {
            return { kind: 'server', message: apiErrorMessage(err), fieldTree: field.name };
          }
          this.saved.emit();
          return;
        },
      },
    },
  );
}