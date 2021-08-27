"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LsdEvent = exports.TypeEnum = void 0;
var tslib_1 = require("tslib");
var ta_json_x_1 = require("ta-json-x");
var TypeEnum;
(function (TypeEnum) {
    TypeEnum["Register"] = "register";
    TypeEnum["Renew"] = "renew";
    TypeEnum["Return"] = "return";
    TypeEnum["Revoke"] = "revoke";
    TypeEnum["Cancel"] = "cancel";
})(TypeEnum = exports.TypeEnum || (exports.TypeEnum = {}));
var LsdEvent = (function () {
    function LsdEvent() {
    }
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("type"),
        (0, tslib_1.__metadata)("design:type", String)
    ], LsdEvent.prototype, "Type", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("name"),
        (0, tslib_1.__metadata)("design:type", String)
    ], LsdEvent.prototype, "Name", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("id"),
        (0, tslib_1.__metadata)("design:type", String)
    ], LsdEvent.prototype, "ID", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("timestamp"),
        (0, tslib_1.__metadata)("design:type", Date)
    ], LsdEvent.prototype, "TimeStamp", void 0);
    LsdEvent = (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonObject)()
    ], LsdEvent);
    return LsdEvent;
}());
exports.LsdEvent = LsdEvent;
//# sourceMappingURL=lsd-event.js.map