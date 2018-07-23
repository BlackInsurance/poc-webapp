import { Component } from '@angular/core';
//import { TranslateService } from 'ng2-translate/ng2-translate';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  constructor(router: Router) { //translate: TranslateService, 
    //translate.addLangs(['en', 'fr']);
    //translate.setDefaultLang('en');

    //const browserLang: string = translate.getBrowserLang();
    //translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');

    if ( localStorage.getItem('token') != null ){
      router.navigate(['/home']);
    }else {
      router.navigate(['/signup']);
    }
  }
}
