"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var debug_ = require("debug");
var moment = require("moment");
var request = require("request");
var requestPromise = require("request-promise-native");
var debug = debug_("r2:lcp#lsd/lcpl-update");
function lsdLcpUpdate(lsdJson, lcp) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var updatedLicenseLSD, updatedLicense, forceUpdate, licenseLink_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            if (lsdJson.updated && lsdJson.updated.license &&
                (lcp.Updated || lcp.Issued)) {
                updatedLicenseLSD = moment(lsdJson.updated.license);
                updatedLicense = moment(lcp.Updated || lcp.Issued);
                forceUpdate = false;
                if (forceUpdate ||
                    updatedLicense.isBefore(updatedLicenseLSD)) {
                    debug("LSD license updating...");
                    if (lsdJson.links) {
                        licenseLink_1 = lsdJson.links.find(function (link) {
                            return link.rel === "license";
                        });
                        if (!licenseLink_1) {
                            return [2, Promise.reject("LSD license link is missing.")];
                        }
                        debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink_1.href);
                        return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var failure, success, headers, needsStreamingResponse, response, err_1;
                                var _this = this;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            failure = function (err) {
                                                reject(err);
                                            };
                                            success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                                var d, err_2, s, responseData, err_3, lcplStr;
                                                return tslib_1.__generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            Object.keys(response.headers).forEach(function (header) {
                                                                debug(header + " => " + response.headers[header]);
                                                            });
                                                            if (!(response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) return [3, 5];
                                                            failure("HTTP CODE " + response.statusCode);
                                                            d = void 0;
                                                            _a.label = 1;
                                                        case 1:
                                                            _a.trys.push([1, 3, , 4]);
                                                            return [4, BufferUtils_1.streamToBufferPromise(response)];
                                                        case 2:
                                                            d = _a.sent();
                                                            return [3, 4];
                                                        case 3:
                                                            err_2 = _a.sent();
                                                            return [2];
                                                        case 4:
                                                            s = d.toString("utf8");
                                                            debug(s);
                                                            return [2];
                                                        case 5:
                                                            _a.trys.push([5, 7, , 8]);
                                                            return [4, BufferUtils_1.streamToBufferPromise(response)];
                                                        case 6:
                                                            responseData = _a.sent();
                                                            return [3, 8];
                                                        case 7:
                                                            err_3 = _a.sent();
                                                            reject(err_3);
                                                            return [2];
                                                        case 8:
                                                            lcplStr = responseData.toString("utf8");
                                                            debug(lcplStr);
                                                            resolve(lcplStr);
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
                                                uri: licenseLink_1.href,
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
                                                    uri: licenseLink_1.href,
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
                            }); })];
                    }
                }
            }
            return [2, Promise.reject("No LSD LCP update.")];
        });
    });
}
exports.lsdLcpUpdate = lsdLcpUpdate;
//# sourceMappingURL=lcpl-update.js.map