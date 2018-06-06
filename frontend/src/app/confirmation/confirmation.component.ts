import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Policy } from '../policies/policy';
import { PolicyService } from '../policies/policies.service';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styles: ['./cofirmation.component.scss']
})
export class ConfirmationComponent {


  constructor(
    private policyService: PolicyService,
    private router: Router, 
    private route: ActivatedRoute
  ) {

  }


  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      let confirmationID = params['confirmationID'];
      this.policyService.confirmPolicyHolder(confirmationID).subscribe(
        data => {
          console.log('Confirmation succeeded');
          this.router.navigate(['/home']);
        },
        err => {
          console.log('Confirmation failed');
          this.router.navigate(['/signup']);
        }
      );
    });
  }
  


}
