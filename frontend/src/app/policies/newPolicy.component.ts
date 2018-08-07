
import { Component, OnInit, ViewChild  } from '@angular/core';
import { FormControl, NgForm, Validators } from '@angular/forms';

import { RecaptchaComponent } from 'ng-recaptcha';

import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Router, ActivatedRoute } from '@angular/router';
import { Policy } from './policy';
import { PolicyService } from './policies.service';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

import { ToastrService } from 'ngx-toastr';


let global_this : any;
declare var FB: any;
declare var grecaptcha : any;


export var recaptchaOnload = function(){
  grecaptcha.render('recaptchaContainer', {
    'sitekey' : '6LeKfF8UAAAAALxGWM6eny1OnWRpKgGnbY6W2DAg'
  });

}


@Component({
  selector: 'newPolicy',
  templateUrl: './newPolicy.component.html',
  styleUrls: [ './newPolicy.component.scss' ]
})
export class NewPolicyComponent implements OnInit {


  newPolicy: Policy;


  federatedLoginBaseURL : string = window.location.protocol + '//' + window.location.host;
  federatedLoginJWT : string = '';

  @ViewChild('emailControl') emailControl;
  @ViewChild('passwordControl') passwordControl;
  @ViewChild('passwordRepeatControl') passwordRepeatControl;
  emailErrorMessage : string = '';
  passwordErrorMessage : string = '';

  @ViewChild('recaptchaControl') recaptchaControl;
  recaptchaToken: string = '';

  @ViewChild('signupButton') signupButton;


  minDate : Date = new Date();
  currentMinDate : Date = this.minDate;
  maxDate : Date = new Date(2018, 10, 1);
  currentMaxDate : Date = this.maxDate;


  @ViewChild('placesRef') placesRef;
  selectedLocation : any = {};

  router : Router = null;
  currentStep = '';
 

  constructor(
    private policyService: PolicyService,
    private toastr: ToastrService,
    private _router: Router
  ) { 
    
    this.router = _router;
    _router.events.subscribe((data:any) => { this.handleRouteChange(data); });

    // Hack to be able to debug backend and frontend in separate processes in the DEV environment
    if (window.location.hostname == 'localhost' ) { this.federatedLoginBaseURL = 'https://localhost:8088'; }

    // Another hack to allow event handlers to gain access to proper 'this' context
    global_this = this; 

    // Prepare the Facebook SDK
    FB.init({
        appId      : '160878728100422',
        status     : false,
        cookie     : false,
        xfbml      : false,
        version    : 'v3.0'
    });
    
    FB.AppEvents.logPageView();   
  }



  ngOnInit() {
    this.newPolicy = Policy.CreateDefault();
  }

  public openNavMenu(){
    document.body.classList.add('nav-open');
  }


  routeChangeTimer : any = null;
  private handleRouteChange(eventData:any){
    if(eventData.snapshot == undefined || eventData.snapshot._urlSegment.segments.length < 2){return;}
    this.currentStep = eventData.snapshot._urlSegment.segments[1].path;

    switch(this.currentStep){
      case 'step2':
        this.resetSecurityInfo();
        break;
      case 'step3':
        this.selectedLocation = '';
        break;
      case 'step5':
        if (this.routeChangeTimer === null){
          this.routeChangeTimer = setTimeout(function() { 
            global_this.changeRoute('/home');
            global_this.routeChangeTimer = null;
          }, 5000);
        }
        break;
      default:
        break;
    }
  }

  public changeRoute(newRoute:string){
    this.router.navigate([newRoute]);
  }





  public userSignupReady : boolean = false;
  public loginInProgress : boolean = false;  
  public userPassLogin : boolean = false;
  

  private checkEmail() {
    let email = this.emailControl.nativeElement.value;

    if (email === '') { return false; }

    var validEmailChecker = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (validEmailChecker.test(email)) {
      this.emailErrorMessage = '';
      return true;
    } else {
      this.emailErrorMessage = 'Please enter valid email';
      return false;
    }
  }

  private checkPass() {
      let repeat = this.passwordRepeatControl.nativeElement.value;
      let pass = this.passwordControl.nativeElement.value;

      if (repeat === '' || pass === '') { return false; }

      if (repeat === pass) {
        this.passwordErrorMessage = '';
        return true;
      } else {
        this.passwordErrorMessage = 'Passwords do not match';
        return false;
      }
  }

  public recaptchaResolved(response:any) {
    this.recaptchaToken = response;
    this.checkSignupReady();
  }

  public checkSignupReady(){
    this.userSignupReady = (this.checkEmail() && this.checkPass() && this.recaptchaToken != '');
  }

  public verifyLoginInformation() {
    this.loginInProgress = true;

    this.policyService
      .checkLoginCredentials(this.emailControl.nativeElement.value, this.passwordControl.nativeElement.value, this.recaptchaToken)
      .subscribe(
        data => {
          this.loginInProgress = false;
          this.router.navigate(['/home']);
          return true;
        },
        err => {
          this.loginInProgress = false;

          if ( err.error ){
            if ( err.error.message == 'Incorrect password' ) {
              // This email exists, so this is a bad login attempt
              this.passwordErrorMessage = 'Bad password, try again';
              this.toastr.error('Bad password, try again', 'Existing account');
            } else if ( err.error.message == 'Incorrect email' ) {
              // This email does not exist, so we are creating a new account
              this.newPolicy.emailAddress = this.emailControl.nativeElement.value;
              this.newPolicy.password = this.passwordControl.nativeElement.value;
              this.userPassLogin = true;
              this.router.navigate(['/signup/step3']);             
            } else if ( err.error.error.toLowerCase().indexOf('recaptcha') > -1 ){
              this.toastr.error('Please verify again', 'reCAPTCHA failed');
              this.recaptchaControl.reset();
              this.recaptchaToken = '';
            } else {
              // Systemic Error.  Display a dialog
              console.log(err);
              console.log(err.error);
              this.toastr.error('Please try again later', 'Network Error');
            }
          }

          return false;
        }
      );
  }




