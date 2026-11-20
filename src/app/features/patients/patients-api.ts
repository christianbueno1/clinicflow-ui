import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Patient, PatientInput } from './patient.model';

@Service()
export class PatientsApi {
  private readonly http = inject(HttpClient);
  readonly url = `${environment.apiUrl}/patients`;

  create(body: PatientInput) {
    return this.http.post<Patient>(this.url, body);
  }

  update(id: string, body: Partial<PatientInput>) {
    return this.http.patch<Patient>(`${this.url}/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}