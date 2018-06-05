import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatIconModule, MatCardModule, MatButtonModule, MatListModule, MatInputModule, MatNativeDateModule, MatDatepickerModule } from '@angular/material';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AutocompleteModule } from '../auto-complete/auto-complete.module';

import { NewPolicyComponent } from './newPolicy.component';
import { PoliciesRoutes } from './policies.routing';

import { PolicyService } from './policies.service';


@NgModule({
  imports: [
    AutocompleteModule.forRoot(),
    CommonModule,
    RouterModule.forChild(PoliciesRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatStepperModule,
    MatSnackBarModule,
    FlexLayoutModule
  ],
  declarations: [ NewPolicyComponent ],
  providers: [ PolicyService ],
})

export class PoliciesModule {}
