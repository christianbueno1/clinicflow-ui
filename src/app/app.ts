import { Component, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly menuOpen = signal(false);

  // Solo rutas que ya existen; Pacientes y Citas se agregan cuando las construyamos.
  protected readonly nav = [
    { path: '/specialties', label: 'Especialidades', icon: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5' },
    { path: '/doctors', label: 'Doctores', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
  ];

  protected readonly health = httpResource<{ status: string }>(
    () => `${environment.apiUrl}/health`,
  );
}