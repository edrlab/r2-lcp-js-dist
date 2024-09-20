"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadEPUBFromLCPL = downloadEPUBFromLCPL;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const fs = require("fs");
const path = require("path");
const request = require("request");
const BufferUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/stream/BufferUtils");
const zipInjector_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/zip/zipInjector");
const lcp_1 = require("./parser/epub/lcp");
const serializable_1 = require("./serializable");
const debug = debug_("r2:lcp#publication-download");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function downloadEPUBFromLCPL(filePath, dir, destFileName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
            const lcplJson = global.JSON.parse(lcplStr);
            const lcpl = (0, serializable_1.TaJsonDeserialize)(lcplJson, lcp_1.LCP);
            if (lcpl.Links) {
                const pubLink = lcpl.Links.find((link) => {
                    return link.Rel === "publication";
                });
                if (pubLink) {
                    const isAudio = pubLink.Type === "application/audiobook+zip";
                    const isAudioLcp = pubLink.Type === "application/audiobook+lcp";
                    const ext = isAudio ? ".audiobook" : (isAudioLcp ? ".lcpa" : ".epub");
                    const destPathTMP = path.join(dir, destFileName + ".tmp");
                    const destPathFINAL = path.join(dir, destFileName + ext);
                    const failure = (err) => {
                        debug(err);
                        reject(pubLink.Href + " (" + err + ")");
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
                                failBuff = yield (0, BufferUtils_1.streamToBufferPromise)(response);
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
                        const destStreamTMP = fs.createWriteStream(destPathTMP);
                        response.pipe(destStreamTMP);
                        destStreamTMP.on("finish", () => {
                            const zipError = (err) => {
                                debug(err);
                                reject(destPathTMP + " (" + err + ")");
                            };
                            const doneCallback = () => {
                                setTimeout(() => {
                                    fs.unlinkSync(destPathTMP);
                                }, 1000);
                                resolve([destPathFINAL, pubLink.Href]);
                            };
                            const zipEntryPath = (isAudio || isAudioLcp) ? "license.lcpl" : "META-INF/license.lcpl";
                            (0, zipInjector_1.injectFileInZip)(destPathTMP, destPathFINAL, filePath, zipEntryPath, zipError, doneCallback);
                        });
                    });
                    request.get({
                        headers: {},
                        method: "GET",
                        timeout: 5000,
                        uri: pubLink.Href,
                    })
                        .on("response", (res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        try {
                            yield success(res);
                        }
                        catch (successError) {
                            failure(successError);
                            return;
                        }
                    }))
                        .on("error", failure);
                }
            }
        }));
    });
}
//# sourceMappingURL=publication-download.js.map