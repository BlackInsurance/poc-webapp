"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseRoute {
    constructor(_dm, _policyModel, _policyHolderModel) {
        this.title = "Black Insurance - Rainy Day Insurance Game";
        this.scripts = [];
        this.dataModel = _dm;
        this.policyModel = _policyModel;
        this.policyHolderModel = _policyHolderModel;
    }
    addScript(src) {
        this.scripts.push(src);
        return this;
    }
    render(req, res, view, options) {
        res.locals.BASE_URL = "/";
        res.locals.scripts = this.scripts;
        res.locals.title = this.title;
        res.render(view, options);
    }
}
exports.BaseRoute = BaseRoute;
