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
    <form [formRoot]="f" class="flex max-w-md flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <label class="flex flex-col gap-1 text-sm font-medium">
        Nombre
        <input [formField]="f.name" class="rounded border border-gray-300 px-3 py-2 font-normal" />
      </label>

      @if (f.name().touched() && f.name().invalid()) {
        <ul class="text-sm text-red-600">
          @for (error of f.name().errors(); track error) {
            <li>{{ error.message }}</li>
          }
        </ul>
      }

      <div class="flex gap-2">
        <button
          type="submit"
          [disabled]="f().submitting()"
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ f().submitting() ? 'Guardando…' : 'Guardar' }}
        </button>
        <button type="button" (click)="cancelled.emit()" class="rounded border px-4 py-2">
          Cancelar
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