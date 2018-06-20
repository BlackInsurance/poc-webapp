
import { Component, OnInit, ViewEncapsulation, ViewChild  } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { Router } from '@angular/router';
import { Policy } from './policy';
import { PolicyService } from './policies.service';



let global_this : any;
declare var FB: any;



export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export class LoginInformationValidator {
  public static loginInfoIsValid : boolean = true;
  static validLoginInfo(fc: FormControl){ return ( LoginInformationValidator.loginInfoIsValid ) ?  undefined : ({password_incorrect: true}); }
}


export function startDateAfterTodayValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    const selectedStartDate = control.value;
    const today = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate());

    if (selectedStartDate.getTime() < today.getTime()) {
      return { invalid_date: { 'earliestDate': today, 'selectedDate': selectedStartDate } };
    }

    return null;
  };
}

@Component({
  selector: 'newPolicy',
  templateUrl: './newPolicy.component.html',
  styleUrls: [ './newPolicy.component.scss' ]
})
export class NewPolicyComponent implements OnInit {


  newPolicy: Policy;


  @ViewChild('stepper') stepper;


  matcher = new MyErrorStateMatcher();

  federatedLoginBaseURL : string = window.location.protocol + '//' + window.location.host;
  federatedLoginJWT : string = '';
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
    LoginInformationValidator.validLoginInfo
  ]);
  hide = true;


  minDate : Date = new Date();
  currentMinDate : Date = this.minDate;
  maxDate : Date = new Date(2018, 9, 1);
  currentMaxDate : Date = this.maxDate;
  startDatePicker = new FormControl(this.minDate);
  endDatePicker = new FormControl(this.maxDate);
  startDateControl = new FormControl(this.minDate, [
    Validators.required
  ]);
  endDateControl = new FormControl(this.maxDate, [
    Validators.required
  ]);


  public validDateMinimum(dateControlName:string) : boolean{
    let dateValid = false;

    if ( dateControlName == 'start' ) {
      if (Object.prototype.toString.call(this.startDateControl.value) != '[object Date]') { 
        this.currentMinDate = this.minDate;
        return false; 
      }
      
      dateValid = (this.startDateControl.value.getTime() >= this.minDate.getTime());
      if ( dateValid ) { this.currentMinDate = this.startDateControl.value; }
    } else {
      if (Object.prototype.toString.call(this.endDateControl.value) != '[object Date]') { 
        this.currentMaxDate = this.maxDate;
        return false; 
      }

      dateValid = (this.endDateControl.value.getTime() >= this.currentMinDate.getTime());
      if ( dateValid ) { this.currentMaxDate = this.endDateControl.value; }
    }

    return dateValid;
  }
  public validDateMaximum(dateControlName:string) : boolean{
    let dateValid = false;

    if ( dateControlName == 'start' ) {
      if (Object.prototype.toString.call(this.startDateControl.value) != '[object Date]') { 
        this.currentMinDate = this.minDate;
        return false; 
      }
      
      dateValid = (this.startDateControl.value.getTime() <= this.currentMaxDate.getTime());
      if ( dateValid ) { this.currentMinDate = this.startDateControl.value; }
    } else {
      if (Object.prototype.toString.call(this.endDateControl.value) != '[object Date]') { 
        this.currentMaxDate = this.maxDate;
        return false; 
      }

      dateValid = (this.endDateControl.value.getTime() <= this.maxDate.getTime());
      if ( dateValid ) { this.currentMaxDate = this.endDateControl.value; }
    }

    return dateValid;
  }

  selectedLocation : any = {};
 

  constructor(
    private policyService: PolicyService,
    private router: Router, 
    private errorBar: MatSnackBar
  ) { 

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




  public loginInProgress : boolean = false;

  public resetLoginValidation(evt) {
    if ( !LoginInformationValidator.loginInfoIsValid ) {
      LoginInformationValidator.loginInfoIsValid = true;
      this.passwordFormControl.updateValueAndValidity();
    }
  }

  public userPassLogin : boolean = false;
  public verifyLoginInformation() {
    this.loginInProgress = true;

    this.policyService
      .checkLoginCredentials(this.emailFormControl.value, this.passwordFormControl.value)
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
              LoginInformationValidator.loginInfoIsValid = false;
              this.passwordFormControl.updateValueAndValidity();
            } else if ( err.error.message == 'Incorrect email' ) {
              // This email does not exist, so we are creating a new account
              this.newPolicy.emailAddress = this.emailFormControl.value;
              this.newPolicy.password = this.passwordFormControl.value;
              this.userPassLogin = true;
              this.stepper.selectedIndex = 2;              
            } else {
              // Systemic Error.  Display a dialog
              this.displayErrorNotice('Network Error, try again later', '');
            }
          }

          return false;
        }
      );
  }

  public resetSecurityInfo(){
    this.userPassLogin = false;
    this.clearPolicyHolderCredentials();
    this.emailFormControl.setValue('');
    this.passwordFormControl.setValue('');
    this.emailFormControl.enable();
    this.passwordFormControl.enable();
  }

  private clearPolicyHolderCredentials(){
    this.newPolicy.policyHolder.policyHolderID = '';
    this.newPolicy.facebook.id = '';
    this.newPolicy.facebook.name = '';
    this.newPolicy.google.id = '';
    this.newPolicy.google.name = '';
    this.newPolicy.google.email = '';
    this.newPolicy.emailAddress = '';
    this.newPolicy.password = '';
  }


  recaptchaSuccess(response:any) {
    let testVar = '';
    testVar = response;
    alert(testVar);
  }

  recaptchaError(error:any) {
    let testVar = '';
    testVar = error;
    alert(testVar);
  }


  loginWithFacebook(eventData : any) : any {
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
                global_this.emailFormControl.disable();
                global_this.passwordFormControl.disable();
                global_this.stepper.selectedIndex = 2;  
              }
            },
            err => {
              console.log(err);
              global_this.displayErrorNotice( (err.json ? err.json().error : err || 'Server error', ''));
            });

      } else {
        global_this.displayErrorNotice('WARNING: Login cancelled');
      }
    }, {scope: 'email'}); 
  }



  loginWithGoogle(eventData : any) : any {
    eventData.preventDefault();
    this.clearPolicyHolderCredentials();

    window.addEventListener("message", this.handleGoogleLogin, false);
    window.open(this.federatedLoginBaseURL+'/auth/google', 'authenticator', 'menubar=no,location=no,status=no,toolbar=no,width=650px,height=650px');
  }

  handleGoogleLogin(event:any) {
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
        global_this.emailFormControl.disable();
        global_this.passwordFormControl.disable();
        global_this.stepper.selectedIndex = 2;  
      }
    } 
  }
  


  autoCompleteCallback(data: any): any {
    if ( data && data.reason && data.reason == 'Failed to get geo location' ) {
      this.displayErrorNotice('Your browser cannot determine your Current Location', '');
      return;
    }

    this.selectedLocation = data.data;
  }


  public policyDetailsAreValid(){
    return (this.validDateMinimum('start') && 
            this.validDateMaximum('start') && 
            this.validDateMinimum('end') && 
            this.validDateMaximum('end') &&
            this.startDateControl.errors == null && 
            this.endDateControl.errors == null && 
            !(Object.keys(this.selectedLocation).length === 0 && this.selectedLocation.constructor === Object));
  }
  
  
  createPolicy() {
    this.newPolicy.startDate = this.startDateControl.value;
    this.newPolicy.startDateISOString = this.getUTCDateISOString(this.newPolicy.startDate);
    this.newPolicy.endDate = this.endDateControl.value;
    this.newPolicy.endDateISOString = this.getUTCDateISOString(this.newPolicy.endDate);

    if (this.newPolicy.policyHolder.policyHolderID == ''){
      this.newPolicy.emailAddress = this.emailFormControl.value;
      this.newPolicy.password = this.passwordFormControl.value;
    } 

    this.newPolicy.coveredCity.name = this.selectedLocation.formatted_address;
    this.newPolicy.coveredCity.latitude = this.selectedLocation.geometry.location.lat;
    this.newPolicy.coveredCity.longitude = this.selectedLocation.geometry.location.lng;

    this.policyService
      .createPolicy(this.newPolicy)
      .subscribe(
        data => {
          console.log("Added policy.");
          global_this.stepper.selectedIndex = 3;  
          setTimeout(()=>{this.router.navigate(['/home']);}, 10000);
        },
        err => {
          this.displayErrorNotice('Network error, try again later', '');
          console.log(err);
        }
      );
  }


  getUTCDateISOString(date : Date) : string {
    return (new Date(Date.UTC(date.getFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))).toISOString();
  }




  displayErrorNotice(message: string, action: string) {
    this.errorBar.open(message, action, {
      duration: 2000,
    });
  }


}
