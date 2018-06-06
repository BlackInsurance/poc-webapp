import { Component } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  constructor(translate: TranslateService, router: Router) {
    translate.addLangs(['en', 'fr']);
    translate.setDefaultLang('en');

    const browserLang: string = translate.getBrowserLang();
    translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');


    if ( localStorage.getItem('token') != null ){
      router.navigate(['/home']);
    } else if (window.location.pathname.startsWith('/confirm')) {
      let p = window.location.pathname;
      let confirmationID = p.substring(p.lastIndexOf('/')+1, p.length);
      router.navigate(['/confirm', confirmationID]);
    }else {
      router.navigate(['/signup']);
    }
  }
}
