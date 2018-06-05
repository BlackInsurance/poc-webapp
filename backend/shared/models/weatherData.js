"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
// Define a DB Schema.
exports.weatherDataSchema = new mongoose_1.Schema({
    timeRecorded: {
        type: Date,
        required: true,
        default: Date.now
    },
    weatherLocation: {
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
    },
    highTempLast24Hours: {
        type: Number,
        required: true
    },
    rainLast24Hours: {
        type: Number,
        required: true
    },
    cloudsLast24Hours: {
        type: Number,
        required: true
    },
    highWaveLast24Hours: {
        type: Number,
        required: true
    }
});
