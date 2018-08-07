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

    console.log('checking cookies');
    console.log(document.cookie);

    if (document.cookie.indexOf('jwt=') > -1){
      // Extract the JWT cookie and add it to local storage
      var jwt = this.getCookie('jwt');
      localStorage.setItem('token', jwt);

      // Delete the JWT cookie
      document.cookie = 'jwt=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      console.log(document.cookie);
    }

    if ( localStorage.getItem('token') != null ){ 
      router.navigate(['/home']);
    }else {
      router.navigate(['/signup']);
    }
  }

  getCookie(name : string) : string {
    name += "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
  }


}
