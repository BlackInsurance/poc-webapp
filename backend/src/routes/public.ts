import * as uuidBase62 from 'uuid-base62';
import * as jwt from "jsonwebtoken";
import * as passport from "passport";

import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./baseRoute";
import { IPolicy, IPolicyModel, policySchema } from "../../shared/models/policy";
import { IPolicyHolder, IPolicyHolderModel, policyHolderSchema } from "../../shared/models/policyHolder";
import { CORE_DATA_MODEL } from '../../shared/models/model';


/**
 * All publicly available (unsecured) routes
 *
 * @class PublicRoute
 */
export class PublicRoute extends BaseRoute {


    /**
     * Constructor
     *
     * @class PublicRoute
     * @constructor
     */
    constructor(_dm: CORE_DATA_MODEL, _policyModel: any, _policyHolderModel: any) {
        super(_dm, _policyModel, _policyHolderModel);
    }



  /**
   * The home page route.
   *
   * @class PublicRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {
    //set custom title
    //this.title = "Some other title";

    //set options
    let options: Object = {
      "message": "Welcome to the Black Insurance - Rainy Day Insurance Game!"
    };

    //render template
    this.render(req, res, "index", options);
  }


  /**
   * The login route.
   *
   * @class PublicRoute
   * @method login
   * @param req {any} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public login(req, res: Response, next: NextFunction) {
    passport.authenticate('local', {session: false}, (err, policyHolder, info) => {
        if (err || !policyHolder) {
            return res.status(400).json( {
                existingAccount: (info && info.message=='Incorrect password'),
                error: err,
                message: info ? info.message : 'Login failed'
            });
        }

        const rawToken = { "sub" : policyHolder.policyHolderID };
        const signedToken = jwt.sign(rawToken, 'secret');

        res.setHeader('Authorization', signedToken);
        return res.json( {
            existingAccount: true,
            error: null,
            message: 'logged in'
        });
    })
    (req, res);
  }


  /**
   * The Policy List route....DELETE THIS IMMEDIATELY - HUGE SECURITY HOLE
   *
   * @class PublicRoute
   * @method getPolicyList
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public getPolicyList(req: Request, res: Response, next: NextFunction) {
    this.policyModel.find({}, function(err, policies){
        if (err) {
            console.log('Error: Failed to communicate with the DB. ErrorMessage=' + err.message);
            res.status(400);
            res.send({error: 'Failed to communicate with the DB. ErrorMessage=' + err.message});
            return;
        }

        if (policies.length == null){
            console.log('Error: Failed to locate the requested Policy.');
            res.status(404);
            res.send({error: 'Failed to locate the requested Policy'});
            return;
        }

        console.log("returning all policies.");
        res.send(policies);
    });
  }


  /**
   * The New Policy Creation route.
   *
   * @class PublicRoute
   * @method createNewPolicy
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public createNewPolicy(req: Request, res: Response, next: NextFunction) {

    // Validate the values provided are in the accepted range
    var today = new Date();
    var minimumStartDate = new Date();
    minimumStartDate.setHours(today.getHours() - 1);
    var maximumEndDate = new Date(2018, 7, 1);

    try{
        var providedStartDate = new Date(req.body.startDate);
        var providedEndDate = new Date(req.body.endDate);

        if ( providedStartDate < minimumStartDate || providedStartDate > maximumEndDate) {
            console.log("Error: bad start date");
            res.status(400);
            res.send({error: 'Start date is not in acceptable range of TODAY ===> AUG-01-2018'});
            return;
        }

        if ( providedEndDate < minimumStartDate || providedEndDate > maximumEndDate ) {
            console.log("Error: bad end date");
            res.status(400);
            res.send({error: 'End date is not in acceptable range of TODAY ===> AUG-01-2018'});
            return;
        }

        if ( !req.body.emailAddress ||  req.body.emailAddress.trim() == "" ) {
            console.log("Error: bad email address");
            res.status(400);
            res.send({error: 'Email address is blank'});
            return;
        }

        if ( !req.body.password || req.body.password.trim() == "" ) {
            console.log("Error: bad password");
            res.status(400);
            res.send({error: 'Password is blank'});
            return;
        }

        if ( !req.body.coveredCity.name ||  req.body.coveredCity.name.trim() == "" ||  !req.body.coveredCity.latitude || !req.body.coveredCity.longitude ) {
            console.log("Error: bad covered city");
            res.status(400);
            res.send({error: 'Covered city name, latitude, or longitude is blank'});
            return;
        }
    }catch(validationError){
        console.log('Error: failed while validating inputs. ErrorMessage=' + validationError.message);
        res.status(400);
        res.send({error: 'Failed while validating inputs.'});
        return;
    }

    // Look for the email address to see if this Policy already exists
    let Policy = this.policyModel;
    let PolicyHolder = this.policyHolderModel;
    Policy.find({})
        .where('policyHolder.email').equals(req.body.emailAddress)
        .exec(function(err, policies){
            if (err) { 
                console.log('Error: Could not search for existing Policies.  Email Address=' + req.body.emailAddress + ', ErrorMessage=' + err.message);
                res.status(400);
                res.send({error: 'Could not save or search for Policies'});   
            }
            
            if ( policies.length == 0 ) {  // No Policies found
                // Create a new PolicyHolder
                let newPolicyHolder: IPolicyHolder = CORE_DATA_MODEL.getDefaultPolicyHolder();
                newPolicyHolder.policyHolderID = uuidBase62.v4();
                newPolicyHolder.email = req.body.emailAddress;
                newPolicyHolder.password = req.body.password;

                return new PolicyHolder(newPolicyHolder).save(function(policyHolderError){
                    if (policyHolderError) {
                        console.log("policyHolder not saved!");
                        res.status(400);
                        res.send();
                        return;
                    }

                    console.log("policyHolder saved!");

                    // Create the new Policy
                    let newPolicy: IPolicy = CORE_DATA_MODEL.getDefaultPolicy();
                    newPolicy.policyID = uuidBase62.v4();
                    newPolicy.coveredCity.name = req.body.coveredCity.name;
                    newPolicy.coveredCity.latitude = req.body.coveredCity.latitude;
                    newPolicy.coveredCity.longitude = req.body.coveredCity.longitude;
                    newPolicy.startDate = req.body.startDate;
                    newPolicy.endDate = req.body.endDate;
                    newPolicy.policyHolder.policyHolderID = newPolicyHolder.policyHolderID;

                    return new Policy(newPolicy).save(function(policyErr) {
                        if (policyErr) {
                            console.log("policy not saved!");
                            res.status(400);
                            res.send();
                            return;
                        }

                        console.log("policy saved!");
                        const rawToken = { "sub" : newPolicyHolder.policyHolderID };
                        const signedToken = jwt.sign(rawToken, 'secret');
                
                        res.setHeader('Authorization', signedToken);
                        res.send(newPolicy);
                    });
                });
            } else {
                console.log('Error: This emaill address already has a Policy. Email Address:' + req.body.emailAddress);
                res.status(400);
                res.send({error: 'Email address already has a Policy'});
            }
        });
  }


}
