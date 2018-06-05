"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keccakHash = require("keccak");
const baseRoute_1 = require("./baseRoute");
class SecuredRoute extends baseRoute_1.BaseRoute {
    constructor(_dm, _policyModel, _policyHolderModel) {
        super(_dm, _policyModel, _policyHolderModel);
    }
    getPolicy(req, res, next) {
        this.policyModel.find({ policyID: req.body.policyID }, function (err, policy) {
            if (err) {
                console.log('Error: Failed to communicate with the DB. ErrorMessage=' + err.message);
                res.status(400);
                res.send({ error: 'Failed to communicate with the DB. ErrorMessage=' + err.message });
                return;
            }
            if (policy == null) {
                console.log('Error: Failed to locate the requested Policy. PolicyID=' + req.body.policyID);
                res.status(404);
                res.send({ error: 'Failed to locate the requested Policy' });
                return;
            }
            console.log("returning one specific policy.");
            res.send(policy);
        });
    }
    setEthereumAddressForPolicy(req, res, next) {
        try {
            if (req.body.policyID == null || req.body.policyID.trim().length == 0) {
                console.log("Error: bad policyID");
                res.status(400);
                res.send({ error: 'PolicyID is blank' });
                return;
            }
            if (req.body.ethereumAddress == null || !this.isAddress(req.body.ethereumAddress)) {
                console.log("Error: bad Ethereum Address");
                res.status(400);
                res.send({ error: 'Ethereum Address does not meet formatting requirements or did not pass checksum validation' });
                return;
            }
        }
        catch (validationError) {
            console.log('Error: failed while validating inputs. ErrorMessage=' + validationError.message);
            res.status(400);
            res.send({ error: 'Failed while validating inputs.' });
            return;
        }
        let Policy = this.policyModel;
        Policy.findOne({ "policyID": req.body.policyID }, function (err, policy) {
            if (err) {
                console.log('Error: Failed to communicate with the DB. ErrorMessage=' + err.message);
                res.status(400);
                res.send({ error: 'Failed to communicate with the DB. ErrorMessage=' + err.message });
                return;
            }
            if (policy == null) {
                console.log('Error: Failed to locate the requested Policy. PolicyID=' + req.body.policyID);
                res.status(404);
                res.send({ error: 'Failed to locate the requested Policy' });
                return;
            }
            policy.ethereumAddress = req.body.ethereumAddress;
            Policy.update({ _id: policy.id }, policy, function (err) {
                if (err) {
                    console.log("not updated!");
                    res.status(400);
                    res.send();
                }
                console.log("updated!");
                res.send({ status: 'ok' });
            });
        });
    }
    isAddress(address) {
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            return false;
        }
        else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
            return true;
        }
        else {
            return this.isChecksumAddress(address);
        }
    }
    ;
    isChecksumAddress(address) {
        address = address.replace('0x', '');
        var addressHash = keccakHash('keccak256').update(address.toLowerCase()).digest('hex');
        for (var i = 0; i < 40; i++) {
            if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
                return false;
            }
        }
        return true;
    }
    ;
}
exports.SecuredRoute = SecuredRoute;
