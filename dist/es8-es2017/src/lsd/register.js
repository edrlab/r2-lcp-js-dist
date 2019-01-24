"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:lcp#lsd/register");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
async function lsdRegister(lsdJson, deviceIDManager) {
    if (!lsdJson.links) {
        return Promise.reject("No LSD links!");
    }
    const licenseRegister = lsdJson.links.find((link) => {
        return link.rel === "register";
    });
    if (!licenseRegister) {
        return Promise.reject("No LSD register link!");
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
    let doRegister = false;
    if (lsdJson.status === "ready") {
        doRegister = true;
    }
    else if (lsdJson.status === "active") {
        let deviceIDForStatusDoc;
        try {
            deviceIDForStatusDoc = await deviceIDManager.checkDeviceID(lsdJson.id);
        }
        catch (err) {
            debug(err);
        }
        if (!deviceIDForStatusDoc) {
            doRegister = true;
        }
        else if (deviceIDForStatusDoc !== deviceID) {
            if (IS_DEV) {
                debug("LSD registered device ID is different? ", lsdJson.id, ": ", deviceIDForStatusDoc, " --- ", deviceID);
            }
            doRegister = true;
        }
    }
    if (!doRegister) {
        return Promise.reject("No need to LSD register.");
    }
    let registerURL = licenseRegister.href;
    if (licenseRegister.templated === true || licenseRegister.templated === "true") {
        const urlTemplate = new URITemplate(registerURL);
        registerURL = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
    }
    if (IS_DEV) {
        debug("REGISTER: " + registerURL);
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
            const responseStr = responseData.toString("utf8");
            if (IS_DEV) {
                debug(responseStr);
            }
            const responseJson = global.JSON.parse(responseStr);
            if (IS_DEV) {
                debug(responseJson);
                debug(responseJson.status);
            }
            if (responseJson.status === "active") {
                try {
                    await deviceIDManager.recordDeviceID(responseJson.id);
                }
                catch (err) {
                    debug(err);
                }
            }
            resolve(responseJson);
        };
        const headers = {
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        };
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.post({
                headers,
                method: "POST",
                uri: registerURL,
            })
                .on("response", success)
                .on("error", failure);
        }
        else {
            let response;
            try {
                response = await requestPromise({
                    headers,
                    method: "POST",
                    resolveWithFullResponse: true,
                    uri: registerURL,
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
exports.lsdRegister = lsdRegister;
//# sourceMappingURL=register.js.map