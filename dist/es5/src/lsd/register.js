"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var debug_ = require("debug");
var request = require("request");
var requestPromise = require("request-promise-native");
var URITemplate = require("urijs/src/URITemplate");
var debug = debug_("r2:lcp#lsd/register");
function lsdRegister(lsdJson, deviceIDManager) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var licenseRegister, deviceID, err_1, deviceNAME, err_2, doRegister, deviceIDForStatusDoc, err_3, registerURL, urlTemplate;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!lsdJson.links) {
                        return [2, Promise.reject("No LSD links!")];
                    }
                    licenseRegister = lsdJson.links.find(function (link) {
                        return link.rel === "register";
                    });
                    if (!licenseRegister) {
                        return [2, Promise.reject("No LSD register link!")];
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
                    doRegister = false;
                    if (!(lsdJson.status === "ready")) return [3, 8];
                    doRegister = true;
                    return [3, 13];
                case 8:
                    if (!(lsdJson.status === "active")) return [3, 13];
                    deviceIDForStatusDoc = void 0;
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    return [4, deviceIDManager.checkDeviceID(lsdJson.id)];
                case 10:
                    deviceIDForStatusDoc = _a.sent();
                    return [3, 12];
                case 11:
                    err_3 = _a.sent();
                    debug(err_3);
                    return [3, 12];
                case 12:
                    if (!deviceIDForStatusDoc) {
                        doRegister = true;
                    }
                    else if (deviceIDForStatusDoc !== deviceID) {
                        debug("LSD registered device ID is different? ", lsdJson.id, ": ", deviceIDForStatusDoc, " --- ", deviceID);
                        doRegister = true;
                    }
                    _a.label = 13;
                case 13:
                    if (!doRegister) {
                        return [2, Promise.reject("No need to LSD register.")];
                    }
                    registerURL = licenseRegister.href;
                    if (licenseRegister.templated === true || licenseRegister.templated === "true") {
                        urlTemplate = new URITemplate(registerURL);
                        registerURL = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
                    }
                    debug("REGISTER: " + registerURL);
                    return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var failure, success, headers, needsStreamingResponse, response, err_4;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        failure = function (err) {
                                            reject(err);
                                        };
                                        success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            var d, err_5, s, responseData, err_6, responseStr, responseJson, err_7;
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
                                                        err_5 = _a.sent();
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
                                                        err_6 = _a.sent();
                                                        reject(err_6);
                                                        return [2];
                                                    case 8:
                                                        responseStr = responseData.toString("utf8");
                                                        debug(responseStr);
                                                        responseJson = global.JSON.parse(responseStr);
                                                        debug(responseJson);
                                                        debug(responseJson.status);
                                                        if (!(responseJson.status === "active")) return [3, 12];
                                                        _a.label = 9;
                                                    case 9:
                                                        _a.trys.push([9, 11, , 12]);
                                                        return [4, deviceIDManager.recordDeviceID(responseJson.id)];
                                                    case 10:
                                                        _a.sent();
                                                        return [3, 12];
                                                    case 11:
                                                        err_7 = _a.sent();
                                                        debug(err_7);
                                                        return [3, 12];
                                                    case 12:
                                                        resolve(responseJson);
                                                        return [2];
                                                }
                                            });
                                        }); };
                                        headers = {
                                            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                                        };
                                        needsStreamingResponse = true;
                                        if (!needsStreamingResponse) return [3, 1];
                                        request.post({
                                            headers: headers,
                                            method: "POST",
                                            uri: registerURL,
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
                                                method: "POST",
                                                resolveWithFullResponse: true,
                                                uri: registerURL,
                                            })];
                                    case 3:
                                        response = _a.sent();
                                        return [3, 5];
                                    case 4:
                                        err_4 = _a.sent();
                                        failure(err_4);
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
exports.lsdRegister = lsdRegister;
//# sourceMappingURL=register.js.map