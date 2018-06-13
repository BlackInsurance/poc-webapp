import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material';

import { Policy } from '../policies/policy';
import { PolicyService } from '../policies/policies.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public currentUserEmailAddress : string = '';
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

  daysSinceLastClaim : String = "N/A";
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

      this.daysSinceLastClaim = (daysSince==0)?'N/A':daysSince.toString();
  }

  daysRemainingForPolicy : number = 0;
  computeDaysRemainingForPolicy(){
    var timeDiff = Math.abs((new Date()).getTime() - (new Date(this.policy.endDateISOString)).getTime());
    this.daysRemainingForPolicy = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  }



  constructor(
    private policyService: PolicyService,
    private router: Router, 
    private route: ActivatedRoute,
    private errorBar: MatSnackBar
  ) {

    this.policy = Policy.CreateDefault();
    this.currentUserEmailAddress = policyService.getCurrentUserEmail();

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
        this.displayErrorNotice('Network error, try again later', '');
        console.log(err);
      });
  }



  displayErrorNotice(message: string, action: string) {
    this.errorBar.open(message, action, {
      duration: 2000,
    });
  }



}
