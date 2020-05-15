"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchStatusDocumentProcessing = void 0;
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const lsd_1 = require("../parser/epub/lsd");
const serializable_1 = require("../serializable");
const lcpl_update_1 = require("./lcpl-update");
const register_1 = require("./register");
const debug = debug_("r2:lcp#lsd/status-document-processing");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
async function launchStatusDocumentProcessing(lcp, deviceIDManager, onStatusDocumentProcessingComplete, httpHeaders) {
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
            lcp.LSD = serializable_1.TaJsonDeserialize(lsdJSON, lsd_1.LSD);
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
            licenseUpdateResponseJson = await lcpl_update_1.lsdLcpUpdate(lcp, httpHeaders);
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
        let registerResponse;
        try {
            registerResponse = await register_1.lsdRegister_(lcp.LSD, deviceIDManager, httpHeaders);
        }
        catch (err) {
            debug(err);
        }
        if (registerResponse) {
            lcp.LSD = registerResponse;
            if (IS_DEV) {
                debug(lcp.LSD);
            }
        }
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete(undefined);
        }
    };
    const headers = Object.assign({
        "Accept": "application/json,application/xml",
        "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        "User-Agent": "Readium2-LCP",
    }, httpHeaders ? httpHeaders : {});
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
            response = await requestPromise({
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
        await success(response);
    }
}
exports.launchStatusDocumentProcessing = launchStatusDocumentProcessing;
//# sourceMappingURL=status-document-processing.js.map