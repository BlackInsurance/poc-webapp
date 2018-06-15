
import * as uuidBase62 from 'uuid-base62';

import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import * as passportLocal from 'passport-local';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import * as passportGoogle from 'passport-google-oauth';

import LocalStrategy = passportLocal.Strategy;
import GoogleStrategy = passportGoogle.OAuth2Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

import mongoose = require('mongoose');

import { CORE_DATA_MODEL } from '../shared/models/model';
import { IPolicyHolder, IPolicyHolderModel, policyHolderSchema } from '../shared/models/policyHolder';



/**
 * Helper class used to configure all the authentication Strategies employed by passport.
 *
 * @class PassportLoader
 */
export class PassportLoader {



    public static configure(_passport:passport, _policyHolderModel:mongoose.Model<IPolicyHolderModel>){

        // Load the 'local' authentication option in Passport, allowing username/password login
        _passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, 
        (email, password, cb) => {
            return _policyHolderModel.findOne({"email":email})
                .then((existingPolicyHolder) => {
                    if (!existingPolicyHolder) {
                        return cb(null, false, {message: 'Incorrect email'});
                    }
                    return _policyHolderModel.findOne({"email":email, "password":password});            
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

        // Load the ability to understand / communicate JWT in Passport for request authorization 
        _passport.use(new JWTStrategy({
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: (process.env.JWT_SIGNING_KEY || 'secret')
        },
        (jwtPayload, cb) => { return cb(null, jwtPayload); }
        ));

        // Load the ability to understand Facebook OAuth in Passport
        _passport.use(new FacebookTokenStrategy({
            clientID        : process.env.FACEBOOK_APP_ID,
            clientSecret    : process.env.FACEBOOK_APP_SECRET,
            fbGraphVersion  : 'v3.0'
        },
        (token, refreshToken, profile, done) => {
            // asynchronous
            process.nextTick(function() {    

                _policyHolderModel.findOne({"facebook.id":profile.id})
                .then((policyHolder) => {
                    console.log(policyHolder);

                    if (policyHolder) {
                        return done(null, policyHolder);
                    } else {
                        // No user found with that facebook id, create them
                        let newPolicyHolder: IPolicyHolder = CORE_DATA_MODEL.getDefaultPolicyHolder();
                        newPolicyHolder.policyHolderID = uuidBase62.v4();
                        newPolicyHolder.email = '';
                        newPolicyHolder.password = '';
                        newPolicyHolder.confirmationID = '';
                        newPolicyHolder.facebook.id = profile.id;
                        newPolicyHolder.facebook.token = token;
                        newPolicyHolder.facebook.name = profile.displayName;

                        return new _policyHolderModel(newPolicyHolder).save(function(policyHolderError){
                            if (policyHolderError) {
                                console.log("policyHolder not saved!");
                                throw policyHolderError;
                            }

                            // Remove some data for security before bubbling this policyHolder up
                            console.log("New facebook login, policyHolder saved!");
                            newPolicyHolder.facebook.token = '';
                            return done(null, newPolicyHolder);
                        });
                    }
                })
                .catch(err => { return done(err); });
            });        
        }));

        // Load the ability to understand Google OAuth in Passport
        _passport.use(new GoogleStrategy({
            clientID        : process.env.GOOGLE_APP_ID,
            clientSecret    : process.env.GOOGLE_APP_SECRET,
            callbackURL     : process.env.GOOGLE_CALLBACK_URL
        },
        (token, refreshToken, profile, done) => {
            // asynchronous
            process.nextTick(function() {    

                _policyHolderModel.findOne({"google.id":profile.id})
                .then((policyHolder) => {
                    console.log(policyHolder);

                    if (policyHolder) {
                        return done(null, policyHolder);
                    } else {
                        // No user found with that google id, create them
                        let newPolicyHolder: IPolicyHolder = CORE_DATA_MODEL.getDefaultPolicyHolder();
                        newPolicyHolder.policyHolderID = uuidBase62.v4();
                        newPolicyHolder.email = '';
                        newPolicyHolder.password = '';
                        newPolicyHolder.confirmationID = '';
                        newPolicyHolder.google.id = profile.id;
                        newPolicyHolder.google.token = token;
                        newPolicyHolder.google.name = profile.displayName;
                        newPolicyHolder.google.email = profile.emails[0].name;

                        return new _policyHolderModel(newPolicyHolder).save(function(policyHolderError){
                            if (policyHolderError) {
                                console.log("policyHolder not saved!");
                                throw policyHolderError;
                            }

                            // Remove some data for security before bubbling this policyHolder up
                            console.log("New google login, policyHolder saved!");
                            newPolicyHolder.google.token = '';
                            return done(null, newPolicyHolder);
                        });
                    }
                })
                .catch(err => { return done(err); });
            });        
        }));



        _passport.serializeUser(function(user, done) {
            done(null, user);
        });
          
        _passport.deserializeUser(function(user, done) {
            done(null, user);
        });

    }


}
