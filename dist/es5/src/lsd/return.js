"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdReturn_ = exports.lsdReturn = void 0;
var tslib_1 = require("tslib");
var debug_ = require("debug");
var request = require("request");
var requestPromise = require("request-promise-native");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var lsd_1 = require("../parser/epub/lsd");
var serializable_1 = require("../serializable");
var URITemplate = require("urijs/src/URITemplate");
var debug = debug_("r2:lcp#lsd/return");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function lsdReturn(lsdJSON, deviceIDManager, httpHeaders) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var lsd, obj;
        return tslib_1.__generator(this, function (_a) {
            if (lsdJSON instanceof lsd_1.LSD) {
                return [2, lsdReturn_(lsdJSON, deviceIDManager)];
            }
            try {
                lsd = (0, serializable_1.TaJsonDeserialize)(lsdJSON, lsd_1.LSD);
            }
            catch (err) {
                debug(err);
                debug(lsdJSON);
                return [2, Promise.reject("Bad LSD JSON?")];
            }
            obj = lsdReturn_(lsd, deviceIDManager, httpHeaders);
            return [2, (0, serializable_1.TaJsonSerialize)(obj)];
        });
    });
}
exports.lsdReturn = lsdReturn;
function lsdReturn_(lsd, deviceIDManager, httpHeaders) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var licenseReturn, deviceID, err_1, deviceNAME, err_2, returnURL, urlTemplate, uri1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!lsd) {
                        return [2, Promise.reject("LCP LSD data is missing.")];
                    }
                    if (!lsd.Links) {
                        return [2, Promise.reject("No LSD links!")];
                    }
                    licenseReturn = lsd.Links.find(function (link) {
                        return link.Rel === "return";
                    });
                    if (!licenseReturn) {
                        return [2, Promise.reject("No LSD return link!")];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, deviceIDManager.getDeviceID()];
                case 2:
                    deviceID = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    return [2, Promise.reject("Problem getting Device ID !?")];
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4, deviceIDManager.getDeviceNAME()];
                case 5:
                    deviceNAME = _a.sent();
                    return [3, 7];
                case 6:
                    err_2 = _a.sent();
                    debug(err_2);
                    return [2, Promise.reject("Problem getting Device NAME !?")];
                case 7:
                    returnURL = licenseReturn.Href;
                    if (licenseReturn.Templated) {
                        urlTemplate = new URITemplate(returnURL);
                        uri1 = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
                        returnURL = uri1.toString();
                    }
                    if (IS_DEV) {
                        debug("RETURN: " + returnURL);
                    }
                    return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var failure, success, headers, needsStreamingResponse, response, err_3;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        failure = function (err) {
                                            reject(err);
                                        };
                                        success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            var failBuff, buffErr_1, failStr, failJson, responseData, err_4, responseStr, responseJson, newLsd;
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (IS_DEV) {
                                                            Object.keys(response.headers).forEach(function (header) {
                                                                debug(header + " => " + response.headers[header]);
                                                            });
                                                        }
                                                        if (!(response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) return [3, 5];
                                                        failBuff = void 0;
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 3, , 4]);
                                                        return [4, (0, BufferUtils_1.streamToBufferPromise)(response)];
                                                    case 2:
                                                        failBuff = _a.sent();
                                                        return [3, 4];
                                                    case 3:
                                                        buffErr_1 = _a.sent();
                                                        if (IS_DEV) {
                                                            debug(buffErr_1);
                                                        }
                                                        failure(response.statusCode);
                                                        return [2];
                                                    case 4:
                                                        try {
                                                            failStr = failBuff.toString("utf8");
                                                            if (IS_DEV) {
                                                                debug(failStr);
                                                            }
                                                            try {
                                                                failJson = global.JSON.parse(failStr);
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
                                                        return [2];
                                                    case 5:
                                                        _a.trys.push([5, 7, , 8]);
                                                        return [4, (0, BufferUtils_1.streamToBufferPromise)(response)];
                                                    case 6:
                                                        responseData = _a.sent();
                                                        return [3, 8];
                                                    case 7:
                                                        err_4 = _a.sent();
                                                        reject(err_4);
                                                        return [2];
                                                    case 8:
                                                        responseStr = responseData.toString("utf8");
                                                        if (IS_DEV) {
                                                            debug(responseStr);
                                                        }
                                                        responseJson = global.JSON.parse(responseStr);
                                                        if (IS_DEV) {
                                                            debug(responseJson);
                                                        }
                                                        try {
                                                            newLsd = (0, serializable_1.TaJsonDeserialize)(responseJson, lsd_1.LSD);
                                                            if (IS_DEV) {
                                                                debug(newLsd);
                                                            }
                                                            resolve(newLsd);
                                                        }
                                                        catch (err) {
                                                            debug(err);
                                                            resolve(responseJson);
                                                        }
                                                        return [2];
                                                }
                                            });
                                        }); };
                                        headers = Object.assign({
                                            "Accept": "application/json,application/xml",
                                            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                                            "User-Agent": "Readium2-LCP",
                                        }, httpHeaders ? httpHeaders : {});
                                        needsStreamingResponse = true;
                                        if (!needsStreamingResponse) return [3, 1];
                                        request.put({
                                            headers: headers,
                                            method: "PUT",
                                            timeout: 5000,
                                            uri: returnURL,
                                        })
                                            .on("response", function (res) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            var successError_1;
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        _a.trys.push([0, 2, , 3]);
                                                        return [4, success(res)];
                                                    case 1:
                                                        _a.sent();
                                                        return [3, 3];
                                                    case 2:
                                                        successError_1 = _a.sent();
                                                        failure(successError_1);
                                                        return [2];
                                                    case 3: return [2];
                                                }
                                            });
                                        }); })
                                            .on("error", failure);
                                        return [3, 7];
                                    case 1:
                                        response = void 0;
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4, requestPromise({
                                                headers: headers,
                                                method: "PUT",
                                                resolveWithFullResponse: true,
                                                uri: returnURL,
                                            })];
                                    case 3:
                                        response = _a.sent();
                                        return [3, 5];
                                    case 4:
                                        err_3 = _a.sent();
                                        failure(err_3);
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
        });
    });
}
exports.lsdReturn_ = lsdReturn_;
//# sourceMappingURL=return.js.map