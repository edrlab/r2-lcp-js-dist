"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdRegister_ = exports.lsdRegister = void 0;
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const lsd_1 = require("../parser/epub/lsd");
const serializable_1 = require("../serializable");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:lcp#lsd/register");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
async function lsdRegister(lsdJSON, deviceIDManager, httpHeaders) {
    if (lsdJSON instanceof lsd_1.LSD) {
        return lsdRegister_(lsdJSON, deviceIDManager);
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
    const obj = lsdRegister_(lsd, deviceIDManager, httpHeaders);
    return (0, serializable_1.TaJsonSerialize)(obj);
}
exports.lsdRegister = lsdRegister;
async function lsdRegister_(lsd, deviceIDManager, httpHeaders) {
    if (!lsd) {
        return Promise.reject("LCP LSD data is missing.");
    }
    if (!lsd.Links) {
        return Promise.reject("No LSD links!");
    }
    const licenseRegister = lsd.Links.find((link) => {
        return link.Rel === "register";
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
    if (lsd.Status === lsd_1.StatusEnum.Ready) {
        doRegister = true;
    }
    else if (lsd.Status === lsd_1.StatusEnum.Active) {
        let deviceIDForStatusDoc;
        try {
            deviceIDForStatusDoc = await deviceIDManager.checkDeviceID(lsd.ID);
        }
        catch (err) {
            debug(err);
        }
        if (!deviceIDForStatusDoc) {
            doRegister = true;
        }
        else if (deviceIDForStatusDoc !== deviceID) {
            if (IS_DEV) {
                debug("LSD registered device ID is different? ", lsd.ID, ": ", deviceIDForStatusDoc, " --- ", deviceID);
            }
            doRegister = true;
        }
    }
    if (!doRegister) {
        return Promise.reject("No need to LSD register.");
    }
    let registerURL = licenseRegister.Href;
    if (licenseRegister.Templated) {
        const urlTemplate = new URITemplate(registerURL);
        const uri1 = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
        registerURL = uri1.toString();
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
            request.post({
                headers,
                method: "POST",
                timeout: 2000,
                uri: registerURL,
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
exports.lsdRegister_ = lsdRegister_;
//# sourceMappingURL=register.js.map