"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var debug_ = require("debug");
var request = require("request");
var requestPromise = require("request-promise-native");
var lcpl_update_1 = require("./lcpl-update");
var register_1 = require("./register");
var debug = debug_("r2:lcp:lsd:processing");
function launchStatusDocumentProcessing(lcp, deviceIDManager, onStatusDocumentProcessingComplete) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        var linkStatus, failure, success, headers, needsStreamingResponse, response, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!lcp || !lcp.Links) {
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete(undefined);
                        }
                        return [2];
                    }
                    linkStatus = lcp.Links.find(function (link) {
                        return link.Rel === "status";
                    });
                    if (!linkStatus) {
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete(undefined);
                        }
                        return [2];
                    }
                    debug(linkStatus);
                    failure = function (err) {
                        debug(err);
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete(undefined);
                        }
                    };
                    success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var responseData, err_2, responseStr, mime, lsdJson, licenseUpdateResponseJson, err_3, registerResponseJson, err_4;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    Object.keys(response.headers).forEach(function (header) {
                                        debug(header + " => " + response.headers[header]);
                                    });
                                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                                        failure("HTTP CODE " + response.statusCode);
                                        return [2];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4, BufferUtils_1.streamToBufferPromise(response)];
                                case 2:
                                    responseData = _a.sent();
                                    return [3, 4];
                                case 3:
                                    err_2 = _a.sent();
                                    debug(err_2);
                                    if (onStatusDocumentProcessingComplete) {
                                        onStatusDocumentProcessingComplete(undefined);
                                    }
                                    return [2];
                                case 4:
                                    if (!responseData) {
                                        if (onStatusDocumentProcessingComplete) {
                                            onStatusDocumentProcessingComplete(undefined);
                                        }
                                        return [2];
                                    }
                                    responseStr = responseData.toString("utf8");
                                    mime = "application/vnd.readium.license.status.v1.0+json";
                                    if (response.headers["content-type"] === mime ||
                                        response.headers["content-type"] === "application/json") {
                                        debug(responseStr);
                                    }
                                    lsdJson = global.JSON.parse(responseStr);
                                    debug(lsdJson);
                                    lcp.LSDJson = lsdJson;
                                    _a.label = 5;
                                case 5:
                                    _a.trys.push([5, 7, , 8]);
                                    return [4, lcpl_update_1.lsdLcpUpdate(lsdJson, lcp)];
                                case 6:
                                    licenseUpdateResponseJson = _a.sent();
                                    return [3, 8];
                                case 7:
                                    err_3 = _a.sent();
                                    debug(err_3);
                                    return [3, 8];
                                case 8:
                                    if (licenseUpdateResponseJson) {
                                        if (onStatusDocumentProcessingComplete) {
                                            onStatusDocumentProcessingComplete(licenseUpdateResponseJson);
                                        }
                                        return [2];
                                    }
                                    if (lsdJson.status === "revoked"
                                        || lsdJson.status === "returned"
                                        || lsdJson.status === "cancelled"
                                        || lsdJson.status === "expired") {
                                        debug("What?! LSD " + lsdJson.status);
                                        if (onStatusDocumentProcessingComplete) {
                                            onStatusDocumentProcessingComplete(undefined);
                                        }
                                        return [2];
                                    }
                                    _a.label = 9;
                                case 9:
                                    _a.trys.push([9, 11, , 12]);
                                    return [4, register_1.lsdRegister(lsdJson, deviceIDManager)];
                                case 10:
                                    registerResponseJson = _a.sent();
                                    lcp.LSDJson = registerResponseJson;
                                    return [3, 12];
                                case 11:
                                    err_4 = _a.sent();
                                    debug(err_4);
                                    return [3, 12];
                                case 12:
                                    if (onStatusDocumentProcessingComplete) {
                                        onStatusDocumentProcessingComplete(undefined);
                                    }
                                    return [2];
                            }
                        });
                    }); };
                    headers = {
                        "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                    };
                    needsStreamingResponse = true;
                    if (!needsStreamingResponse) return [3, 1];
                    request.get({
                        headers: headers,
                        method: "GET",
                        uri: linkStatus.Href,
                    })
                        .on("response", success)
                        .on("error", failure);
                    return [3, 7];
                case 1:
                    response = void 0;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4, requestPromise({
                            headers: headers,
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: linkStatus.Href,
                        })];
                case 3:
                    response = _a.sent();
                    return [3, 5];
                case 4:
                    err_1 = _a.sent();
                    failure(err_1);
                    return [2];
                case 5: return [4, success(response)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2];
            }
        });
    });
}
exports.launchStatusDocumentProcessing = launchStatusDocumentProcessing;
//# sourceMappingURL=status-document-processing.js.map