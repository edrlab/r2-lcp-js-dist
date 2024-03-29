"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdReturn_ = exports.lsdReturn = void 0;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const BufferUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/stream/BufferUtils");
const lsd_1 = require("../parser/epub/lsd");
const serializable_1 = require("../serializable");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:lcp#lsd/return");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function lsdReturn(lsdJSON, deviceIDManager, httpHeaders) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (lsdJSON instanceof lsd_1.LSD) {
            return lsdReturn_(lsdJSON, deviceIDManager);
        }
        let lsd;
        try {
            lsd = (0, serializable_1.TaJsonDeserialize)(lsdJSON, lsd_1.LSD);
        }
        catch (err) {
            debug(err);
            debug(lsdJSON);
            return Promise.reject("Bad LSD JSON?");
        }
        const obj = lsdReturn_(lsd, deviceIDManager, httpHeaders);
        return (0, serializable_1.TaJsonSerialize)(obj);
    });
}
exports.lsdReturn = lsdReturn;
function lsdReturn_(lsd, deviceIDManager, httpHeaders) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!lsd) {
            return Promise.reject("LCP LSD data is missing.");
        }
        if (!lsd.Links) {
            return Promise.reject("No LSD links!");
        }
        const licenseReturn = lsd.Links.find((link) => {
            return link.Rel === "return";
        });
        if (!licenseReturn) {
            return Promise.reject("No LSD return link!");
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
        let returnURL = licenseReturn.Href;
        if (licenseReturn.Templated) {
            const urlTemplate = new URITemplate(returnURL);
            const uri1 = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
            returnURL = uri1.toString();
        }
        if (IS_DEV) {
            debug("RETURN: " + returnURL);
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
                        failBuff = yield (0, BufferUtils_1.streamToBufferPromise)(response);
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
                    responseData = yield (0, BufferUtils_1.streamToBufferPromise)(response);
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
                try {
                    const newLsd = (0, serializable_1.TaJsonDeserialize)(responseJson, lsd_1.LSD);
                    if (IS_DEV) {
                        debug(newLsd);
                    }
                    resolve(newLsd);
                }
                catch (err) {
                    debug(err);
                    resolve(responseJson);
                }
            });
            const headers = Object.assign({
                "Accept": "application/json,application/xml",
                "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                "User-Agent": "Readium2-LCP",
            }, httpHeaders ? httpHeaders : {});
            const needsStreamingResponse = true;
            if (needsStreamingResponse) {
                request.put({
                    headers,
                    method: "PUT",
                    timeout: 5000,
                    uri: returnURL,
                })
                    .on("response", (res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        yield success(res);
                    }
                    catch (successError) {
                        failure(successError);
                        return;
                    }
                }))
                    .on("error", failure);
            }
            else {
                let response;
                try {
                    response = yield requestPromise({
                        headers,
                        method: "PUT",
                        resolveWithFullResponse: true,
                        uri: returnURL,
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
exports.lsdReturn_ = lsdReturn_;
//# sourceMappingURL=return.js.map