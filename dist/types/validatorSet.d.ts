import { Validator } from './validator';
import { ValidationResult } from './checker';
declare type LitValidator<V> = Validator<V>;
declare const _isArrayValidator: unique symbol;
declare const _isObjectValidator: unique symbol;
declare type LitArrayValidator<T> = LitValidator<T> & {
    [_isArrayValidator]: true;
};
declare type ObjectArrayValidator<T> = ObjectValidator<T> & {
    [_isArrayValidator]: true;
};
declare type ArrayValidator<T> = T extends LitValidator<infer V> ? LitArrayValidator<V> : ObjectArrayValidator<T>;
declare type ObjectValidator<T> = {
    [K in keyof T]: ValidatorSetOf<T[K]>;
} & {
    [_isObjectValidator]: true;
};
export declare type ValidatorSetOf<Vs> = Vs extends Array<infer E> ? ArrayValidator<E> : Vs extends LitValidator<any> ? Vs : ObjectValidator<Vs>;
declare type AnyValidator<T> = LitValidator<T> | ArrayValidator<T> | ObjectValidator<T>;
export declare type ValidatorDefinition = {
    [key: string]: AnyValidatorDefinition;
};
declare type AnyValidatorDefinition = LitValidator<any> | LitValidator<any>[] | ValidatorDefinition | ValidatorDefinition[];
export declare type ValidatorSetResultOf<Vs extends ValidatorSet<any>> = ValidatorSetResult2<Vs['validators']>;
export interface ValidatorSetResult<Vs extends ValidatorDefinition> {
    readonly isValid: boolean;
    readonly results: ValidationResultOf<Vs>;
    readonly errors: ErrorMessagesOf<ValidationResultOf<Vs>>;
}
export interface ValidatorSetResult2<Vs extends AnyValidator<any>> {
    readonly isValid: boolean;
    readonly results: ValidationResultOf<Vs>;
    readonly errors: ErrorMessagesOf<ValidationResultOf<Vs>>;
}
export declare class ValidatorSetResultEntity2<Vr extends AnyValidationResult> {
    readonly results: Vr;
    private _isValid;
    private _errors;
    constructor(results: Vr);
    get isValid(): boolean;
    get errors(): ErrorMessagesOf<Vr>;
}
export declare type ValidationResultOf<Vs> = Vs extends ArrayValidator<infer E> ? Array<ValidationResultOf<E>> : Vs extends LitValidator<infer V> ? ValidationResult<V> : {
    [K in keyof Vs]: ValidationResultOf<Vs[K]>;
};
export declare type AnyValidationResult = ValidationResult<any> | Array<AnyValidationResult> | {
    [key: string]: AnyValidationResult;
};
export declare type TestResultOf<Vs> = Vs extends ArrayValidator<infer E> ? Array<TestResultOf<E>> : Vs extends LitValidator<infer V> ? ValidationResult<V> : {
    [K in keyof Vs]: Vs[K] extends ObjectValidator<any> ? TestResultOf<Vs[K]> | undefined : TestResultOf<Vs[K]>;
};
export declare type AnyTestResult = ValidationResult<any> | Array<AnyTestResult> | {
    [key: string]: AnyTestResult | undefined;
};
export declare class ValidatorSet<Vs extends ValidatorDefinition> {
    readonly validators: Vs;
    constructor(validators: Vs);
    newValidation: () => [Validation<Vs>, ValidatorSetOf<Vs>];
}
export interface TestOptions<T> {
    exclude?: T extends object ? (keyof T)[] : never;
}
export declare class Validation<Vs extends ValidatorDefinition> {
    test: <V extends AnyValidator<any>>(v: V, value: unknown, opts?: TestOptions<V> | undefined) => TestResultOf<V>;
    emptyResult: <V extends AnyValidator<any>>(v: V) => TestResultOf<V>;
    fixResult: (result: TestResultOf<ValidatorSetOf<Vs>>) => ValidatorSetResult2<ValidatorSetOf<Vs>>;
}
export declare type AnyErrorMessagesObject = {
    [key: string]: AnyErrorMessages;
};
export declare type AnyErrorMessages = string[] | AnyErrorMessages[] | AnyErrorMessagesObject | AnyErrorMessagesObject[];
export declare type ErrorMessagesOf<Vr> = {
    [K in keyof Vr]: Vr[K] extends ValidationResult<any> ? string[] : Vr[K] extends ValidationResult<any>[] ? string[][] : Exclude<ErrorMessagesOf<Vr[K]>, undefined>;
};
export declare type Fixed<Vr> = {
    [K in keyof Vr]: Vr[K] extends ValidationResult<any> ? Vr[K] : Exclude<Fixed<Vr[K]>, undefined>;
};
export {};
