import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ConfirmationComponent } from './confirmation.component';
import { ConfirmationRoutes } from './confirmation.routing';

import { PolicyService } from '../policies/policies.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ConfirmationRoutes)
  ],
  declarations: [ ConfirmationComponent ],
  providers: [ PolicyService ],
})

export class ConfirmationModule {}
