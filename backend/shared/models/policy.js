"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var claim_1 = require("./claim");
exports.policySchema = new mongoose_1.Schema({
    policyID: String,
    product: {
        productID: {
            type: String,
            required: true,
            default: 'RAINY_DAY_INSURANCE'
        },
        creator: {
            type: String,
            required: true,
            default: 'BLACK_INSURANCE_MANAGER'
        },
        name: {
            type: String,
            required: true,
            default: 'Rainy Day Insurance'
        },
        description: {
            type: String,
            required: true,
            default: 'Insurance that will pay you 1 BLCK token each day that the city covered by an active Policy receives 10mm or more of rain within a 24 hour period.  Max coverage of 100 BLCK for any single Policy.'
        },
        productDetailURL: {
            type: String,
            required: true,
            default: 'https://wwww.black.insure/'
        }
    },
    issuingBroker: {
        participantID: {
            type: String,
            required: true,
            default: 'BROKER'
        },
        type: {
            type: String,
            required: true,
            default: 'Broker'
        },
        email: {
            type: String,
            required: true,
            default: 'poc@black.insure'
        },
        balanceBLCK: {
            type: Number,
            required: true,
            default: 0
        }
    },
    policyHolder: {
        policyHolderID: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        required: true,
        default: "Pending"
    },
    createDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,
        default: Date.parse('08-01-2018')
    },
    lastClaimDate: {
        type: Date,
        required: false
    },
    coveredCity: {
        name: {
            type: String,
            required: true
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    ethereumAddress: {
        type: String,
        required: true,
        default: '0x3A539F08E864C721383b78C7c61A728422c7cbb0'
    },
    claims: {
        type: [claim_1.claimSchema],
        required: false,
        default: undefined
    }
});
exports.getPolicyFromDB = function (db, policyID) {
    var ClaimModel = db.model("Claim", claim_1.claimSchema);
    var PolicyModel = db.model("Policy", exports.policySchema);
    return PolicyModel.findOne({ 'policyID': policyID })
        .then(function (policy) {
        return Promise.resolve(policy);
    })
        .catch(function (err) {
        console.log('Failed while attempting to retrieve a specific Policy from the DB');
        console.log(err);
        return Promise.reject(err);
    });
};
exports.getPendingPolicies = function (db, batchSize) {
    var ClaimModel = db.model("Claim", claim_1.claimSchema);
    var PolicyModel = db.model("Policy", exports.policySchema);
    // Get any 'Pending' transactions from the DB
    return PolicyModel.find({ 'status': 'Pending' }).limit(batchSize)
        .then(function (policies) {
        if (policies) {
            return Promise.resolve(policies);
        }
        else {
            // No pending policies
            return Promise.resolve(new Array());
        }
    })
        .catch(function (err) {
        console.log('Failed while attempting to retrieve Pending Policies from the DB');
        console.log(err);
        return Promise.reject(err);
    });
};
