import { suite, test } from 'mocha-typescript';
import { IPolicy, IPolicyModel, policySchema } from "../../shared/models/policy";
import mongoose = require("mongoose");


@suite('Policy Tests')
class PolicyTests {

    private currentPolicy: IPolicy;

    public static PolicyModel: mongoose.Model<IPolicyModel>;

    public static before(){
        //use q promises
        global.Promise = require("q").Promise;
        mongoose.Promise = global.Promise;
        
        //connect to mongoose and create model
        const MONGODB_CONNECTION: string = "mongodb://localhost:27017/poc";
        let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);
        PolicyTests.PolicyModel = connection.model<IPolicyModel>("Policy", policySchema);
        
        //require chai and use should() assertions
        let chai = require("chai");
        chai.should();
    }



    constructor() {}



    @test
    public createPolicyWithUsernamePassword(){
        let testRunID = (new Date()).toUTCString();
        let policy: IPolicy = {
            policyID: testRunID,
            product: {
                productID: 'RAINY_DAY_INSURANCE',
                creator: 'BLACK_INSURANCE_MANAGER',
                name: 'Rainy Day Insurance',
                description: 'Insurance that will pay you 1 BLCK token each day that the city covered by an active Policy receives 10mm or more of rain within a 24 hour period.  Max coverage of 100 BLCK for any single Policy.',
                productDetailURL: 'https://wwww.black.insure/'
            },
            issuingBroker: {
                participantID: 'BROKER',
                type: 'Broker',
                email: 'poc@black.insure',
                balanceBLCK: 0
            },
            policyHolder: {
                policyHolderID: '',
                email: '',
                password: '',
                balanceBLCK: 0,
                confirmationID: '',
                facebook: {
                    id: '',
                    token: '',
                    name: '',
                    email: ''
                },
                google: {
                    id: '',
                    token: '',
                    name: '',
                    email: ''
                }
            },
            status: 'Pending',
            createDateISOString: (new Date()).toISOString(),
            startDateISOString: (new Date()).toISOString(),
            endDateISOString: (new Date('10-01-2018')).toISOString(),
            lastClaimDateISOString: '',
            coveredCity: {
                name: 'Tampa, FL',
                latitude: 0.0,
                longitude: 0.0
            },
            ethereumAddress: '',
            claims: null
        };
    
        //create user and return promise
        return new PolicyTests.PolicyModel(policy).save().then(result => {
            //verify _id property exists
            result._id.should.exist;

            //verify policyHolderID
            //result.policyHolder.policyHolderID.should.equal(policy.policyHolder.policyHolderID);

            //verify covered city
            result.coveredCity.name.should.equal(policy.coveredCity.name);

            //verify start date
            result.startDateISOString.should.equal(policy.startDateISOString);

            //verify end date
            result.endDateISOString.should.equal(policy.endDateISOString);
        });
    }
}