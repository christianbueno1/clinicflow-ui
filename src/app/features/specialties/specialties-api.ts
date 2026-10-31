import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Specialty, SpecialtyInput } from './specialty.model';

@Service()
export class SpecialtiesApi {
  private readonly http = inject(HttpClient);
  readonly url = `${environment.apiUrl}/specialties`;

  create(body: SpecialtyInput) {
    return this.http.post<Specialty>(this.url, body);
  }

  update(id: string, body: Partial<SpecialtyInput>) {
    return this.http.patch<Specialty>(`${this.url}/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}