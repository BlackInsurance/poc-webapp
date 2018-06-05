import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { MatIconModule, MatListModule, MatInputModule } from '@angular/material';

import { AutoCompleteComponent } from './auto-complete.component';
import { AutoCompleteSearchService } from './auto-complete.service';
import { LocalStorageService } from './storage.service';
import { GlobalRef, BrowserGlobalRef } from './windowRef.service';
@NgModule({
  declarations: [
    AutoCompleteComponent
  ],
  imports: [
    CommonModule,
    HttpModule,
    FormsModule,
    MatIconModule,
    MatListModule,
    MatInputModule
  ],
  exports: [
    AutoCompleteComponent
  ],
  providers : [{ provide: GlobalRef, useClass: BrowserGlobalRef }, AutoCompleteSearchService, LocalStorageService]
})
export class AutocompleteModule {

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AutocompleteModule
    };
  }

}
