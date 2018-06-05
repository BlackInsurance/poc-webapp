"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const passportLocal = require("passport-local");
var LocalStrategy = passportLocal.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const public_1 = require("./routes/public");
const secure_1 = require("./routes/secure");
const model_1 = require("../shared/models/model");
const policy_1 = require("../shared/models/policy");
const policyHolder_1 = require("../shared/models/policyHolder");
class Server {
    static bootstrap() {
        return new Server();
    }
    constructor() {
        this.dataModel = new model_1.CORE_DATA_MODEL();
        this.app = express();
        this.app.use(passport.initialize());
        this.config();
        this.routes();
        this.api();
    }
    api() {
    }
    config() {
        this.app.use(express.static(path.join(__dirname, "../public")));
        this.app.set("views", path.join(__dirname, "../dist/views"));
        this.app.set("view engine", "jade");
        this.app.use(logger("dev"));
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cookieParser("SECRET_GOES_HERE"));
        this.app.use(methodOverride());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Expose-Headers', 'Authorization');
            next();
        });
        global.Promise = require("q").Promise;
        mongoose.Promise = global.Promise;
        const MONGODB_CONNECTION = 'mongodb://127.0.0.1/poc';
        let connection = mongoose.createConnection(MONGODB_CONNECTION);
        this.policyModel = connection.model("Policy", policy_1.policySchema);
        this.policyHolderModel = connection.model("PolicyHolder", policyHolder_1.policyHolderSchema);
        let PolicyHolder = this.policyHolderModel;
        passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, (email, password, cb) => {
            return PolicyHolder.findOne({ "email": email })
                .then((existingPolicyHolder) => {
                if (!existingPolicyHolder) {
                    return cb(null, false, { message: 'Incorrect email' });
                }
                return PolicyHolder.findOne({ "email": email, "password": password });
            }).then((policyHolder) => {
                console.log(policyHolder);
                if (!policyHolder) {
                    return cb(null, false, { message: 'Incorrect password' });
                }
                return cb(null, policyHolder, { message: 'Logged In Successfully' });
            })
                .catch(err => cb(err));
        }));
        passport.use(new JWTStrategy({
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'secret'
        }, (jwtPayload, cb) => { return cb(null, jwtPayload); }));
        this.app.use(function (err, req, res, next) {
            err.status = 404;
            next(err);
        });
        this.app.use(errorHandler());
    }
    routes() {
        console.log("Creating all public routes.");
        this.app.get('/policies', (req, res, next) => {
            new public_1.PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).getPolicyList(req, res, next);
        });
        this.app.get("/", (req, res, next) => {
            new public_1.PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).index(req, res, next);
        });
        this.app.post("/login", (req, res, next) => {
            new public_1.PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).login(req, res, next);
        });
        this.app.post('/policy', (req, res, next) => {
            new public_1.PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).createNewPolicy(req, res, next);
        });
        console.log("Creating all JWT-requiring routes.");
        this.app.get('/secured', passport.authenticate('jwt', { session: false }), (req, res, next) => {
            res.json({ "message": "logged in securely", "user": req.user.sub });
        });
        this.app.post("/policySecureRead", passport.authenticate('jwt', { session: false }), (req, res, next) => {
            new secure_1.SecuredRoute(this.dataModel, this.policyModel, this.policyHolderModel).getPolicy(req, res, next);
        });
        this.app.patch('/policy', passport.authenticate('jwt', { session: false }), (req, res, next) => {
            new secure_1.SecuredRoute(this.dataModel, this.policyModel, this.policyHolderModel).setEthereumAddressForPolicy(req, res, next);
        });
    }
}
exports.Server = Server;
