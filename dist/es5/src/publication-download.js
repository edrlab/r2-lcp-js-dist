"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadEPUBFromLCPL = downloadEPUBFromLCPL;
var tslib_1 = require("tslib");
var debug_ = require("debug");
var fs = require("fs");
var path = require("path");
var request = require("request");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var zipInjector_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zipInjector");
var lcp_1 = require("./parser/epub/lcp");
var serializable_1 = require("./serializable");
var debug = debug_("r2:lcp#publication-download");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function downloadEPUBFromLCPL(filePath, dir, destFileName) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var lcplStr, lcplJson, lcpl, pubLink_1, isAudio_1, isAudioLcp_1, ext, destPathTMP_1, destPathFINAL_1, failure_1, success_1;
                    var _this = this;
                    return tslib_1.__generator(this, function (_a) {
                        lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
                        lcplJson = global.JSON.parse(lcplStr);
                        lcpl = (0, serializable_1.TaJsonDeserialize)(lcplJson, lcp_1.LCP);
                        if (lcpl.Links) {
                            pubLink_1 = lcpl.Links.find(function (link) {
                                return link.Rel === "publication";
                            });
                            if (pubLink_1) {
                                isAudio_1 = pubLink_1.Type === "application/audiobook+zip";
                                isAudioLcp_1 = pubLink_1.Type === "application/audiobook+lcp";
                                ext = isAudio_1 ? ".audiobook" : (isAudioLcp_1 ? ".lcpa" : ".epub");
                                destPathTMP_1 = path.join(dir, destFileName + ".tmp");
                                destPathFINAL_1 = path.join(dir, destFileName + ext);
                                failure_1 = function (err) {
                                    debug(err);
                                    reject(pubLink_1.Href + " (" + err + ")");
                                };
                                success_1 = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    var failBuff, buffErr_1, failStr, failJson, destStreamTMP;
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
                                                failure_1(response.statusCode);
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
                                                        failure_1(failJson);
                                                    }
                                                    catch (jsonErr) {
                                                        if (IS_DEV) {
                                                            debug(jsonErr);
                                                        }
                                                        failure_1({ httpStatusCode: response.statusCode, httpResponseBody: failStr });
                                                    }
                                                }
                                                catch (strErr) {
                                                    if (IS_DEV) {
                                                        debug(strErr);
                                                    }
                                                    failure_1(response.statusCode);
                                                }
                                                return [2];
                                            case 5:
                                                destStreamTMP = fs.createWriteStream(destPathTMP_1);
                                                response.pipe(destStreamTMP);
                                                destStreamTMP.on("finish", function () {
                                                    var zipError = function (err) {
                                                        debug(err);
                                                        reject(destPathTMP_1 + " (" + err + ")");
                                                    };
                                                    var doneCallback = function () {
                                                        setTimeout(function () {
                                                            fs.unlinkSync(destPathTMP_1);
                                                        }, 1000);
                                                        resolve([destPathFINAL_1, pubLink_1.Href]);
                                                    };
                                                    var zipEntryPath = (isAudio_1 || isAudioLcp_1) ? "license.lcpl" : "META-INF/license.lcpl";
                                                    (0, zipInjector_1.injectFileInZip)(destPathTMP_1, destPathFINAL_1, filePath, zipEntryPath, zipError, doneCallback);
                                                });
                                                return [2];
                                        }
                                    });
                                }); };
                                request.get({
                                    headers: {},
                                    method: "GET",
                                    timeout: 5000,
                                    uri: pubLink_1.Href,
                                })
                                    .on("response", function (res) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    var successError_1;
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 2, , 3]);
                                                return [4, success_1(res)];
                                            case 1:
                                                _a.sent();
                                                return [3, 3];
                                            case 2:
                                                successError_1 = _a.sent();
                                                failure_1(successError_1);
                                                return [2];
                                            case 3: return [2];
                                        }
                                    });
                                }); })
                                    .on("error", failure_1);
                            }
                        }
                        return [2];
                    });
                }); })];
        });
    });
}
//# sourceMappingURL=publication-download.js.map