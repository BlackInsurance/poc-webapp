import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as errorHandler from 'errorhandler';
import * as methodOverride from 'method-override';
import * as logger from "morgan";
import * as path from "path";
import * as cors from 'cors';
import * as express from "express";
import { Application, NextFunction, Request, Response, Router } from "express";
import mongoose = require('mongoose');

import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import * as passportLocal from 'passport-local';

import LocalStrategy = passportLocal.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;



// Routes
import { PublicRoute } from './routes/public';
import { SecuredRoute } from './routes/secure';


// Data Models
import { CORE_DATA_MODEL } from '../shared/models/model';
import { IPolicy, IPolicyModel, policySchema } from '../shared/models/policy';
import { IPolicyHolder, IPolicyHolderModel, policyHolderSchema } from '../shared/models/policyHolder';


/**
 * The server.
 *
 * @class Server
 */
export class Server {

  public app: Application;

  public db: mongoose.Connection;
  private policyModel?: mongoose.Model<IPolicyModel>;
  private policyHolderModel?: mongoose.Model<IPolicyHolderModel>;

  private dataModel: CORE_DATA_MODEL;
  //private passport: any;


  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    //default data model
    this.dataModel = new CORE_DATA_MODEL();

    //create expressjs application
    this.app = express();

    //default authentication / authorization module
    //this.passport = passport;
    this.app.use(passport.initialize());

    //configure application
    this.config();

    //add routes
    this.routes();

    //add api
    this.api();
  }

  /**
   * Create REST API routes
   *
   * @class Server
   * @method api
   */
  public api() {
    //empty for now
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    //add static paths
    this.app.use(express.static(path.join(__dirname, "../public")));
  
    //configure jade
    this.app.set("views", path.join(__dirname, "../dist/views"));
    this.app.set("view engine", "jade");
  
    //use logger middlware
    this.app.use(logger("dev"));

    //enable CORS for different OAuth protocols between UI and server
    this.app.use(cors());
  
    //use json form parser middlware
    this.app.use(bodyParser.json());
  
    //use query string parser middlware
    this.app.use(bodyParser.urlencoded({extended: true}));
  
    //use cookie parser middleware
    this.app.use(cookieParser("SECRET_GOES_HERE"));
  
    //use override middlware
    this.app.use(methodOverride());

    //make sure the Authorization header is allowed in all browser contexts
    this.app.use((req, res, next) => {
      res.header('Access-Control-Expose-Headers', 'Authorization');
      next();
    });
  
    //use q promises
    global.Promise = require("q").Promise;
    mongoose.Promise = global.Promise;

    // Setup Mongoose and the connection with MongoDB
    const MONGODB_CONNECTION: string = 'mongodb://127.0.0.1/poc';
    let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

    //create models
    this.policyModel = connection.model<IPolicyModel>("Policy", policySchema);
    this.policyHolderModel = connection.model<IPolicyHolderModel>("PolicyHolder", policyHolderSchema);
    let PolicyHolder = this.policyHolderModel;
    
    // Load the 'local' authentication option in Passport, allowing username/password login
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
      }, 
      (email, password, cb) => {
        return PolicyHolder.findOne({"email":email})
          .then((existingPolicyHolder) => {
            if (!existingPolicyHolder) {
              return cb(null, false, {message: 'Incorrect email'});
            }
            return PolicyHolder.findOne({"email":email, "password":password});            
          }).then((policyHolder) => {
            console.log(policyHolder);
            if (!policyHolder) {
              return cb(null, false, {message: 'Incorrect password'});
            }
            return cb(null, policyHolder, {message: 'Logged In Successfully'});
          })
          .catch(err => cb(err));
      }
    ));

    // Load the ability to understand / communicate JWT in Passport for request authorisation 
    passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'secret'
      },
      (jwtPayload, cb) => { return cb(null, jwtPayload); }
    ));

    //catch 404 and forward to error handler
    this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      err.status = 404;
      next(err);
    });

    //error handling
    this.app.use(errorHandler());

  }

  /**
   * Create router
   *
   * @class Server
   * @method routes
   */
  public routes() {
    // Add the public routes to the router and tell Express to use them
    console.log("Creating all public routes.");

    // DELETE THIS IMMEDIATELY - HUGE SECURITY HOLE
    this.app.get('/policies', (req: Request, res: Response, next: NextFunction) => {
        new PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).getPolicyList(req, res, next);
      });
    // DELETE THIS IMMEDIATELY - HUGE SECURITY HOLE
  
    //add home page route
    this.app.get("/", (req: Request, res: Response, next: NextFunction) => {
      new PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).index(req, res, next);
    });

    //add login route
    this.app.post("/login", (req: Request, res: Response, next: NextFunction) => {
      new PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).login(req, res, next);
    });

    //add new policy creation route
    this.app.post('/policy', (req: Request, res: Response, next: NextFunction) => {
        new PublicRoute(this.dataModel, this.policyModel, this.policyHolderModel).createNewPolicy(req, res, next);
    });

    // Add the secure routes to the router and tell Express to use them, and expect a valid JWT
    console.log("Creating all JWT-requiring routes.");

    // DELETE THIS IMMEDIATELY - FOR TESTING ONLY
    this.app.get('/secured', passport.authenticate('jwt', {session:false}), (req: any, res: Response, next: NextFunction) => {
        res.json({"message":"logged in securely","user":req.user.sub});
    });
    // DELETE THIS IMMEDIATELY - FOR TESTING ONLY

    // Get a specific Policy.  
    // Using POST instead of GET, so policyID is not included in the URL/Querystring
    // Want to hide policyID's from intermediate systems (Proxies, Caches, Firewalls, etc)
    this.app.post("/policySecureRead", passport.authenticate('jwt', {session:false}), (req: Request, res: Response, next: NextFunction) => {
        new SecuredRoute(this.dataModel, this.policyModel, this.policyHolderModel).getPolicy(req, res, next);
    });

    // Update the Ethereum address for a specific Policy
    this.app.patch('/policy', passport.authenticate('jwt', {session:false}), (req: Request, res: Response, next: NextFunction) => {
        new SecuredRoute(this.dataModel, this.policyModel, this.policyHolderModel).setEthereumAddressForPolicy(req, res, next);
    });
  }
}


