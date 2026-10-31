import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Error inesperado.';
  if (err.status === 0) return 'No se pudo conectar con el servidor.';

  const detail = err.error?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join('. ');
  return `Error ${err.status}`;
}