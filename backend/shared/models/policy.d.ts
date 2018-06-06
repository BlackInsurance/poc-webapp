/// <reference types="mongoose" />
import { Document, Schema } from 'mongoose';
import * as mongoose from 'mongoose';
import { IClaim } from './claim';
export interface IPolicy {
    policyID: string;
    product: {
        productID: string;
        creator: string;
        name: string;
        description: string;
        productDetailURL: string;
    };
    issuingBroker: {
        participantID: string;
        type: string;
        email: string;
        balanceBLCK: Number;
    };
    policyHolder: {
        policyHolderID: string;
    };
    status: string;
    createDate: Date;
    startDate: any;
    endDate: any;
    lastClaimDate: any;
    coveredCity: {
        name: string;
        latitude: Number;
        longitude: Number;
    };
    ethereumAddress: string;
    claims?: IClaim[];
}
export interface IPolicyModel extends IPolicy, Document {
}
export declare var policySchema: Schema;
export declare var getPolicyFromDB: (db: mongoose.Connection, policyID: string) => Promise<Document | null>;
export declare var getPolicyByConfirmationFromDB: (db: mongoose.Connection, confirmationID: string) => Promise<Document | null>;
export declare var getConfirmedPolicies: (db: mongoose.Connection, batchSize: number) => Promise<any[]>;
