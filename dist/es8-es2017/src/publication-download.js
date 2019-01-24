"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const zipInjector_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/zip/zipInjector");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_x_1 = require("ta-json-x");
const lcp_1 = require("./parser/epub/lcp");
const debug = debug_("r2:lcp#publication-download");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
async function downloadEPUBFromLCPL(filePath, dir, destFileName) {
    return new Promise(async (resolve, reject) => {
        const lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
        const lcplJson = global.JSON.parse(lcplStr);
        const lcpl = ta_json_x_1.JSON.deserialize(lcplJson, lcp_1.LCP);
        if (lcpl.Links) {
            const pubLink = lcpl.Links.find((link) => {
                return link.Rel === "publication";
            });
            if (pubLink) {
                const destPathTMP = path.join(dir, destFileName + ".tmp");
                const destPathFINAL = path.join(dir, destFileName);
                const failure = (err) => {
                    debug(err);
                    reject(pubLink.Href + " (" + err + ")");
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
                        const zipEntryPath = "META-INF/license.lcpl";
                        zipInjector_1.injectFileInZip(destPathTMP, destPathFINAL, filePath, zipEntryPath, zipError, doneCallback);
                    });
                };
                const needsStreamingResponse = true;
                if (needsStreamingResponse) {
                    request.get({
                        headers: {},
                        method: "GET",
                        uri: pubLink.Href,
                    })
                        .on("response", success)
                        .on("error", failure);
                }
                else {
                    let response;
                    try {
                        response = await requestPromise({
                            headers: {},
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: pubLink.Href,
                        });
                    }
                    catch (err) {
                        failure(err);
                        return;
                    }
                    await success(response);
                }
            }
        }
    });
}
exports.downloadEPUBFromLCPL = downloadEPUBFromLCPL;
//# sourceMappingURL=publication-download.js.map