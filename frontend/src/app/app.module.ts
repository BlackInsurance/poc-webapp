import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, Http } from '@angular/http';
import { HttpClientModule } from '@angular/common/http'

//import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppRoutes } from './app.routing';
import { AppComponent } from './app.component';
import { MainLayoutComponent } from './layouts/main-layout.component';

import{ ToastrModule} from 'ngx-toastr';



//export function createTranslateLoader(http: Http) {
//  return new TranslateStaticLoader(http, './assets/i18n', '.json');
//}


@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(AppRoutes),
    FormsModule,
    HttpModule,
    HttpClientModule,
    //TranslateModule.forRoot({
    //  provide: TranslateLoader,
    //  useFactory: (createTranslateLoader),
    //  deps: [Http]
    //}),
    FlexLayoutModule,
    ToastrModule.forRoot()
  ],
  entryComponents: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
