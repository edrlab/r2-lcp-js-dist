"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdRenew_ = exports.lsdRenew = void 0;
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const lsd_1 = require("../parser/epub/lsd");
const serializable_1 = require("../serializable");
const URI = require("urijs");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:lcp#lsd/renew");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
async function lsdRenew(end, lsdJSON, deviceIDManager, httpHeaders) {
    if (lsdJSON instanceof lsd_1.LSD) {
        return lsdRenew_(end, lsdJSON, deviceIDManager);
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
    const obj = lsdRenew_(end, lsd, deviceIDManager, httpHeaders);
    return (0, serializable_1.TaJsonSerialize)(obj);
}
exports.lsdRenew = lsdRenew;
async function lsdRenew_(end, lsd, deviceIDManager, httpHeaders) {
    if (!lsd) {
        return Promise.reject("LCP LSD data is missing.");
    }
    if (!lsd.Links) {
        return Promise.reject("No LSD links!");
    }
    const licenseRenew = lsd.Links.find((link) => {
        return link.Rel === "renew";
    });
    if (!licenseRenew) {
        return Promise.reject("No LSD renew link!");
    }
    let deviceID;
    try {
        deviceID = await deviceIDManager.getDeviceID();
    }
    catch (err) {
        debug(err);
        return Promise.reject("Problem getting Device ID !?");
    }
    let deviceNAME;
    try {
        deviceNAME = await deviceIDManager.getDeviceNAME();
    }
    catch (err) {
        debug(err);
        return Promise.reject("Problem getting Device NAME !?");
    }
    let renewURL = licenseRenew.Href;
    if (licenseRenew.Templated) {
        const urlTemplate = new URITemplate(renewURL);
        const uri1 = urlTemplate.expand({ end: "xxx", id: deviceID, name: deviceNAME }, { strict: false });
        renewURL = uri1.toString();
        const uri2 = new URI(renewURL);
        uri2.search((data) => {
            data.end = end === null || end === void 0 ? void 0 : end.toISOString();
        });
        renewURL = uri2.toString();
    }
    if (IS_DEV) {
        debug("RENEW: " + renewURL);
    }
    return new Promise(async (resolve, reject) => {
        const failure = (err) => {
            reject(err);
        };
        const success = async (response) => {
            if (IS_DEV) {
                Object.keys(response.headers).forEach((header) => {
                    debug(header + " => " + response.headers[header]);
                });
            }
            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                let failBuff;
                try {
                    failBuff = await (0, BufferUtils_1.streamToBufferPromise)(response);
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
                responseData = await (0, BufferUtils_1.streamToBufferPromise)(response);
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
        };
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
                uri: renewURL,
            })
                .on("response", async (res) => {
                try {
                    await success(res);
                }
                catch (successError) {
                    failure(successError);
                    return;
                }
            })
                .on("error", failure);
        }
        else {
            let response;
            try {
                response = await requestPromise({
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
            await success(response);
        }
    });
}
exports.lsdRenew_ = lsdRenew_;
//# sourceMappingURL=renew.js.map