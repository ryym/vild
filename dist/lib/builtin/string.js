"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringMessages = exports.string = exports.convertToString = void 0;
const checker_1 = require("../checker");
exports.convertToString = (val) => {
    if (val == null) {
        return undefined;
    }
    return String(val);
};
exports.string = checker_1.defineCheckers(exports.convertToString, {
    required: checker_1.check(() => (val) => {
        return { ok: val.converted != null && val.converted.length > 0 };
    }),
    trim: checker_1.check(() => (val) => {
        if (val.converted == null) {
            return { ok: false };
        }
        return { ok: true, value: val.converted.trim() };
    }),
});
exports.stringMessages = {
    required: () => 'is required',
    trim: () => '',
};
