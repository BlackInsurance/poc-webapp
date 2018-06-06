
import { Component, OnInit, ViewEncapsulation, ViewChild  } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { Router } from '@angular/router';
import { Policy } from './policy';
import { PolicyService } from './policies.service';

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
  startDateControl = new FormControl('', [
    Validators.required
  ]);
  endDateControl = new FormControl('', [
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

  selectedLocation : string = '';
 

  public policyDetailsAreValid(){
    return (this.validDateMinimum('start') && 
            this.validDateMaximum('start') && 
            this.validDateMinimum('end') && 
            this.validDateMaximum('end') &&
            this.startDateControl.errors == null && 
            this.endDateControl.errors == null && 
            this.selectedLocation != '');
  }
  

  constructor(
    private policyService: PolicyService,
    private router: Router, 
    private errorBar: MatSnackBar
  ) { }

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
          console.log('successful login');
          console.log(data);
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





  displayErrorNotice(message: string, action: string) {
    this.errorBar.open(message, action, {
      duration: 2000,
    });
  }



  autoCompleteCallback(data: any): any {

    if ( data && data.reason && data.reason == 'Failed to get geo location' ) {
      this.displayErrorNotice('Browser could not find your "Current Location"', '');
      return;
    }

    this.selectedLocation = data.data;
    this.newPolicy.coveredCity.name = data.data.formatted_address;
    this.newPolicy.coveredCity.latitude = data.data.geometry.location.lat;
    this.newPolicy.coveredCity.longitude = data.data.geometry.location.lng;
  }
  
  createPolicy() {
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


}
