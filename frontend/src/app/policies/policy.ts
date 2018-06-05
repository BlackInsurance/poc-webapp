

export class Policy {
    
    public policyID: string;
    public emailAddress: string;
    public password: string;
    public coveredCity: any = {
        name: 'Talinn, Estonia',
        latitude: 59.4369608,
        longitude: 24.7535747
    };
    public createDate: Date;
    public startDate: Date;
    public endDate: Date = new Date(2018, 7, 1);
    public lastClaimDate: Date;
    public status: string;
    public ethereumAddress: string;
    public policyHolder: any = {
        policyHolderID: ''
    };
    public claims: Array<any> = [];


    public product: any = {
        productID: 'RAINY_DAY_INSURANCE',
        creator: 'BLACK_INSURANCE_MANAGER',
        name: 'Rainy Day Insurance',
        description: 'Insurance that will pay you 1 BLCK token each day that the city covered by an active Policy receives 10mm or more of rain within a 24 hour period.  Max coverage of 100 BLCK for any single Policy.',
        productDetailURL: 'https://wwww.black.insure/'
    };
    public issuingBroker: any = {
        participantID: 'BROKER',
        type: 'Broker',
        email: 'poc@black.insure',
        balanceBLCK: 0
    };

    constructor(
        _id: string,
        _emailAddress : string,
        _password: string,
        _coveredCityName: string
    ){
        this.policyID = _id;
        this.emailAddress = _emailAddress;
        this.password = _password;
        this.coveredCity.name = _coveredCityName;
    } 

    static CreateDefault(): Policy {
        return new Policy('', '', '', '');
    }
}


