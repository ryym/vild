"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidator = exports.CustomValidator = exports.createValidator = void 0;
const checker_1 = require("./checker");
class ChainValidatorBase {
    constructor(_checks, _options) {
        this._checks = _checks;
        this._options = _options;
    }
    test(originalValue, context) {
        const converted = this._options.convert(originalValue);
        const value = { original: originalValue, converted };
        const meta = { context, locale: this._options.getLocale() };
        return validateValue(value, this._checks, meta, this._options.getMessage);
    }
}
exports.createValidator = (checkerContainer, options) => {
    const { checkers, convert } = checkerContainer;
    const getMessage = (name, args) => {
        const msgs = options.messages();
        const msg = msgs[name];
        if (msg == null) {
            throw new Error(`[vild] message function not defined for ${name}`);
        }
        return msg(...args);
    };
    const baseOptions = {
        convert,
        getLocale: options.locale,
        getMessage,
    };
    class ValidatorInner extends ChainValidatorBase {
    }
    const chain = {};
    for (const name of Object.keys(checkers)) {
        chain[name] = function (...args) {
            const check = checkers[name].checkWith(...args);
            const checks = [...this._checks, { name, check, args }];
            return new ValidatorInner(checks, baseOptions);
        };
    }
    Object.assign(ValidatorInner.prototype, chain);
    return new ValidatorInner([], baseOptions);
};
class CustomValidator extends ChainValidatorBase {
    check(name, check) {
        this._checks.push({ name, check, args: [] });
        return this;
    }
}
exports.CustomValidator = CustomValidator;
CustomValidator.defaultConverter = () => {
    return (value) => value;
};
const validateValue = (firstValue, checks, meta, getMessage) => {
    const errors = [];
    let value = firstValue;
    for (const { name, args, check } of checks) {
        const result = check(value, meta);
        if (checker_1.isCheckResult(result)) {
            if ('value' in result) {
                value = { original: firstValue.original, converted: result.value };
            }
            if (!result.ok) {
                const message = getMessage(name, args, result);
                errors.push({ name, message });
                break;
            }
        }
        else {
            errors.push(...result.errors);
            value = result.value;
        }
    }
    return checker_1.ValidationResultEntity.tested(errors, value);
};
exports.isValidator = (v) => {
    return typeof v.test === 'function';
};
