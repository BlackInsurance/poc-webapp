import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GooglePlaceModule } from "ngx-google-places-autocomplete";

import { FlexLayoutModule } from '@angular/flex-layout';

import {RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import {RecaptchaFormsModule} from 'ng-recaptcha/forms';

import { NewPolicyComponent } from './newPolicy.component';
import { PoliciesRoutes } from './policies.routing';

import { PolicyService } from './policies.service';




@NgModule({
  imports: [
    GooglePlaceModule,
    CommonModule,
    RouterModule.forChild(PoliciesRoutes),
    FormsModule,
    ReactiveFormsModule,
    RecaptchaModule.forRoot(),
    RecaptchaFormsModule,
    FlexLayoutModule
  ],
  declarations: [ NewPolicyComponent ],
  providers: [ 
    PolicyService,  
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { 
        siteKey: '6LeKfF8UAAAAALxGWM6eny1OnWRpKgGnbY6W2DAg',
      } as RecaptchaSettings
    }
  ],
})

export class PoliciesModule {}
