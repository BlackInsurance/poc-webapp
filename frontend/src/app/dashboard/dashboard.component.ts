import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public colorScheme = {
    domain: ['#673ab7', '#f44336', '#009688 ', '#2196f3']
  }; 
  public autoScale = true;

  policy: any = {
    emailAddress: 'someone@gmail.com',
    coveredCity: { name: 'Talinn, Estonia'},
    startDate: new Date(2018, 5, 23),
    endDate: new Date(2018, 7, 1),
    status: 'Pending',
    ethereumAddress: '0x00000000000000000000000000000000000000000000000000000001',
    claims: [
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 29),
        rainLast24Hours: 12,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 28),
        rainLast24Hours: 15,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 17),
        rainLast24Hours: 11,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 16),
        rainLast24Hours: 14,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 15),
        rainLast24Hours: 17,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 10),
        rainLast24Hours: 11,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 4, 2),
        rainLast24Hours: 19,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 3, 30),
        rainLast24Hours: 13,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 3, 27),
        rainLast24Hours: 12,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 3, 26),
        rainLast24Hours: 11,
        settlement: {
          amount: 1
        }
      },
      {
        claimID: '234132da12cbaba21acab2ba6b7cc',
        claimDate: new Date(2018, 3, 24),
        rainLast24Hours: 15,
        settlement: {
          amount: 1
        }
      },
    ]
  };
  
  blckBalance : Number = 0;
  computeBLCKBalance(){
    this.blckBalance = this.policy.claims.reduce((accumulator,currentValue)=>{ 
        var currentAccumulatorValue = 0;
        if(typeof accumulator=='object') {
          currentAccumulatorValue = parseInt(accumulator.settlement.amount);
        } else {
          currentAccumulatorValue = parseInt(accumulator);
        }
        return currentAccumulatorValue + parseInt(currentValue.settlement.amount);});
  }

  daysSinceLastClaim : String = "N/A";
  computeDaysSinceLastClaim(){
      let daysSince = 0;
      let now = new Date();
      let claimSearchDate = Math.max.apply(null, this.policy.claims.map(function(e) {
        return new Date(e.claimDate);
      }));

      if (! isNaN(claimSearchDate) ){
        var timeDiff = Math.abs(now.getTime() - (new Date(claimSearchDate)).getTime());
        daysSince = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
      }

      this.daysSinceLastClaim = (daysSince==0)?'N/A':daysSince.toString();
  }

  daysRemainingForPolicy : Number = 0;
  computeDaysRemainingForPolicy(){
    var timeDiff = Math.abs((new Date()).getTime() - (new Date(this.policy.endDate)).getTime());
    this.daysRemainingForPolicy = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  }



  constructor() {

    this.computeBLCKBalance();
    this.computeDaysSinceLastClaim();
    this.computeDaysRemainingForPolicy();
  }

  onSelect(event) {
    console.log(event);
  }

  // project table
  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/projects.json`);
    req.onload = () => {
      cb(JSON.parse(req.response));
    };
    req.send();
  }
}
