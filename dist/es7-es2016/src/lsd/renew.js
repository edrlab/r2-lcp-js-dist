"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const BufferUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const URI = require("urijs");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:lcp#lsd/renew");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function lsdRenew(end, lsdJson, deviceIDManager) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!lsdJson.links) {
            return Promise.reject("No LSD links!");
        }
        const licenseRenew = lsdJson.links.find((link) => {
            return link.rel === "renew";
        });
        if (!licenseRenew) {
            return Promise.reject("No LSD renew link!");
        }
        let deviceID;
        try {
            deviceID = yield deviceIDManager.getDeviceID();
        }
        catch (err) {
            debug(err);
            return Promise.reject("Problem getting Device ID !?");
        }
        let deviceNAME;
        try {
            deviceNAME = yield deviceIDManager.getDeviceNAME();
        }
        catch (err) {
            debug(err);
            return Promise.reject("Problem getting Device NAME !?");
        }
        let renewURL = licenseRenew.href;
        if (licenseRenew.templated === true || licenseRenew.templated === "true") {
            const urlTemplate = new URITemplate(renewURL);
            renewURL = urlTemplate.expand({ end: "xxx", id: deviceID, name: deviceNAME }, { strict: false });
            const renewURI = new URI(renewURL);
            renewURI.search((data) => {
                data.end = end;
            });
            renewURL = renewURI.toString();
        }
        if (IS_DEV) {
            debug("RENEW: " + renewURL);
        }
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const failure = (err) => {
                reject(err);
            };
            const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (IS_DEV) {
                    Object.keys(response.headers).forEach((header) => {
                        debug(header + " => " + response.headers[header]);
                    });
                }
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    let failBuff;
                    try {
                        failBuff = yield BufferUtils_1.streamToBufferPromise(response);
                    }
                    catch (buffErr) {
                        if (IS_DEV) {
                            debug(buffErr);
                        }
                        failure(response.statusCode);
                        return;
                    }
                    try {
                        const failStr = failBuff.toString("utf8");
                        if (IS_DEV) {
                            debug(failStr);
                        }
                        try {
                            const failJson = global.JSON.parse(failStr);
                            if (IS_DEV) {
                                debug(failJson);
                            }
                            failJson.httpStatusCode = response.statusCode;
                            failure(failJson);
                        }
                        catch (jsonErr) {
                            if (IS_DEV) {
                                debug(jsonErr);
                            }
                            failure({ httpStatusCode: response.statusCode, httpResponseBody: failStr });
                        }
                    }
                    catch (strErr) {
                        if (IS_DEV) {
                            debug(strErr);
                        }
                        failure(response.statusCode);
                    }
                    return;
                }
                let responseData;
                try {
                    responseData = yield BufferUtils_1.streamToBufferPromise(response);
                }
                catch (err) {
                    reject(err);
                    return;
                }
                const responseStr = responseData.toString("utf8");
                if (IS_DEV) {
                    debug(responseStr);
                }
                const responseJson = global.JSON.parse(responseStr);
                if (IS_DEV) {
                    debug(responseJson);
                }
                resolve(responseJson);
            });
            const headers = {
                "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
            };
            const needsStreamingResponse = true;
            if (needsStreamingResponse) {
                request.put({
                    headers,
                    method: "PUT",
                    uri: renewURL,
                })
                    .on("response", success)
                    .on("error", failure);
            }
            else {
                let response;
                try {
                    response = yield requestPromise({
                        headers,
                        method: "PUT",
                        resolveWithFullResponse: true,
                        uri: renewURL,
                    });
                }
                catch (err) {
                    failure(err);
                    return;
                }
                yield success(response);
            }
        }));
    });
}
exports.lsdRenew = lsdRenew;
//# sourceMappingURL=renew.js.map