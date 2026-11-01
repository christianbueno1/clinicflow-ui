import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Doctor, DoctorInput } from './doctor.model';

@Service()
export class DoctorsApi {
  private readonly http = inject(HttpClient);
  readonly url = `${environment.apiUrl}/doctors`;

  create(body: DoctorInput) {
    return this.http.post<Doctor>(this.url, body);
  }

  update(id: string, body: Partial<DoctorInput>) {
    return this.http.patch<Doctor>(`${this.url}/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}