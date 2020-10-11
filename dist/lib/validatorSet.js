"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = exports.ValidatorSet = exports.ValidatorSetResultEntity2 = void 0;
const validator_1 = require("./validator");
const checker_1 = require("./checker");
const _isArrayValidator = Symbol('_isArrayValidator');
const isArrayValidator = (v) => {
    return v != null && _isArrayValidator in v;
};
const _isObjectValidator = Symbol('_isObjectValidator');
const isObjectValidator = (v) => {
    return v != null && _isObjectValidator in v;
};
const _buildValidatorSet = (v) => {
    if (Array.isArray(v)) {
        if (v.length !== 1) {
            throw new Error('[vild] array in validatorSet must be a tuple like [validator]');
        }
        const av = _buildValidatorSet(v[0]);
        av[_isArrayValidator] = true;
        return av;
    }
    if (validator_1.isValidator(v)) {
        return v;
    }
    const ov = {};
    for (const k in v) {
        ov[k] = _buildValidatorSet(v[k]);
    }
    ov[_isObjectValidator] = true;
    return ov;
};
class ValidatorSetResultEntity2 {
    constructor(results) {
        this.results = results;
        this._isValid = null;
        this._errors = null;
    }
    get isValid() {
        if (this._isValid != null) {
            return this._isValid;
        }
        return (this._isValid = _isValid(this.results));
    }
    get errors() {
        if (this._errors != null) {
            return this._errors;
        }
        return (this._errors = _extractErrorMessages(this.results));
    }
}
exports.ValidatorSetResultEntity2 = ValidatorSetResultEntity2;
class ValidatorSet {
    constructor(validators) {
        this.validators = validators;
        this.newValidation = () => {
            const vs = _buildValidatorSet(this.validators);
            return [new Validation(), vs];
        };
    }
}
exports.ValidatorSet = ValidatorSet;
class Validation {
    constructor() {
        // readonly result = new ValidationResultBuilder();
        this.test = (v, value, opts) => {
            return _test(v, value, opts || {});
        };
        this.emptyResult = (v) => {
            return _empty(v);
        };
        this.fixResult = (result) => {
            const checkedResult = _assertAllResultsSet(result, 'root');
            return new ValidatorSetResultEntity2(checkedResult);
        };
    }
}
exports.Validation = Validation;
// 配列とネストしたオブジェクトには結果をセットしない。
const _test = (v, value, opts) => {
    if (isArrayValidator(v)) {
        return [];
    }
    if (isObjectValidator(v)) {
        const exclude = new Set(opts.exclude || []);
        const result = {};
        for (const k in v) {
            if (isObjectValidator(v[k])) {
                result[k] = undefined;
            }
            else if (isArrayValidator(v[k])) {
                result[k] = [];
            }
            else {
                const shouldTest = value != null && k in value && !exclude.has(k);
                result[k] = shouldTest ? v[k].test(value[k]) : checker_1.ValidationResultEntity.untested();
            }
        }
        return result;
    }
    return v.test(value);
};
const _empty = (v) => {
    if (isArrayValidator(v)) {
        return [];
    }
    if (isObjectValidator(v)) {
        const result = {};
        for (const k in v) {
            result[k] = isObjectValidator(v[k]) ? undefined : checker_1.ValidationResultEntity.untested();
        }
        return result;
    }
    return checker_1.ValidationResultEntity.untested();
};
const _assertAllResultsSet = (result, path) => {
    if (result == undefined) {
        throw new Error(`[vild] result.build: ${path} is not set`);
    }
    if (checker_1.isValidationResult(result)) {
        return result;
    }
    if (Array.isArray(result)) {
        return result.map((e, i) => _assertAllResultsSet(e, `${path}[${i}]`));
    }
    const results = {};
    for (const k in result) {
        results[k] = _assertAllResultsSet(result[k], `${path}.${k}`);
    }
    return results;
};
const _extractErrorMessages = (results) => {
    if (Array.isArray(results)) {
        return results.map((r) => _extractErrorMessages(r));
    }
    if (checker_1.isValidationResult(results)) {
        return results.errors.map((e) => e.message);
    }
    const errors = {};
    for (const key in results) {
        errors[key] = _extractErrorMessages(results[key]);
    }
    return errors;
};
const _isValid = (results) => {
    if (Array.isArray(results)) {
        return results.every((r) => _isValid(r));
    }
    if (checker_1.isValidationResult(results)) {
        return results.ok;
    }
    for (const key in results) {
        if (!_isValid(results[key])) {
            return false;
        }
    }
    return true;
};
