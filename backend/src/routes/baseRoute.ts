import { NextFunction, Request, Response } from 'express';
import { CORE_DATA_MODEL } from '../../shared/models/model';
import { IPolicy, IPolicyModel, policySchema } from "../../shared/models/policy";
import { IPolicyHolder, IPolicyHolderModel, policyHolderSchema } from "../../shared/models/policyHolder";

/**
 * Constructor
 *
 * @class BaseRoute
 */
export class BaseRoute {

  protected title: string;
  private scripts: string[];
  public dataModel: CORE_DATA_MODEL;

  protected policyModel: any;
  protected policyHolderModel: any;

  /**
   * Constructor
   *
   * @class BaseRoute
   * @constructor
   */
  constructor(_dm: CORE_DATA_MODEL, _policyModel: any, _policyHolderModel: any) {
    //initialize variables
    this.title = "Black Insurance - Rainy Day Insurance Game";
    this.scripts = [];
    this.dataModel = _dm;
    this.policyModel = _policyModel;
    this.policyHolderModel = _policyHolderModel;
  }

  /**
   * Add a JS external file to the request.
   *
   * @class BaseRoute
   * @method addScript
   * @param src {string} The src to the external JS file.
   * @return {BaseRoute} Self for chaining
   */
  public addScript(src: string): BaseRoute {
    this.scripts.push(src);
    return this;
  }

  /**
   * Render a page.
   *
   * @class BaseRoute
   * @method render
   * @param req {Request} The request object.
   * @param res {Response} The response object.
   * @param view {String} The view to render.
   * @param options {Object} Additional options to append to the view's local scope.
   * @return void
   */
  public render(req: Request, res: Response, view: string, options?: Object) {
    //add constants
    res.locals.BASE_URL = "/";

    //add scripts
    res.locals.scripts = this.scripts;

    //add title
    res.locals.title = this.title;

    //render view
    res.render(view, options);
  }
}