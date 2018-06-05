"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_typescript_1 = require("mocha-typescript");
const policy_1 = require("../../shared/models/policy");
const mongoose = require("mongoose");
let PolicyTests = PolicyTests_1 = class PolicyTests {
    constructor() { }
    static before() {
        global.Promise = require("q").Promise;
        mongoose.Promise = global.Promise;
        const MONGODB_CONNECTION = "mongodb://localhost:27017/poc";
        let connection = mongoose.createConnection(MONGODB_CONNECTION);
        PolicyTests_1.PolicyModel = connection.model("Policy", policy_1.policySchema);
        let chai = require("chai");
        chai.should();
    }
    createPolicyWithUsernamePassword() {
        let testRunID = (new Date()).toUTCString();
        let policy = {
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
                policyHolderID: testRunID
            },
            status: 'Pending',
            createDate: new Date(),
            startDate: new Date(),
            endDate: new Date('08-01-2018'),
            lastClaimDate: null,
            coveredCity: {
                name: 'Tampa, FL',
                latitude: 0.0,
                longitude: 0.0
            },
            ethereumAddress: '0x3A539F08E864C721383b78C7c61A728422c7cbb0',
            claims: null
        };
        return new PolicyTests_1.PolicyModel(policy).save().then(result => {
            result._id.should.exist;
            result.policyHolder.policyHolderID.should.equal(policy.policyHolder.policyHolderID);
            result.coveredCity.name.should.equal(policy.coveredCity.name);
            result.startDate.should.equal(policy.startDate);
            result.endDate.should.equal(policy.endDate);
        });
    }
};
__decorate([
    mocha_typescript_1.test
], PolicyTests.prototype, "createPolicyWithUsernamePassword", null);
PolicyTests = PolicyTests_1 = __decorate([
    mocha_typescript_1.suite('Policy Tests')
], PolicyTests);
var PolicyTests_1;
