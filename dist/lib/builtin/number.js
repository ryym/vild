"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberMessages = exports.number = exports.convertToNumber = void 0;
const checker_1 = require("../checker");
exports.convertToNumber = (val) => {
    switch (typeof val) {
        case 'number':
            return val;
        case 'string': {
            if (val.trim().length === 0) {
                return undefined;
            }
            const n = Number(val);
            return Number.isNaN(n) ? undefined : n;
        }
        default:
            return undefined;
    }
};
exports.number = checker_1.defineCheckers(exports.convertToNumber, {
    required: checker_1.check(() => (val) => {
        const empty = val.original == false && val.original !== 0;
        return { ok: !empty };
    }),
    valid: checker_1.check(() => (val) => {
        return { ok: val.original == false || val.converted != null };
    }),
    min: checker_1.check((min) => (val) => {
        return { ok: val.converted == null || min <= val.converted };
    }),
    max: checker_1.check((max) => (val) => {
        return { ok: val.converted == null || val.converted <= max };
    }),
});
exports.numberMessages = {
    required: () => 'is required',
    valid: () => 'not a number',
    min: (min) => `must be greater than or equal to ${min}`,
    max: (max) => `must be less than or equal to ${max}`,
};
