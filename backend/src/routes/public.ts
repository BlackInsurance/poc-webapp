import * as uuidBase62 from 'uuid-base62';
import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as sendgrid from '@sendgrid/mail';

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

    // Validate the values provided are in the accepted range
    var today = new Date();
    var minimumStartDate = new Date();
    minimumStartDate.setHours(today.getHours() - 1);
    var maximumEndDate = new Date(2018, 9, 1);

    try{
        var providedStartDate = new Date(req.body.startDate);
        var providedEndDate = new Date(req.body.endDate);

        if ( providedStartDate.getTime() < minimumStartDate.getTime() || providedStartDate.getTime() > maximumEndDate.getTime()) {
            console.log("Error: bad start date");
            res.status(400);
            res.send({error: 'Start date is not in acceptable range of TODAY ===> OCT-01-2018'});
            return;
        }

        if ( providedEndDate.getTime() < minimumStartDate.getTime() || providedEndDate.getTime() > maximumEndDate.getTime() ) {
            console.log("Error: bad end date");
            res.status(400);
            res.send({error: 'End date is not in acceptable range of TODAY ===> OCT-01-2018'});
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
    let __this = this;
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
                newPolicyHolder.confirmationID = uuidBase62.v4();

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
                        __this.sendConfirmationEmail(newPolicyHolder.confirmationID, newPolicyHolder.email);

                        const signedToken = __this.createJWT(newPolicyHolder.email, newPolicyHolder.policyHolderID);                 
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


  /**
   * The PolicyHolder Confirmation route.
   *
   * @class PublicRoute
   * @method confirmPolicyHolder
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @param next {NextFunction} Execute the next method.
   */
  public confirmPolicyHolder(req: Request, res: Response, next: NextFunction) {

    let __this = this;
    let Policy = this.policyModel;
    let PolicyHolder = this.policyHolderModel;
    let _confirmationID : string  = req.body.confirmationID.toString();
    
    PolicyHolder.findOne({confirmationID:_confirmationID})
        .exec( (err, policyHolder:any)=>{

            if (err) {
                console.log('Failed while attempting to retrieve a specific Policy from the DB');
                console.log(err);
                res.status(400).send({error:'Failed while attempting to retrieve a specific Policy from the DB. ERROR-MESSAGE: '+err});
                return;
            }

            // 'confirmationID':req.body.confirmationID
            console.log(policyHolder);

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
                            res.send(policy);
                        });
                    } else {
                        res.send(policy);
                    }
                });
        });
  }



  private createJWT(_email:string, _policyHolderID:string) : string {
    let endOfYear = (new Date( (new Date()).getFullYear(), 11, 31));
    const rawToken = { 
        "sub" : _email,
        "exp" : endOfYear.getTime(),
        "iat" : (new Date()).getTime(),
        "jti" : _policyHolderID
    };

    const jwtSigningKey = (process.env.JWT_SIGNING_KEY || 'secret');
    const signedToken = jwt.sign(rawToken, jwtSigningKey);

    return signedToken;
  }



  private sendConfirmationEmail(confirmationID:string, email:string){
    sendgrid.setApiKey(process.env.SEND_GRID_API_KEY);
    sendgrid.setSubstitutionWrappers('<%', '%>'); // Configure the substitution tag wrappers globally
    const message = {
      to: email,
      from: 'info@black.insure',
      subject: 'Confirm your "Rainy Day Insurance" policy',
      templateId: '90d9dd7d-62c3-429d-ae69-911032182fc2',
      substitutions: {
        body: '',
        confirmationLink: 'http://localhost:8000/confirm/' + confirmationID,
      },
    };
    sendgrid.send(message);
    console.log('sent a confirmation email');
  }


}
