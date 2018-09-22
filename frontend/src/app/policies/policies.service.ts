

import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http'
//import { Http, URLSearchParams, Headers, RequestOptionsArgs } from '@angular/http';

import {throwError as observableThrowError, Observable, Subject, of } from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import * as shajs from 'sha.js';
import * as jwtDecode from 'jwt-decode';

import { Policy } from './policy';


@Injectable()
export class PolicyService {
    
    private backendBaseURL : string = window.location.protocol + '//' + window.location.host + '/';

    constructor(private http: HttpClient) { 

        // Hack for working in local DEV
        if ( window.location.hostname == 'localhost' ){
            this.backendBaseURL = 'https://localhost:8088/';
        }
    }


    ngOnInit() { }


    getCurrentUserEmail() : string {
        if ( localStorage.getItem('token') == null ){
            return '';
        } else {
            let encodedJWT = localStorage.getItem('token');
            let decodedJWT = jwtDecode(encodedJWT);
            return decodedJWT.sub;
        }
    }


    getCurrentPolicyLocation() : string {
        if ( localStorage.getItem('token') == null ){
            return '';
        } else {
            let encodedJWT = localStorage.getItem('token');
            let decodedJWT = jwtDecode(encodedJWT);
            return decodedJWT.loc;
        }
    }


    checkLoginCredentials(_emailAddress:string,_password:string, _recaptchaToken:string) : Observable<any>{
        var hashedPassword = shajs('sha256').update(_password).digest('hex');
        var loginRequest = { type: 'credentials', email: _emailAddress, password: hashedPassword, recaptchaToken: _recaptchaToken };

        return this.http.post<Policy[]>(this.backendBaseURL+"login/", loginRequest, { observe: 'response' }).pipe(
            map((res:HttpResponse<any>) => { 
                if (res.body.message == 'logged in'){
                    var token = res.headers.get('Authorization');

                    // Check to make sure the JWT contains the email AND policyLocation
                    var decodedJWT = jwtDecode(token);
                    if (decodedJWT.sub != '' && decodedJWT.loc != '') {
                        localStorage.setItem('token', token);
                    }else{
                        return observableThrowError({
                            message: 'Invalid Token',
                            response: res
                        });
                    }
                }

                return res.body; 
            }),
            catchError((error:any) => {
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),);        
    }

    loginWithFacebook(accessToken:string) : Observable<any> {
        let global_this = this;
        var requestOptions = {
            headers: new HttpHeaders({ 'Authorization': 'Bearer '+accessToken }),
            observe: 'response' as 'body'
        };
        return this.http.get<Object>(global_this.backendBaseURL+'auth/facebook', requestOptions).pipe(
            map((res:HttpResponse<any>) => { 
                if (res.body.hasPolicy){
                    var token = res.headers.get('Authorization');

                    // Check to make sure the JWT contains the email AND policyLocation
                    var decodedJWT = jwtDecode(token);
                    if (decodedJWT.sub != '' && decodedJWT.loc != '') {
                        localStorage.setItem('token', token);
                    }else{
                        return observableThrowError({
                            message: 'Invalid Token',
                            response: res
                        });
                    }
                }            
                return res.body; 
            }),
            catchError((error:any) => {
                console.log('ERROR: Failed to authenticate the Facebook access token.');
                console.log(error.json ? error.json().error : error || 'Server error');
                return observableThrowError(error.json ? error.json().error : error || 'Server error');
            }),);        

    }

    logout(){
        localStorage.removeItem('token');
    }
  
    getPolicyForCurrentUser() : Observable<Policy>{
        let encodedJWT = localStorage.getItem('token');
        let decodedJWT = jwtDecode(encodedJWT);

        var policyRequest = { policyHolderID: decodedJWT.jti };
        var requestOptions = {
            headers: new HttpHeaders({ 'Authorization': 'Bearer '+localStorage.getItem('token') }),
        };

        return this.http.post<Policy>(this.backendBaseURL+"policySecureRead/", policyRequest, requestOptions).pipe(
            map((res:Policy) => { return res; }),
            catchError((error:any) => {
                console.log(error);
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),);
    }

    createPolicy(policy:Policy): Observable<Policy>{
        if ( policy.password != '' ) {
            let insecurePassword = policy.password;
            policy.password = shajs('sha256').update(insecurePassword).digest('hex');
        }

        return this.http.post<Policy>(this.backendBaseURL+"policy", policy, { observe: 'response' }).pipe(
            map((res:HttpResponse<Policy>) => {
                var token = res.headers.get('Authorization');
                localStorage.setItem('token', token);

                return res.body;
            }),
            catchError((error:any) => {
                console.log(error);
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),); 
    }

    setPolicyEthereumAddress(_policyID:string, _ethereumAddress:string): Observable<any>{
        var policyRequest = { 
            policyID: _policyID,
            ethereumAddress: _ethereumAddress };
        var requestOptions = {
            headers: new HttpHeaders({ 'Authorization': 'Bearer '+localStorage.getItem('token') }),
        };
            
        return this.http.patch(this.backendBaseURL+"policy", policyRequest, requestOptions).pipe(
            map((res:any) => {
                return res;
            }),
            catchError((error:any) => {
                console.log(error);
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),); 
    }

    confirmPolicyHolder(_confirmationID:string): Observable<Policy> {
        let confirmData = { confirmationID: _confirmationID };
        return this.http.post<Policy>(this.backendBaseURL+"confirm", confirmData, { observe: 'response' }).pipe(
            map((res:HttpResponse<Policy>) => {
                var token = res.headers.get('Authorization');
                localStorage.setItem('token', token);
                return res.body;
            }),
            catchError((error:any) => {
                console.log(error);
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),); 
    }

    /** Log a message with the MessageService */
    private log(message: string) {
        console.log('PolicyService: ' + message);
    }


    /**
     * Handle Http operation that failed.
     * Let the app continue.
     * @param operation - name of the operation that failed
     * @param result - optional value to return as the observable result
     */
    private handleError<T> (operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
       
          // TODO: send the error to remote logging infrastructure
          console.error(error); // log to console instead
       
          // TODO: better job of transforming error for user consumption
          this.log(`${operation} failed: ${error.message}`);
       
          // Let the app keep running by returning an empty result.
          return of(result as T);
        };
      }

}