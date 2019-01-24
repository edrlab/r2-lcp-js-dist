"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const moment = require("moment");
const request = require("request");
const requestPromise = require("request-promise-native");
const debug = debug_("r2:lcp#lsd/lcpl-update");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
async function lsdLcpUpdate(lsdJson, lcp) {
    if (lsdJson.updated && lsdJson.updated.license &&
        (lcp.Updated || lcp.Issued)) {
        const updatedLicenseLSD = moment(lsdJson.updated.license);
        const updatedLicense = moment(lcp.Updated || lcp.Issued);
        const forceUpdate = false;
        if (forceUpdate ||
            updatedLicense.isBefore(updatedLicenseLSD)) {
            if (IS_DEV) {
                debug("LSD license updating...");
            }
            if (lsdJson.links) {
                const licenseLink = lsdJson.links.find((link) => {
                    return link.rel === "license";
                });
                if (!licenseLink) {
                    return Promise.reject("LSD license link is missing.");
                }
                if (IS_DEV) {
                    debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink.href);
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
                                failBuff = await BufferUtils_1.streamToBufferPromise(response);
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
                            responseData = await BufferUtils_1.streamToBufferPromise(response);
                        }
                        catch (err) {
                            reject(err);
                            return;
                        }
                        const lcplStr = responseData.toString("utf8");
                        if (IS_DEV) {
                            debug(lcplStr);
                        }
                        resolve(lcplStr);
                    };
                    const headers = {
                        "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                    };
                    const needsStreamingResponse = true;
                    if (needsStreamingResponse) {
                        request.get({
                            headers,
                            method: "GET",
                            uri: licenseLink.href,
                        })
                            .on("response", success)
                            .on("error", failure);
                    }
                    else {
                        let response;
                        try {
                            response = await requestPromise({
                                headers,
                                method: "GET",
                                resolveWithFullResponse: true,
                                uri: licenseLink.href,
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
        }
    }
    return Promise.reject("No LSD LCP update.");
}
exports.lsdLcpUpdate = lsdLcpUpdate;
//# sourceMappingURL=lcpl-update.js.map