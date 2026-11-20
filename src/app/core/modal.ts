import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <dialog
      #dlg
      [attr.aria-label]="label()"
      class="m-auto max-h-[90dvh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto bg-transparent p-0 text-clinic-text backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      (close)="closed.emit()"
      (click)="onBackdropClick($event)"
    >
      <ng-content />
    </dialog>
  `,
})
export class Modal {
  readonly label = input.required<string>();
  readonly closed = output<void>();
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    afterNextRender(() => this.dlg().nativeElement.showModal());
  }

  protected onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.dlg().nativeElement.close();
  }
}