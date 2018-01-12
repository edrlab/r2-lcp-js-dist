"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const moment = require("moment");
const request = require("request");
const requestPromise = require("request-promise-native");
const debug = debug_("r2:lcp:lsd:lcpl-update");
async function lsdLcpUpdate(lsdJson, lcp) {
    if (lsdJson.updated && lsdJson.updated.license &&
        (lcp.Updated || lcp.Issued)) {
        const updatedLicenseLSD = moment(lsdJson.updated.license);
        const updatedLicense = moment(lcp.Updated || lcp.Issued);
        const forceUpdate = false;
        if (forceUpdate ||
            updatedLicense.isBefore(updatedLicenseLSD)) {
            debug("LSD license updating...");
            if (lsdJson.links) {
                const licenseLink = lsdJson.links.find((link) => {
                    return link.rel === "license";
                });
                if (!licenseLink) {
                    return Promise.reject("LSD license link is missing.");
                }
                debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink.href);
                return new Promise(async (resolve, reject) => {
                    const failure = (err) => {
                        reject(err);
                    };
                    const success = async (response) => {
                        Object.keys(response.headers).forEach((header) => {
                            debug(header + " => " + response.headers[header]);
                        });
                        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                            failure("HTTP CODE " + response.statusCode);
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
                        if (!responseData) {
                            return;
                        }
                        const lcplStr = responseData.toString("utf8");
                        debug(lcplStr);
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