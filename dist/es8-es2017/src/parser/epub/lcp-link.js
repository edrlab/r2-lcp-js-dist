"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("length"),
    tslib_1.__metadata("design:type", Number)
], Link.prototype, "Length", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("href"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Href", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("title"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Title", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("type"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Type", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("templated"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Templated", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("profile"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Profile", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("hash"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Hash", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("rel"),
    tslib_1.__metadata("design:type", String)
], Link.prototype, "Rel", void 0);
Link = tslib_1.__decorate([
    ta_json_x_1.JsonObject()
], Link);
exports.Link = Link;
//# sourceMappingURL=lcp-link.js.map