
import { Component, OnInit, ViewEncapsulation, ViewChild  } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { Router } from '@angular/router';
import { Policy } from './policy';
import { PolicyService } from './policies.service';


//declare var window: any;
//declare var FB: any;

let global_this : any;


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


  minDate : Date = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate());
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
    if (window.location.hostname == 'localhost' ) { this.federatedLoginBaseURL = 'http://localhost:8088'; }

    // Another hack to allow event handlers to gain access to proper 'this' context
    global_this = this; 
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
    this.newPolicy.policyHolder.policyHolderID = '';
    this.newPolicy.facebook.id = '';
    this.newPolicy.facebook.name = '';
    this.newPolicy.emailAddress = '';
    this.newPolicy.password = '';
    this.emailFormControl.setValue('');
    this.passwordFormControl.setValue('');
    this.emailFormControl.enable();
    this.passwordFormControl.enable();
  }




  loginWithFacebook(eventData : any) : any {
    eventData.preventDefault();
    this.newPolicy.policyHolder.policyHolderID = '';
    this.newPolicy.facebook.id = '';
    this.newPolicy.facebook.name = '';
    this.newPolicy.emailAddress = '';
    this.newPolicy.password = '';

    window.addEventListener("message", this.handleFacebookLogin, false);
    window.open(this.federatedLoginBaseURL+'/auth/facebook', 'authenticator', 'menubar=no,location=no,status=no,toolbar=no,width=200px,height=150px');
  }

  handleFacebookLogin(event:any) {
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
        global_this.newPolicy.facebook.id = event.data.facebookID;
        global_this.newPolicy.facebook.name = event.data.policyHolderName;
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
          this.router.navigate(['/home']);
        },
        err => {
          this.displayErrorNotice('Network error, try again later', '');
          console.log(err);
        }
      );
  }


  getUTCDateISOString(date : Date) : string {
    return (new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0))).toISOString();
  }




  displayErrorNotice(message: string, action: string) {
    this.errorBar.open(message, action, {
      duration: 2000,
    });
  }


}
