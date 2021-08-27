"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var tslib_1 = require("tslib");
var ta_json_x_1 = require("ta-json-x");
var User = (function () {
    function User() {
    }
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("id"),
        (0, tslib_1.__metadata)("design:type", String)
    ], User.prototype, "ID", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("email"),
        (0, tslib_1.__metadata)("design:type", String)
    ], User.prototype, "Email", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("name"),
        (0, tslib_1.__metadata)("design:type", String)
    ], User.prototype, "Name", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("encrypted"),
        (0, ta_json_x_1.JsonElementType)(String),
        (0, tslib_1.__metadata)("design:type", Array)
    ], User.prototype, "Encrypted", void 0);
    User = (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonObject)()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=lcp-user.js.map