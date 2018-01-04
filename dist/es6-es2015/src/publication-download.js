"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs");
const path = require("path");
const zipInjector_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/zip/zipInjector");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_1 = require("ta-json");
const lcp_1 = require("./parser/epub/lcp");
const debug = debug_("r2:lcp:epub-download");
function downloadEPUBFromLCPL(filePath, dir, destFileName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
            const lcplJson = global.JSON.parse(lcplStr);
            const lcpl = ta_json_1.JSON.deserialize(lcplJson, lcp_1.LCP);
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
                    const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        Object.keys(response.headers).forEach((header) => {
                            debug(header + " => " + response.headers[header]);
                        });
                        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                            failure("HTTP CODE " + response.statusCode);
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
                    });
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
                            response = yield requestPromise({
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
                        yield success(response);
                    }
                }
            }
        }));
    });
}
exports.downloadEPUBFromLCPL = downloadEPUBFromLCPL;
//# sourceMappingURL=publication-download.js.map