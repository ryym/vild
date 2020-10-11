"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtin = void 0;
const number_1 = require("./number");
const string_1 = require("./string");
const containers = {
    number: number_1.number,
    string: string_1.string,
};
exports.builtin = {
    validators: containers,
    messages: {
        number: number_1.numberMessages,
        string: string_1.stringMessages,
    },
};
