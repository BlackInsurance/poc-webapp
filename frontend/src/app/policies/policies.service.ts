

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
        //this.backendBaseURL = 'http://localhost:8088/';
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


    checkLoginCredentials(_emailAddress:string,_password:string) : Observable<any>{
        var hashedPassword = shajs('sha256').update({_password}).digest('hex');
        var loginRequest = { email: _emailAddress, password: _password };

        return this.http.post<Policy[]>(this.backendBaseURL+"login/", loginRequest, { observe: 'response' }).pipe(
            map((res:HttpResponse<any>) => { 
                if (res.body.message == 'logged in'){
                    var token = res.headers.get('Authorization');
                    localStorage.setItem('token', token);
                }

                return res.body; 
            }),
            catchError((error:any) => {
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),);        
    }

  
    getPolicyForCurrentUser() : Observable<Policy>{
        let encodedJWT = localStorage.getItem('token');
        let decodedJWT = jwtDecode(encodedJWT);

        var policyRequest = { policyHolderID: decodedJWT.jti };
        var requestOptions = {
            headers: new HttpHeaders({ 'Authorization': 'Bearer '+localStorage.getItem('token') }),
        };

        return this.http.post<Policy[]>(this.backendBaseURL+"policySecureRead/", policyRequest, requestOptions).pipe(
            map((res:Policy[]) => { return res[0]; }),
            catchError((error:any) => {
                console.log(error);
                return observableThrowError(error.json ? error.json().error : error || 'Server error')
            }),);
    }

    createPolicy(policy:Policy): Observable<Policy>{
        let insecurePassword = policy.password;
        policy.password = shajs('sha256').update({insecurePassword}).digest('hex');

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
                return res.json();
            }),
            catchError(this.handleError('setPolicyEthereumAddress', []))); 
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