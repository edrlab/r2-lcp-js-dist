"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var BufferUtils_1 = require("r2-utils-js/dist/es5/src/_utils/stream/BufferUtils");
var bind = require("bindings");
var debug_ = require("debug");
var request = require("request");
var requestPromise = require("request-promise-native");
var ta_json_x_1 = require("ta-json-x");
var lcp_certificate_1 = require("./lcp-certificate");
var lcp_encryption_1 = require("./lcp-encryption");
var lcp_link_1 = require("./lcp-link");
var lcp_rights_1 = require("./lcp-rights");
var lcp_signature_1 = require("./lcp-signature");
var lcp_user_1 = require("./lcp-user");
var AES_BLOCK_SIZE = 16;
var debug = debug_("r2:lcp#parser/epub/lcp");
var LCP_NATIVE_PLUGIN_PATH = path.join(process.cwd(), "LCP", "lcp.node");
function setLcpNativePluginPath(filepath) {
    LCP_NATIVE_PLUGIN_PATH = filepath;
    debug(LCP_NATIVE_PLUGIN_PATH);
    var exists = fs.existsSync(LCP_NATIVE_PLUGIN_PATH);
    debug("LCP NATIVE PLUGIN: " + (exists ? "OKAY" : "MISSING"));
    return exists;
}
exports.setLcpNativePluginPath = setLcpNativePluginPath;
var LCP = (function () {
    function LCP() {
        this._usesNativeNodePlugin = undefined;
    }
    LCP.prototype.isNativeNodePlugin = function () {
        this.init();
        return this._usesNativeNodePlugin;
    };
    LCP.prototype.isReady = function () {
        if (this.isNativeNodePlugin()) {
            return typeof this._lcpContext !== "undefined";
        }
        return typeof this.ContentKey !== "undefined";
    };
    LCP.prototype.init = function () {
        if (typeof this._usesNativeNodePlugin !== "undefined") {
            return;
        }
        this.ContentKey = undefined;
        this._lcpContext = undefined;
        if (fs.existsSync(LCP_NATIVE_PLUGIN_PATH)) {
            debug("LCP _usesNativeNodePlugin");
            var filePath = path.dirname(LCP_NATIVE_PLUGIN_PATH);
            var fileName = path.basename(LCP_NATIVE_PLUGIN_PATH);
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
    };
    LCP.prototype.decrypt = function (encryptedContent, linkHref, needsInflating) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (!this.isNativeNodePlugin()) {
                    return [2, Promise.reject("direct decrypt buffer only for native plugin")];
                }
                if (!this._lcpContext) {
                    return [2, Promise.reject("LCP context not initialized (call tryUserKeys())")];
                }
                return [2, new Promise(function (resolve, reject) {
                        _this._lcpNative.decrypt(_this._lcpContext, encryptedContent, function (er, decryptedContent, inflated) {
                            if (er) {
                                debug("decrypt ERROR");
                                debug(er);
                                reject(er);
                                return;
                            }
                            var buff = decryptedContent;
                            if (!inflated) {
                                var padding = decryptedContent[decryptedContent.length - 1];
                                buff = decryptedContent.slice(0, decryptedContent.length - padding);
                            }
                            resolve({
                                buffer: buff,
                                inflated: inflated ? true : false,
                            });
                        }, _this.JsonSource, linkHref, needsInflating);
                    })];
            });
        });
    };
    LCP.prototype.tryUserKeys = function (lcpUserKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var check, crlPem_1, _i, lcpUserKeys_1, lcpUserKey;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.init();
                        check = (this.Encryption.Profile === "http://readium.org/lcp/basic-profile"
                            || this.Encryption.Profile === "http://readium.org/lcp/profile-1.0")
                            && this.Encryption.UserKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#sha256"
                            && this.Encryption.ContentKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc";
                        if (!check) {
                            debug("Incorrect LCP fields.");
                            debug(this.Encryption.Profile);
                            debug(this.Encryption.ContentKey.Algorithm);
                            debug(this.Encryption.UserKey.Algorithm);
                            return [2, Promise.reject("Incorrect LCP fields.")];
                        }
                        if (!this._usesNativeNodePlugin) return [3, 2];
                        return [4, this.getCRLPem()];
                    case 1:
                        crlPem_1 = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                _this._lcpNative.findOneValidPassphrase(_this.JsonSource, lcpUserKeys, function (err, validHashedPassphrase) {
                                    if (err) {
                                        debug("findOneValidPassphrase ERROR");
                                        debug(err);
                                        reject(err);
                                        return;
                                    }
                                    _this._lcpNative.createContext(_this.JsonSource, validHashedPassphrase, crlPem_1, function (erro, context) {
                                        if (erro) {
                                            debug("createContext ERROR");
                                            debug(erro);
                                            reject(erro);
                                            return;
                                        }
                                        _this._lcpContext = context;
                                        resolve();
                                    });
                                });
                            })];
                    case 2:
                        for (_i = 0, lcpUserKeys_1 = lcpUserKeys; _i < lcpUserKeys_1.length; _i++) {
                            lcpUserKey = lcpUserKeys_1[_i];
                            try {
                                if (this.tryUserKey(lcpUserKey)) {
                                    return [2, Promise.resolve()];
                                }
                            }
                            catch (err) {
                            }
                        }
                        return [2, Promise.reject(1)];
                }
            });
        });
    };
    LCP.prototype.getCRLPem = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var crlURL, failure, success, headers, needsStreamingResponse, response, err_1;
                        var _this = this;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    crlURL = lcp_certificate_1.CRL_URL;
                                    failure = function (err) {
                                        debug(err);
                                        resolve(lcp_certificate_1.DUMMY_CRL);
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
                                                    lcplStr = "-----BEGIN X509 CRL-----\n" +
                                                        responseData.toString("base64") + "\n-----END X509 CRL-----";
                                                    debug(lcplStr);
                                                    resolve(lcplStr);
                                                    return [2];
                                            }
                                        });
                                    }); };
                                    headers = {};
                                    needsStreamingResponse = true;
                                    if (!needsStreamingResponse) return [3, 1];
                                    request.get({
                                        headers: headers,
                                        method: "GET",
                                        uri: crlURL,
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
                                            uri: crlURL,
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
            });
        });
    };
    LCP.prototype.tryUserKey = function (lcpUserKey) {
        var userKey = new Buffer(lcpUserKey, "hex");
        var keyCheck = new Buffer(this.Encryption.UserKey.KeyCheck, "base64");
        var encryptedLicenseID = keyCheck;
        var iv = encryptedLicenseID.slice(0, AES_BLOCK_SIZE);
        var encrypted = encryptedLicenseID.slice(AES_BLOCK_SIZE);
        var decrypteds = [];
        var decryptStream = crypto.createDecipheriv("aes-256-cbc", userKey, iv);
        decryptStream.setAutoPadding(false);
        var buff1 = decryptStream.update(encrypted);
        if (buff1) {
            decrypteds.push(buff1);
        }
        var buff2 = decryptStream.final();
        if (buff2) {
            decrypteds.push(buff2);
        }
        var decrypted = Buffer.concat(decrypteds);
        var nPaddingBytes = decrypted[decrypted.length - 1];
        var size = encrypted.length - nPaddingBytes;
        var decryptedOut = decrypted.slice(0, size).toString("utf8");
        if (this.ID !== decryptedOut) {
            debug("Failed LCP ID check.");
            return false;
        }
        var encryptedContentKey = new Buffer(this.Encryption.ContentKey.EncryptedValue, "base64");
        var iv2 = encryptedContentKey.slice(0, AES_BLOCK_SIZE);
        var encrypted2 = encryptedContentKey.slice(AES_BLOCK_SIZE);
        var decrypteds2 = [];
        var decryptStream2 = crypto.createDecipheriv("aes-256-cbc", userKey, iv2);
        decryptStream2.setAutoPadding(false);
        var buff1_ = decryptStream2.update(encrypted2);
        if (buff1_) {
            decrypteds2.push(buff1_);
        }
        var buff2_ = decryptStream2.final();
        if (buff2_) {
            decrypteds2.push(buff2_);
        }
        var decrypted2 = Buffer.concat(decrypteds2);
        var nPaddingBytes2 = decrypted2[decrypted2.length - 1];
        var size2 = encrypted2.length - nPaddingBytes2;
        this.ContentKey = decrypted2.slice(0, size2);
        return true;
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
    return LCP;
}());
exports.LCP = LCP;
//# sourceMappingURL=lcp.js.map