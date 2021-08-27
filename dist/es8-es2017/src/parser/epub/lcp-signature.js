"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signature = void 0;
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let Signature = class Signature {
};
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("algorithm"),
    (0, tslib_1.__metadata)("design:type", String)
], Signature.prototype, "Algorithm", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("certificate"),
    (0, tslib_1.__metadata)("design:type", String)
], Signature.prototype, "Certificate", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("value"),
    (0, tslib_1.__metadata)("design:type", String)
], Signature.prototype, "Value", void 0);
Signature = (0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonObject)()
], Signature);
exports.Signature = Signature;
//# sourceMappingURL=lcp-signature.js.map