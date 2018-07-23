import { Routes } from '@angular/router';

import { NewPolicyComponent } from './newPolicy.component';

export const PoliciesRoutes: Routes = [{
    path: '',
    redirectTo: 'step1',
    pathMatch: 'full',
  }, { 
    path: '', 
    component: NewPolicyComponent,
    children: [
        { path: 'step1', component: NewPolicyComponent },
        { path: 'step2', component: NewPolicyComponent },
        { path: 'step3', component: NewPolicyComponent },
        { path: 'step4', component: NewPolicyComponent },
        { path: 'step5', component: NewPolicyComponent },
        { path: 'error', component: NewPolicyComponent }
    ]
}];
