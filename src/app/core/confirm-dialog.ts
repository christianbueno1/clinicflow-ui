import { Component, input, output } from '@angular/core';
import { Modal } from './modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  template: `
    <app-modal [label]="title()" (closed)="cancelled.emit()">
      <div class="glass flex flex-col gap-4 p-5 sm:p-6">
        <h2 class="text-lg font-semibold">{{ title() }}</h2>
        <p class="text-sm text-clinic-muted">{{ message() }}</p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" class="btn" (click)="cancelled.emit()">Cancelar</button>
          <button
            type="button"
            class="btn border-clinic-rose/40 text-clinic-rose hover:bg-clinic-rose/10"
            (click)="confirmed.emit()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Eliminar');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}