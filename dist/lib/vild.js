"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVildAndConfig = void 0;
const validator_1 = require("./validator");
const validatorSet_1 = require("./validatorSet");
class VildBase {
    constructor(_options) {
        this._options = _options;
        this.custom = (options = {}) => {
            var _a;
            return new validator_1.CustomValidator([], {
                convert: (_a = options.convert) !== null && _a !== void 0 ? _a : validator_1.CustomValidator.defaultConverter(),
                getLocale: this._options.getLocale,
                getMessage: (name, _args, result) => {
                    var _a;
                    return (_a = result.message) !== null && _a !== void 0 ? _a : `custom validation [${name}] failed`;
                },
            });
        };
        this.validatorSet = (validators) => {
            return new validatorSet_1.ValidatorSet(validators);
        };
    }
}
exports.createVildAndConfig = (options) => {
    const state = {
        locale: undefined,
        messages: options.messages,
    };
    const containerSet = options.validators;
    const chains = {};
    for (const name of Object.keys(containerSet)) {
        const container = containerSet[name];
        const validator = validator_1.createValidator(container, {
            locale: () => state.locale,
            messages: () => state.messages[name],
        });
        chains[name] = () => validator;
    }
    const config = {
        setMessages(locale, messages) {
            state.locale = locale;
            state.messages = messages;
        },
    };
    const vildBase = new VildBase({ getLocale: () => state.locale });
    const vild = Object.assign(vildBase, chains);
    return [vild, config];
};
