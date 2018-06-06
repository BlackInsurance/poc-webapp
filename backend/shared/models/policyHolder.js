"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
// Define a DB Schema.
exports.policyHolderSchema = new mongoose_1.Schema({
    policyHolderID: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    balanceBLCK: {
        type: Number,
        required: true,
        default: 0
    },
    confirmationID: {
        type: String,
        required: false,
        default: ''
    }
});
