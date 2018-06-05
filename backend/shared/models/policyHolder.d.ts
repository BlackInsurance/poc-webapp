/// <reference types="mongoose" />
import { Document, Schema } from 'mongoose';
export interface IPolicyHolder {
    policyHolderID: string;
    email: string;
    password: string;
    balanceBLCK: Number;
}
export interface IPolicyHolderModel extends IPolicyHolder, Document {
}
export declare var policyHolderSchema: Schema;
