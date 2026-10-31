import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'specialties' },
  {
    path: 'specialties',
    loadComponent: () =>
      import('./features/specialties/specialties-page').then((m) => m.SpecialtiesPage),
  },
];