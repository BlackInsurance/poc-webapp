import * as uuidBase62 from 'uuid-base62';
import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as sendgrid from '@sendgrid/mail';

import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./baseRoute";
import { IPolicy, IPolicyModel, policySchema } from "../../shared/models/policy";
import { IPolicyHolder, IPolicyHolderModel, policyHolderSchema } from "../../shared/models/policyHolder";
import { CORE_DATA_MODEL } from '../../shared/models/model';
import { Promise } from 'mongoose';


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
  public index(publicweb:string, req: Request, res: Response, next: NextFunction) {
    console.log(publicweb);
    res.sendFile(`index.html`, { root: publicweb })
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
    let __this = this;
    passport.authenticate('local', {session: false}, (err, policyHolder, info) => {
        if (err || !policyHolder) {
            return res.status(400).json( {
                existingAccount: (info && info.message=='Incorrect password'),
                error: err,
                message: info ? info.message : 'Login failed'
            });
        }

        const signedToken = __this.createJWT(policyHolder.email, policyHolder.policyHolderID);                 
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
   * @param next {NextFunction} Execute the next method.
   */
  public createNewPolicy(req: Request, res: Response, next: NextFunction) {

    this.validateNewPolicy(req, res, next)
        .then((isValid)=> {
            if ( ! isValid ) { return; }

            // Look for the email address to see if this Policy already exists
            let __this = this;
            let Policy = this.policyModel;
            let PolicyHolder = this.policyHolderModel;

            if ( req.body.policyHolder.policyHolderID && req.body.policyHolder.policyHolderID.trim() != '' ) {
                // Create the new Policy
                let newPolicy: IPolicy = CORE_DATA_MODEL.getDefaultPolicy();
                newPolicy.policyID = uuidBase62.v4();
                newPolicy.coveredCity.name = req.body.coveredCity.name;
                newPolicy.coveredCity.latitude = req.body.coveredCity.latitude;
                newPolicy.coveredCity.longitude = req.body.coveredCity.longitude;
                newPolicy.startDateISOString = req.body.startDateISOString;
                newPolicy.endDateISOString = req.body.endDateISOString;
                newPolicy.status = 'Confirmed';
                newPolicy.policyHolder.policyHolderID = req.body.policyHolder.policyHolderID;

                return new Policy(newPolicy).save(function(policyErr) {
                    if (policyErr) {
                        console.log("policy not saved!");
                        res.status(400).send("policy not saved!");
                        return;
                    }

                    console.log("policy saved!");

                    // Get the existing policyHolder
                    PolicyHolder.find({})
                        .where('policyHolderID').equals(newPolicy.policyHolder.policyHolderID)
                        .exec(function(err, policyHolders){
                            if (err) { 
                                console.log('Error: Could not search for existing PolicyHolders.  PolicyHolderID=' + newPolicy.policyHolder.policyHolderID + ', ErrorMessage=' + err.message);
                                res.status(400).send({error: 'Could not search for existing PolicyHolders'}); 
                                return;  
                            }

                            const currentPolicyHolder = policyHolders[0];
                            const signedToken = __this.createJWT(currentPolicyHolder.facebook.name, currentPolicyHolder.policyHolderID);                 
                            res.setHeader('Authorization', signedToken);
                            res.send(newPolicy);
                        });

                });
            } else {
                // Create a new PolicyHolder
                let newPolicyHolder: IPolicyHolder = CORE_DATA_MODEL.getDefaultPolicyHolder();
                newPolicyHolder.policyHolderID = uuidBase62.v4();
                newPolicyHolder.email = req.body.emailAddress;
                newPolicyHolder.password = req.body.password;
                newPolicyHolder.confirmationID = uuidBase62.v4();

                return new PolicyHolder(newPolicyHolder).save(function(policyHolderError){
                    if (policyHolderError) {
                        console.log("policyHolder not saved!");
                        res.status(400).send("policyHolder not saved!");
                        return;
                    }

                    console.log("policyHolder saved!");

                    // Create the new Policy
                    let newPolicy: IPolicy = CORE_DATA_MODEL.getDefaultPolicy();
                    newPolicy.policyID = uuidBase62.v4();
                    newPolicy.coveredCity.name = req.body.coveredCity.name;
                    newPolicy.coveredCity.latitude = req.body.coveredCity.latitude;
                    newPolicy.coveredCity.longitude = req.body.coveredCity.longitude;
                    newPolicy.startDateISOString = req.body.startDateISOString;
                    newPolicy.endDateISOString = req.body.endDateISOString;
                    newPolicy.policyHolder.policyHolderID = newPolicyHolder.policyHolderID;

                    return new Policy(newPolicy).save(function(policyErr) {
                        if (policyErr) {
                            console.log("policy not saved!");
                            res.status(400).send("policy not saved!");
                            return;
                        }

                        console.log("policy saved!");
                        __this.sendConfirmationEmail(req, newPolicyHolder.confirmationID, newPolicyHolder.email);

                        const signedToken = __this.createJWT(newPolicyHolder.email, newPolicyHolder.policyHolderID);                 
                        res.setHeader('Authorization', signedToken);
                        res.send(newPolicy);
                    });
                });
            }
        });
  }


  public validateNewPolicy(req: Request, res: Response, next: NextFunction) : Promise<boolean> {

    return new Promise((resolve,reject)=>{
        // Validate the values provided are in the accepted range        
        var today = new Date();
        var minimumStartDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0));
        var maximumEndDate = new Date(Date.UTC(2018, 9, 1, 0, 0, 0));

        try{
            var providedStartDate = new Date(Date.parse(req.body.startDateISOString));
            var providedEndDate = new Date(Date.parse(req.body.endDateISOString));

            if ( providedStartDate.getTime() < minimumStartDate.getTime() || providedStartDate.getTime() > maximumEndDate.getTime()) {
                console.log("Error: bad start date");
                res.status(400).send({error: 'Start date is not in acceptable range of TODAY ===> OCT-01-2018.  PROVIDED:'+req.body.startDateISOString+' PROVIDED_NUMERIC:'+providedStartDate.getTime()+' MINIMUM_NUMERIC:'+minimumStartDate.getTime()+' MAXIMUM_NUMERIC:'+maximumEndDate.getTime()});
                resolve(false);
                return;
            }

            if ( providedEndDate.getTime() < minimumStartDate.getTime() || providedEndDate.getTime() > maximumEndDate.getTime() ) {
                console.log("Error: bad end date");
                res.status(400).send({error: 'End date is not in acceptable range of TODAY ===> OCT-01-2018.  PROVIDED:'+req.body.endDateISOString+' PROVIDED_NUMERIC:'+providedEndDate.getTime()+' MINIMUM_NUMERIC:'+minimumStartDate.getTime()+' MAXIMUM_NUMERIC:'+maximumEndDate.getTime()});
                resolve(false);
                return;
            }

            if ( !req.body.coveredCity.name ||  req.body.coveredCity.name.trim() == "" ||  !req.body.coveredCity.latitude || !req.body.coveredCity.longitude ) {
                console.log("Error: bad covered city");
                res.status(400).send({error: 'Covered city name, latitude, or longitude is blank'});
                resolve(false);
                return;
            }

            if ( req.body.policyHolder.policyHolderID && req.body.policyHolder.policyHolderID.trim() != '' ) {
                if ( req.body.facebook.id && req.body.facebook.id.trim() != '' ) {
                    if ( req.body.facebook.name && req.body.facebook.name.trim() == '' ) {
                        console.log("Error: facebook profile name is blank");
                        res.status(400).send({error: 'Facebook profile name is blank'});
                        resolve(false);
                        return;
                    }
                //} else if ( req.body.google.id && req.body.google.id.trim() != '' ) {
                //    if ( req.body.google.name && req.body.google.name.trim() != '' ) {
                //        console.log("Error: google profile name is blank");
                //        res.status(400);
                //        res.send({error: 'Google profile name is blank'});
                //        return false;
                //    }
                } else {
                    console.log("Error: facebook / google credentials are blank");
                    res.status(400).send({error: 'Facebook / Google credentials are blank'});
                    resolve(false);
                    return;
                }

                // Check if the existing policyHolder has an existing policy
                let Policy = this.policyModel;
                return Policy.find({})
                    .where('policyHolder.policyHolderID').equals(req.body.policyHolder.policyHolderID)
                    .exec(function(err, policies){
                        if (err) { 
                            console.log('Error: Could not search for existing Policies.  PolicyHolderID=' + req.body.policyHolder.policyHolderID + ', ErrorMessage=' + err.message);
                            res.status(400);
                            res.send({error: 'Could not search for existing Policies'}); 
                            resolve(false);
                            return;
                        }
                        
                        if ( policies.length > 0 ) {
                            console.log("Error: PolicyHolderID already associated with a Policy");
                            res.status(400).send({error: 'PolicyHolderID already associated with a Policy'});
                            resolve(false);
                            return;
                        } else {
                            resolve(true);
                            return;
                        }
                    });

            } else {
                if ( !req.body.emailAddress ||  req.body.emailAddress.trim() == "" ) {
                    console.log("Error: email address is blank");
                    res.status(400).send({error: 'Email address is blank'});
                    resolve(false);
                    return;
                }
        
                if ( !req.body.password || req.body.password.trim() == "" ) {
                    console.log("Error: password is blank");
                    res.status(400).send({error: 'Password is blank'});
                    resolve(false);
                    return;
                }

                // Check for an existing policyHolder
                let PolicyHolder = this.policyHolderModel;
                return PolicyHolder.find({})
                    .where('email').equals(req.body.emailAddress)
                    .exec(function(err, policyHolders){
                        if (err) { 
                            console.log('Error: Could not search for existing PolicyHolders.  Email Address=' + req.body.emailAddress + ', ErrorMessage=' + err.message);
                            res.status(400);
                            res.send({error: 'Could not search for existing PolicyHolders'}); 
                            resolve(false);
                            return;
                        }
                        
                        if ( policyHolders.length > 0 ) {
                            console.log("Error: Email address already associated with a Policy");
                            res.status(400).send({error: 'Email address already associated with a Policy'});
                            resolve(false);
                            return;
                        } else {
                            resolve(true);
                            return;
                        }
                    });
            }
        }catch(validationError){
            console.log('Error: failed while validating inputs. ErrorMessage=' + validationError.message);
            res.status(400).send({error: 'Failed while validating inputs.'});
            resolve(false);
            return;
        }
    });
  }


  /**
   * The PolicyHolder Confirmation route.
   *
   * @class PublicRoute
   * @method confirmPolicyHolder
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @param next {NextFunction} Execute the next method.
   */
  public confirmPolicyHolder(publicweb:string, req: Request, res: Response, next: NextFunction) {

    let __this = this;
    let Policy = this.policyModel;
    let PolicyHolder = this.policyHolderModel;
    let _confirmationID : string  = req.params.confirmationID;

    if ( _confirmationID == null || _confirmationID.toString().trim() == '' ){
        res.sendFile(`index.html`, { root: publicweb });
        return;
    }
    
    PolicyHolder.findOne({confirmationID:_confirmationID})
        .exec( (err, policyHolder:any)=>{

            if (err) {
                console.log('Failed while attempting to retrieve a specific Policy from the DB');
                console.log(err);
                res.status(400).send({error:'Failed while attempting to retrieve a specific Policy from the DB. ERROR-MESSAGE: '+err});
                return;
            }

            if ( ! policyHolder) { res.status(400).send({error:'Failed to find the requested Policy by Confirmation ID.'}); return; }

            let policyHolderID = policyHolder.policyHolderID;

            Policy.find({})
                .where('policyHolder.policyHolderID').equals(policyHolderID)
                .exec((policyErr, policies:any[])=>{
                    if ( ! policies || policies.length == 0 ) { res.status(400).send({error:'Failed to find the requested Policy by Confirmation ID.'}); return; }

                    if ( policyErr ){
                        console.log('Failed while attempting to retrieve a specific Policy from the DB');
                        console.log(policyErr);
                        res.status(400).send({error:'Failed while attempting to retrieve a specific Policy from the DB. ERROR-MESSAGE: '+policyErr});
                        return;
                    }

                    let policy = policies[0];

                    if ( policy.status == 'Unconfirmed' ){
                        policy.status = 'Confirmed';
                        
                        Policy.update({_id : policy.id}, policy, function(err) {
                            if (err) {
                                console.log('Failed while attempting to retrieve a specific Policy from the DB, specifically while marking the Policy as Confirmed.');
                                console.log(err);
                                res.status(400).send({error:'Failed while attempting to retrieve a specific Policy from the DB, specifically while marking the Policy as Confirmed. ERROR-MESSAGE: '+err});
                                return;
                            }

                            console.log('new policy confirmed');
                            const signedToken = __this.createJWT(policyHolder.email, policyHolder.policyHolderID);                
                            res.setHeader('Authorization', signedToken);
                            res.sendFile(`index.html`, { root: publicweb })
                        });
                    } else {
                        res.sendFile(`index.html`, { root: publicweb })
                    }
                });
        });
  }





  private sendConfirmationEmail(req: Request, confirmationID:string, email:string){
    sendgrid.setApiKey(process.env.SEND_GRID_API_KEY);
    sendgrid.setSubstitutionWrappers('<%', '%>'); // Configure the substitution tag wrappers globally
        
    const message = {
      to: email,
      from: 'info@black.insure',
      subject: 'Confirm your "Rainy Day Insurance" policy',
      templateId: '90d9dd7d-62c3-429d-ae69-911032182fc2',
      substitutions: {
        body: '',
        confirmationLink: 'https://' + req.get('host') + '/confirm/' + confirmationID,
      },
    };
    sendgrid.send(message);
    console.log('sent a confirmation email');
  }


}
