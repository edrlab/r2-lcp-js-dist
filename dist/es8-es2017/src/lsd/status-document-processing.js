"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const lcpl_update_1 = require("./lcpl-update");
const register_1 = require("./register");
const debug = debug_("r2:lcp:lsd:processing");
async function launchStatusDocumentProcessing(lcp, deviceIDManager, onStatusDocumentProcessingComplete) {
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
    debug(linkStatus);
    const failure = (err) => {
        debug(err);
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete(undefined);
        }
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
            debug(err);
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
            return;
        }
        if (!responseData) {
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
            return;
        }
        const responseStr = responseData.toString("utf8");
        const mime = "application/vnd.readium.license.status.v1.0+json";
        if (response.headers["content-type"] === mime ||
            response.headers["content-type"] === "application/json") {
            debug(responseStr);
        }
        const lsdJson = global.JSON.parse(responseStr);
        debug(lsdJson);
        lcp.LSDJson = lsdJson;
        let licenseUpdateResponseJson;
        try {
            licenseUpdateResponseJson = await lcpl_update_1.lsdLcpUpdate(lsdJson, lcp);
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
        if (lsdJson.status === "revoked"
            || lsdJson.status === "returned"
            || lsdJson.status === "cancelled"
            || lsdJson.status === "expired") {
            debug("What?! LSD " + lsdJson.status);
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete(undefined);
            }
            return;
        }
        let registerResponseJson;
        try {
            registerResponseJson = await register_1.lsdRegister(lsdJson, deviceIDManager);
            lcp.LSDJson = registerResponseJson;
        }
        catch (err) {
            debug(err);
        }
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete(undefined);
        }
    };
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