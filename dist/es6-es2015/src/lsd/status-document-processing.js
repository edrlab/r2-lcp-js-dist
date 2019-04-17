"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const BufferUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_x_1 = require("ta-json-x");
const lsd_1 = require("../parser/epub/lsd");
const lcpl_update_1 = require("./lcpl-update");
const register_1 = require("./register");
const debug = debug_("r2:lcp#lsd/status-document-processing");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function launchStatusDocumentProcessing(lcp, deviceIDManager, onStatusDocumentProcessingComplete) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!lcp || !lcp.Links) {
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
            return;
        }
        const linkStatus = lcp.Links.find((link) => {
            return link.Rel === "status";
        });
        if (!linkStatus) {
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
            return;
        }
        if (IS_DEV) {
            debug(linkStatus);
        }
        const failure = (err) => {
            debug(err);
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
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
                debug(err);
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete(undefined);
                }
                return;
            }
            const responseStr = responseData.toString("utf8");
            const mime = "application/vnd.readium.license.status.v1.0+json";
            if (IS_DEV) {
                if (response.headers["content-type"] === mime ||
                    response.headers["content-type"] === "application/json") {
                    debug(responseStr);
                }
            }
            const lsdJSON = global.JSON.parse(responseStr);
            if (IS_DEV) {
                debug(lsdJSON);
            }
            try {
                lcp.LSD = ta_json_x_1.JSON.deserialize(lsdJSON, lsd_1.LSD);
                if (IS_DEV) {
                    debug(lcp.LSD);
                }
            }
            catch (err) {
                debug(err);
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete(undefined);
                }
                return;
            }
            let licenseUpdateResponseJson;
            try {
                licenseUpdateResponseJson = yield lcpl_update_1.lsdLcpUpdate(lcp);
            }
            catch (err) {
                debug(err);
            }
            if (licenseUpdateResponseJson) {
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete(licenseUpdateResponseJson);
                }
                return;
            }
            if (lcp.LSD.Status === "revoked"
                || lcp.LSD.Status === "returned"
                || lcp.LSD.Status === "cancelled"
                || lcp.LSD.Status === "expired") {
                debug("What?! LSD status:" + lcp.LSD.Status);
                if (onStatusDocumentProcessingComplete) {
                    onStatusDocumentProcessingComplete(undefined);
                }
                return;
            }
            let registerResponseJson;
            try {
                registerResponseJson = yield register_1.lsdRegister_(lcp.LSD, deviceIDManager);
            }
            catch (err) {
                debug(err);
            }
            if (registerResponseJson) {
                try {
                    lcp.LSD = ta_json_x_1.JSON.deserialize(registerResponseJson, lsd_1.LSD);
                    if (IS_DEV) {
                        debug(lcp.LSD);
                    }
                }
                catch (err) {
                    debug(err);
                }
            }
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
        });
        const headers = {
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        };
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.get({
                headers,
                method: "GET",
                uri: linkStatus.Href,
            })
                .on("response", success)
                .on("error", failure);
        }
        else {
            let response;
            try {
                response = yield requestPromise({
                    headers,
                    method: "GET",
                    resolveWithFullResponse: true,
                    uri: linkStatus.Href,
                });
            }
            catch (err) {
                failure(err);
                return;
            }
            yield success(response);
        }
    });
}
exports.launchStatusDocumentProcessing = launchStatusDocumentProcessing;
//# sourceMappingURL=status-document-processing.js.map