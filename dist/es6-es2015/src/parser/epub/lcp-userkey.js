"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserKey = void 0;
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let UserKey = class UserKey {
};
exports.UserKey = UserKey;
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("text_hint"),
    tslib_1.__metadata("design:type", String)
], UserKey.prototype, "TextHint", void 0);
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("algorithm"),
    tslib_1.__metadata("design:type", String)
], UserKey.prototype, "Algorithm", void 0);
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("key_check"),
    tslib_1.__metadata("design:type", String)
], UserKey.prototype, "KeyCheck", void 0);
exports.UserKey = UserKey = tslib_1.__decorate([
    (0, ta_json_x_1.JsonObject)()
], UserKey);
//# sourceMappingURL=lcp-userkey.js.map