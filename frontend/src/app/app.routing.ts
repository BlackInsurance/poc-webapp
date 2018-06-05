import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layouts/main-layout.component';

export const AppRoutes: Routes = [{
  path: '',
  redirectTo: 'signup',
  pathMatch: 'full',
}, {
  path: '',
  component: MainLayoutComponent,
  children: [{
    path: 'home',
    loadChildren: './dashboard/dashboard.module#DashboardModule'
  }, {
    path: 'signup',
    loadChildren: './policies/policies.module#PoliciesModule'
  }]
}, {
  path: '**',
  redirectTo: 'session/404'
}];
