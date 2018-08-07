import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

//import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  selector: 'app-layout',
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  private _router: Subscription;

  today: number = Date.now();
  url: string;
  currentLang = 'en';
  

  constructor(private router: Router ) { //, public translate: TranslateService
    //const browserLang: string = translate.getBrowserLang();
    //translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
  }

  ngOnInit(): void {
    this._router = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this.url = event.url;
    });
  }

  ngOnDestroy() {
    this._router.unsubscribe();
  }

  @HostListener('click', ['$event'])
  onClick(e: any) {
  }

  public closeNavMenu(){
    document.body.classList.remove('nav-open');
  }

  isOver(): boolean {
    return window.matchMedia(`(max-width: 960px)`).matches;
  }

  isMac(): boolean {
    let bool = false;
    if (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.platform.toUpperCase().indexOf('IPAD') >= 0) {
      bool = true;
    }
    return bool;
  }

  loggedIn() : boolean {
    return (localStorage.getItem('token') != null);
  }

  logout(evt:Event) {
    evt.preventDefault();
    localStorage.removeItem('token');
    this.closeNavMenu();
    this.router.navigate(['/signup']);
  }

  
}
