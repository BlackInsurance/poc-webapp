
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { Component, OnInit, ViewEncapsulation, ViewChild  } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';

import { Policy } from '../policies/policy';
import { PolicyService } from '../policies/policies.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public currentUserEmailAddress : string = '';
  public currentUserPolicyLocation : string = '';
  public policy: Policy;

  blckBalance : number = 0;
  computeBLCKBalance(){
    if (this.policy.claims == null || this.policy.claims.length == 0){
      this.blckBalance = 0;
    } else {
      let accumuatedBalance : number = 0;
      for(let i = 0; i < this.policy.claims.length; i++) {
        accumuatedBalance += parseInt(this.policy.claims[i].settlement.amount);
      }
      this.blckBalance = accumuatedBalance;
    }
  }

  daysSinceLastClaim : String = '0';
  computeDaysSinceLastClaim(){
      let daysSince = 0;
      let now = new Date();
      let claimSearchDate = Math.max.apply(null, this.policy.claims.map(function(e) {
        return new Date(e.claimDateISOString);
      }));

      if (! isNaN(claimSearchDate) && (claimSearchDate != Number.NEGATIVE_INFINITY) ){
        var timeDiff = Math.abs(now.getTime() - (new Date(claimSearchDate)).getTime());
        daysSince = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
      }

      this.daysSinceLastClaim = (daysSince==0)?'0':daysSince.toString();
  }

  daysRemainingForPolicy : number = 0;
  computeDaysRemainingForPolicy(){
    var timeDiff = Math.abs((new Date()).getTime() - (new Date(this.policy.endDateISOString)).getTime());
    this.daysRemainingForPolicy = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  }
  
  @ViewChild('ethereumAddressControl') ethereumAddressControl;


  constructor(
    private policyService: PolicyService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router, 
    private route: ActivatedRoute
  ) {

    this.policy = Policy.CreateDefault();
    this.currentUserEmailAddress = policyService.getCurrentUserEmail();
    this.currentUserPolicyLocation = policyService.getCurrentPolicyLocation();

    this.computeBLCKBalance();
    this.computeDaysSinceLastClaim();
    this.computeDaysRemainingForPolicy();
  }


  ngOnInit() {
    this.loadPolicy();
  }
  
  loadPolicy(){
    this.policyService.getPolicyForCurrentUser().subscribe(
      data => {
         this.policy = data;
         this.policy.startDate = new Date(Date.parse(this.policy.startDateISOString));
         this.policy.startDate.setMinutes(this.policy.startDate.getTimezoneOffset());
         this.policy.endDate = new Date(Date.parse(this.policy.endDateISOString));
         this.policy.endDate.setMinutes(this.policy.endDate.getTimezoneOffset());

         if ( this.policy.claims == null ){
           this.policy.claims = new Array();
         } else {
           this.policy.claims.forEach( (value, index, self) => {
              value.claimDate =  new Date(Date.parse(value.claimDateISOString));
              value.claimDate.setMinutes(value.claimDate.getTimezoneOffset());
           });
         }

         this.computeBLCKBalance();
         this.computeDaysSinceLastClaim();
         this.computeDaysRemainingForPolicy();

         if ( this.policy.status != 'Active' ) {
           setTimeout(()=>{this.loadPolicy();}, 5000);
         }
      },
      err => {
        this.toastr.error('Please login again', 'Session timeout');
        console.log(err);
        this.router.navigate(['/signup/step2']); 
      });
  }


  savingEthereumAddress : boolean = false;
  saveEthereumAddress(){
    let global_this = this;
    this.policyService.setPolicyEthereumAddress(this.policy.policyID, this.ethereumAddressControl.nativeElement.value).subscribe(
      data => {
         let updatedData = data;
         global_this.savingEthereumAddress = false;
         this.toastr.success('Ethereum address updated', 'Success');
      },
      err => {
        console.log(err);
        global_this.savingEthereumAddress = false;
        if ( err.error.error == 'Ethereum Address does not meet formatting requirements or did not pass checksum validation' ) {
          this.toastr.error('Please verify and try again', 'Invalid Ethereum Address');
        } else {
          this.toastr.error('Please try again later', 'Network error');
        }
      });
        
    this.savingEthereumAddress = true;  
  }



  public toggleMobileClaimDetails(evt : any){
    let claimLabel = evt.target.parentElement.parentElement;
    let claimInfo = claimLabel.nextElementSibling;
    claimLabel.classList.toggle('shown');
    claimInfo.classList.toggle('show');
    evt.preventDefault();
    return false;
  }




    /**
     * Checks if the given string is an Ethereum address
     *
     * @method isValidAddress
     * @param {String} address the given HEX adress
     * @return {Boolean}
    */
   public isValidAddress(address: string) : boolean {
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            // check if it has the basic requirements of an address
            return false;
        } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
            // If it's all small caps or all all caps, return true
            return true;
        } else {
            // Otherwise check each case
            return true;
        }
    }


}
