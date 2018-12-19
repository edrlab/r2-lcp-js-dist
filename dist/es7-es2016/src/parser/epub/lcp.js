"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const BufferUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/stream/BufferUtils");
const bind = require("bindings");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_x_1 = require("ta-json-x");
const lcp_certificate_1 = require("./lcp-certificate");
const lcp_encryption_1 = require("./lcp-encryption");
const lcp_link_1 = require("./lcp-link");
const lcp_rights_1 = require("./lcp-rights");
const lcp_signature_1 = require("./lcp-signature");
const lcp_user_1 = require("./lcp-user");
const AES_BLOCK_SIZE = 16;
const debug = debug_("r2:lcp#parser/epub/lcp");
let LCP_NATIVE_PLUGIN_PATH = path.join(process.cwd(), "LCP", "lcp.node");
function setLcpNativePluginPath(filepath) {
    LCP_NATIVE_PLUGIN_PATH = filepath;
    debug(LCP_NATIVE_PLUGIN_PATH);
    const exists = fs.existsSync(LCP_NATIVE_PLUGIN_PATH);
    debug("LCP NATIVE PLUGIN: " + (exists ? "OKAY" : "MISSING"));
    return exists;
}
exports.setLcpNativePluginPath = setLcpNativePluginPath;
let LCP = class LCP {
    constructor() {
        this._usesNativeNodePlugin = undefined;
    }
    isNativeNodePlugin() {
        this.init();
        return this._usesNativeNodePlugin;
    }
    isReady() {
        if (this.isNativeNodePlugin()) {
            return typeof this._lcpContext !== "undefined";
        }
        return typeof this.ContentKey !== "undefined";
    }
    init() {
        if (typeof this._usesNativeNodePlugin !== "undefined") {
            return;
        }
        this.ContentKey = undefined;
        this._lcpContext = undefined;
        if (fs.existsSync(LCP_NATIVE_PLUGIN_PATH)) {
            debug("LCP _usesNativeNodePlugin");
            const filePath = path.dirname(LCP_NATIVE_PLUGIN_PATH);
            const fileName = path.basename(LCP_NATIVE_PLUGIN_PATH);
            debug(filePath);
            debug(fileName);
            this._usesNativeNodePlugin = true;
            this._lcpNative = bind({
                bindings: fileName,
                module_root: filePath,
                try: [[
                        "module_root",
                        "bindings",
                    ]],
            });
        }
        else {
            debug("LCP JS impl");
            this._usesNativeNodePlugin = false;
            this._lcpNative = undefined;
        }
    }
    decrypt(encryptedContent, linkHref, needsInflating) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.isNativeNodePlugin()) {
                return Promise.reject("direct decrypt buffer only for native plugin");
            }
            if (!this._lcpContext) {
                return Promise.reject("LCP context not initialized (call tryUserKeys())");
            }
            return new Promise((resolve, reject) => {
                this._lcpNative.decrypt(this._lcpContext, encryptedContent, (er, decryptedContent, inflated) => {
                    if (er) {
                        debug("decrypt ERROR");
                        debug(er);
                        reject(er);
                        return;
                    }
                    let buff = decryptedContent;
                    if (!inflated) {
                        const padding = decryptedContent[decryptedContent.length - 1];
                        buff = decryptedContent.slice(0, decryptedContent.length - padding);
                    }
                    resolve({
                        buffer: buff,
                        inflated: inflated ? true : false,
                    });
                }, this.JsonSource, linkHref, needsInflating);
            });
        });
    }
    tryUserKeys(lcpUserKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.init();
            const check = (this.Encryption.Profile === "http://readium.org/lcp/basic-profile"
                || this.Encryption.Profile === "http://readium.org/lcp/profile-1.0")
                && this.Encryption.UserKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#sha256"
                && this.Encryption.ContentKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc";
            if (!check) {
                debug("Incorrect LCP fields.");
                debug(this.Encryption.Profile);
                debug(this.Encryption.ContentKey.Algorithm);
                debug(this.Encryption.UserKey.Algorithm);
                return Promise.reject("Incorrect LCP fields.");
            }
            if (this._usesNativeNodePlugin) {
                const crlPem = yield this.getCRLPem();
                return new Promise((resolve, reject) => {
                    this._lcpNative.findOneValidPassphrase(this.JsonSource, lcpUserKeys, (err, validHashedPassphrase) => {
                        if (err) {
                            debug("findOneValidPassphrase ERROR");
                            debug(err);
                            reject(err);
                            return;
                        }
                        this._lcpNative.createContext(this.JsonSource, validHashedPassphrase, crlPem, (erro, context) => {
                            if (erro) {
                                debug("createContext ERROR");
                                debug(erro);
                                reject(erro);
                                return;
                            }
                            this._lcpContext = context;
                            resolve();
                        });
                    });
                });
            }
            for (const lcpUserKey of lcpUserKeys) {
                try {
                    if (this.tryUserKey(lcpUserKey)) {
                        return Promise.resolve();
                    }
                }
                catch (err) {
                }
            }
            return Promise.reject(1);
        });
    }
    getCRLPem() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const crlURL = lcp_certificate_1.CRL_URL;
                const failure = (err) => {
                    debug(err);
                    resolve(lcp_certificate_1.DUMMY_CRL);
                };
                const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    Object.keys(response.headers).forEach((header) => {
                        debug(header + " => " + response.headers[header]);
                    });
                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                        failure("HTTP CODE " + response.statusCode);
                        let d;
                        try {
                            d = yield BufferUtils_1.streamToBufferPromise(response);
                        }
                        catch (err) {
                            return;
                        }
                        const s = d.toString("utf8");
                        debug(s);
                        return;
                    }
                    let responseData;
                    try {
                        responseData = yield BufferUtils_1.streamToBufferPromise(response);
                    }
                    catch (err) {
                        reject(err);
                        return;
                    }
                    const lcplStr = "-----BEGIN X509 CRL-----\n" +
                        responseData.toString("base64") + "\n-----END X509 CRL-----";
                    debug(lcplStr);
                    resolve(lcplStr);
                });
                const headers = {};
                const needsStreamingResponse = true;
                if (needsStreamingResponse) {
                    request.get({
                        headers,
                        method: "GET",
                        uri: crlURL,
                    })
                        .on("response", success)
                        .on("error", failure);
                }
                else {
                    let response;
                    try {
                        response = yield requestPromise({
                            headers,
                            method: "GET",
                            resolveWithFullResponse: true,
                            uri: crlURL,
                        });
                    }
                    catch (err) {
                        failure(err);
                        return;
                    }
                    yield success(response);
                }
            }));
        });
    }
    tryUserKey(lcpUserKey) {
        const userKey = new Buffer(lcpUserKey, "hex");
        const keyCheck = new Buffer(this.Encryption.UserKey.KeyCheck, "base64");
        const encryptedLicenseID = keyCheck;
        const iv = encryptedLicenseID.slice(0, AES_BLOCK_SIZE);
        const encrypted = encryptedLicenseID.slice(AES_BLOCK_SIZE);
        const decrypteds = [];
        const decryptStream = crypto.createDecipheriv("aes-256-cbc", userKey, iv);
        decryptStream.setAutoPadding(false);
        const buff1 = decryptStream.update(encrypted);
        if (buff1) {
            decrypteds.push(buff1);
        }
        const buff2 = decryptStream.final();
        if (buff2) {
            decrypteds.push(buff2);
        }
        const decrypted = Buffer.concat(decrypteds);
        const nPaddingBytes = decrypted[decrypted.length - 1];
        const size = encrypted.length - nPaddingBytes;
        const decryptedOut = decrypted.slice(0, size).toString("utf8");
        if (this.ID !== decryptedOut) {
            debug("Failed LCP ID check.");
            return false;
        }
        const encryptedContentKey = new Buffer(this.Encryption.ContentKey.EncryptedValue, "base64");
        const iv2 = encryptedContentKey.slice(0, AES_BLOCK_SIZE);
        const encrypted2 = encryptedContentKey.slice(AES_BLOCK_SIZE);
        const decrypteds2 = [];
        const decryptStream2 = crypto.createDecipheriv("aes-256-cbc", userKey, iv2);
        decryptStream2.setAutoPadding(false);
        const buff1_ = decryptStream2.update(encrypted2);
        if (buff1_) {
            decrypteds2.push(buff1_);
        }
        const buff2_ = decryptStream2.final();
        if (buff2_) {
            decrypteds2.push(buff2_);
        }
        const decrypted2 = Buffer.concat(decrypteds2);
        const nPaddingBytes2 = decrypted2[decrypted2.length - 1];
        const size2 = encrypted2.length - nPaddingBytes2;
        this.ContentKey = decrypted2.slice(0, size2);
        return true;
    }
};
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("id"),
    tslib_1.__metadata("design:type", String)
], LCP.prototype, "ID", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("provider"),
    tslib_1.__metadata("design:type", String)
], LCP.prototype, "Provider", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("issued"),
    tslib_1.__metadata("design:type", Date)
], LCP.prototype, "Issued", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("updated"),
    tslib_1.__metadata("design:type", Date)
], LCP.prototype, "Updated", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("encryption"),
    tslib_1.__metadata("design:type", lcp_encryption_1.Encryption)
], LCP.prototype, "Encryption", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("rights"),
    tslib_1.__metadata("design:type", lcp_rights_1.Rights)
], LCP.prototype, "Rights", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("user"),
    tslib_1.__metadata("design:type", lcp_user_1.User)
], LCP.prototype, "User", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("signature"),
    tslib_1.__metadata("design:type", lcp_signature_1.Signature)
], LCP.prototype, "Signature", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("links"),
    ta_json_x_1.JsonElementType(lcp_link_1.Link),
    tslib_1.__metadata("design:type", Array)
], LCP.prototype, "Links", void 0);
LCP = tslib_1.__decorate([
    ta_json_x_1.JsonObject()
], LCP);
exports.LCP = LCP;
//# sourceMappingURL=lcp.js.map