  public loginWithFacebook(eventData : any) : any {
    eventData.preventDefault();
    this.clearPolicyHolderCredentials();

    FB.login(result => {
      if (result.authResponse) {

        this.policyService
          .loginWithFacebook(result.authResponse.accessToken)
          .subscribe(
            (response:any) => {
              console.log('User has been logged in');

              if (response.hasPolicy){
                global_this.router.navigate(['/home']);
              } else {
                global_this.newPolicy.emailAddress = '';
                global_this.newPolicy.password = '';
                global_this.newPolicy.policyHolder.policyHolderID = response.policyHolderID;
                global_this.newPolicy.facebook.id = response.accountID;
                global_this.newPolicy.facebook.name = response.policyHolderName;
                global_this.newPolicy.facebook.email = response.email;
                
                global_this.router.navigate(['/signup/step3']);
              }
            },
            err => {
              console.log(err);
              global_this.toastr.warning('Please try another login method', 'Facebook error');
            });

      } else {
        global_this.toastr.warning('Still need to login', 'Login cancelled');
      }
    }, {scope: 'email'}); 
  }

  public loginWithGoogle(eventData : any) : any {
    eventData.preventDefault();
    this.clearPolicyHolderCredentials();

    window.addEventListener("message", this.handleGoogleLogin, false);
    window.open(this.federatedLoginBaseURL+'/auth/google', 'authenticator', 'menubar=no,location=no,status=no,toolbar=no,width=650px,height=650px');
  }

  public handleGoogleLogin(event:any) {
    let origin = event.origin || event.originalEvent.origin;
    if (origin !== global_this.federatedLoginBaseURL) { return }
    
    if (event.data.type == 'success'){
      if (event.data.hasPolicy){
        localStorage.setItem('token', event.data.token);
        global_this.router.navigate(['/home']);
      } else {
        global_this.newPolicy.emailAddress = '';
        global_this.newPolicy.password = '';
        global_this.newPolicy.policyHolder.policyHolderID = event.data.policyHolderID;
        global_this.newPolicy.google.id = event.data.accountID;
        global_this.newPolicy.google.name = event.data.policyHolderName;
        global_this.newPolicy.google.email = event.data.email;
                     
        global_this.router.navigate(['/signup/step3']);
      }
    } 
  }
  


  public resetSecurityInfo(){
    this.userSignupReady = false;
    this.loginInProgress = false;
    this.userPassLogin = false;
    this.recaptchaToken = '';

    this.clearPolicyHolderCredentials();

    if (this.emailControl != undefined){
      this.emailControl.nativeElement.setValue('');
      this.passwordControl.nativeElement.setValue('');
      this.passwordRepeatControl.nativeElement.setValue('');
      this.recaptchaControl.reset();
    }
  }

  private clearPolicyHolderCredentials(){
    this.newPolicy.policyHolder.policyHolderID = '';
    this.newPolicy.facebook.id = '';
    this.newPolicy.facebook.name = '';
    this.newPolicy.facebook.email = '';
    this.newPolicy.google.id = '';
    this.newPolicy.google.name = '';
    this.newPolicy.google.email = '';
    this.newPolicy.emailAddress = '';
    this.newPolicy.password = '';
  }



  public handleAddressChange(address : Address) {
    if (address instanceof FocusEvent){
      // Do not do anything if the user did not select a location properly already
      if (this.selectedLocation == '') { return; }

      // Did the user manually change the location?
      let currentAddress = this.placesRef.el.nativeElement.value;
      if (this.selectedLocation.formatted_address != currentAddress){
        //They did manually change the location.  Blank the selectedLocation
        this.selectedLocation = '';
      }
    } else {
      this.selectedLocation = address;
    }
  }


  
  public policyDetailsAreValid(){
    return (!(Object.keys(this.selectedLocation).length === 0 && this.selectedLocation.constructor === Object));
  }
  
  
  createPolicy() {
    this.newPolicy.startDate = this.currentMinDate;
    this.newPolicy.startDateISOString = this.getUTCDateISOString(this.newPolicy.startDate);
    this.newPolicy.endDate = this.currentMaxDate;
    this.newPolicy.endDateISOString = this.getUTCDateISOString(this.newPolicy.endDate);

    //if (this.newPolicy.policyHolder.policyHolderID == ''){
    //  this.newPolicy.emailAddress = this.emailControl.nativeElement.value;
    //  this.newPolicy.password = this.passwordControl.nativeElement.value;
    //} 

    this.newPolicy.coveredCity.name = this.selectedLocation.formatted_address;
    this.newPolicy.coveredCity.latitude = this.selectedLocation.geometry.location.lat();
    this.newPolicy.coveredCity.longitude = this.selectedLocation.geometry.location.lng();

    this.policyService
      .createPolicy(this.newPolicy)
      .subscribe(
        data => {
          console.log("Added policy.");
          global_this.router.navigate(['/signup/step5']);  
        },
        err => {
          console.log(err);
          global_this.router.navigate(['/signup/error']); 
        }
      );

    this.router.navigate(['/signup/step4']);
  }


  getUTCDateISOString(date : Date) : string {
    return (new Date(Date.UTC(date.getFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))).toISOString();
  }




  displayErrorNotice(message: string, action: string) {
    //this.errorBar.open(message, action, {
    //  duration: 2000,
    //});
    console.log(message + ' : ' + action);
  }


}
