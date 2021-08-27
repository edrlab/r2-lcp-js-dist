"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encrypted = void 0;
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let Encrypted = class Encrypted {
    constructor() {
        this.DecryptedLengthBeforeInflate = -1;
        this.CypherBlockPadding = -1;
    }
    get OriginalLength() {
        return typeof this.OriginalLength2 !== "undefined" ? this.OriginalLength2 : this.OriginalLength1;
    }
    set OriginalLength(length) {
        if (typeof length !== "undefined") {
            this.OriginalLength1 = undefined;
            this.OriginalLength2 = length;
        }
    }
};
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("scheme"),
    (0, tslib_1.__metadata)("design:type", String)
], Encrypted.prototype, "Scheme", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("profile"),
    (0, tslib_1.__metadata)("design:type", String)
], Encrypted.prototype, "Profile", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("algorithm"),
    (0, tslib_1.__metadata)("design:type", String)
], Encrypted.prototype, "Algorithm", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("compression"),
    (0, tslib_1.__metadata)("design:type", String)
], Encrypted.prototype, "Compression", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("originalLength"),
    (0, tslib_1.__metadata)("design:type", Number)
], Encrypted.prototype, "OriginalLength2", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("original-length"),
    (0, tslib_1.__metadata)("design:type", Object)
], Encrypted.prototype, "OriginalLength1", void 0);
Encrypted = (0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonObject)()
], Encrypted);
exports.Encrypted = Encrypted;
//# sourceMappingURL=metadata-encrypted.js.map