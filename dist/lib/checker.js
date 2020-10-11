"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineCheckers = exports.isCheckResult = exports.check = exports.Checker = exports.ValidationResultEntity = exports.isValidationResult = void 0;
exports.isValidationResult = (result) => {
    return result instanceof ValidationResultEntity;
};
class ValidationResultEntity {
    constructor(errors, value) {
        this.errors = errors;
        this.value = value;
        this.ok = errors.length === 0;
        this.tested = value !== undefined;
    }
    static untested() {
        return new ValidationResultEntity([]);
    }
    static tested(errors, value) {
        return new ValidationResultEntity(errors, value);
    }
}
exports.ValidationResultEntity = ValidationResultEntity;
class Checker {
    constructor(checkWith) {
        this.checkWith = checkWith;
    }
}
exports.Checker = Checker;
exports.check = (fn) => {
    return new Checker(fn);
};
exports.isCheckResult = (result) => {
    return 'ok' in result;
};
exports.defineCheckers = (convert, checkers) => {
    return { convert, checkers };
};
