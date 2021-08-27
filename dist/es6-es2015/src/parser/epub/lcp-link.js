"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = void 0;
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let Link = class Link {
    HasRel(rel) {
        return this.Rel === rel;
    }
    SetRel(rel) {
        this.Rel = rel;
    }
};
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("length"),
    (0, tslib_1.__metadata)("design:type", Number)
], Link.prototype, "Length", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("href"),
    (0, tslib_1.__metadata)("design:type", String)
], Link.prototype, "Href", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("title"),
    (0, tslib_1.__metadata)("design:type", String)
], Link.prototype, "Title", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("type"),
    (0, tslib_1.__metadata)("design:type", String)
], Link.prototype, "Type", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("templated"),
    (0, tslib_1.__metadata)("design:type", Boolean)
], Link.prototype, "Templated", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("profile"),
    (0, tslib_1.__metadata)("design:type", String)
], Link.prototype, "Profile", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("hash"),
    (0, tslib_1.__metadata)("design:type", String)
], Link.prototype, "Hash", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("rel"),
    (0, tslib_1.__metadata)("design:type", String)
], Link.prototype, "Rel", void 0);
Link = (0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonObject)()
], Link);
exports.Link = Link;
//# sourceMappingURL=lcp-link.js.map