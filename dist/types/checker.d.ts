import { Meta } from './meta';
export declare type CheckedValue<V> = {
    readonly original: unknown;
    readonly converted: V | undefined;
};
export declare type TestedValidationResult<V> = {
    readonly ok: true;
    readonly tested: true;
    readonly errors: ErrorInfo[];
    readonly value: {
        original: unknown;
        converted: V;
    };
} | {
    readonly ok: false;
    readonly tested: true;
    readonly errors: ErrorInfo[];
    readonly value: {
        original: unknown;
        converted: V | undefined;
    };
};
export declare type UntestedValidationResult = {
    readonly ok: true;
    readonly tested: false;
    readonly errors: ErrorInfo[];
    readonly value: undefined;
};
export declare type ValidationResult<V> = TestedValidationResult<V> | UntestedValidationResult;
export declare const isValidationResult: <V>(result: unknown) => result is ValidationResult<V>;
export declare class ValidationResultEntity<V> {
    readonly errors: ErrorInfo[];
    readonly value?: CheckedValue<V> | undefined;
    static untested(): UntestedValidationResult;
    static tested<V>(errors: ErrorInfo[], value: CheckedValue<V>): TestedValidationResult<V>;
    readonly ok: boolean;
    readonly tested: boolean;
    private constructor();
}
export declare type ErrorInfo = {
    readonly name: string;
    readonly message: string;
};
export declare type CheckResult<V> = {
    ok: boolean;
    value?: V;
    message?: string;
};
export declare type CheckFn<V> = (value: CheckedValue<V>, meta: Meta) => CheckResult<V> | TestedValidationResult<V>;
export declare class Checker<V, Args extends unknown[]> {
    readonly checkWith: (...args: Args) => CheckFn<V>;
    constructor(checkWith: (...args: Args) => CheckFn<V>);
}
export declare const check: <Args extends unknown[], V>(fn: (...args: Args) => CheckFn<V>) => Checker<V, Args>;
export declare const isCheckResult: <V>(result: CheckResult<V> | {
    readonly ok: true;
    readonly tested: true;
    readonly errors: ErrorInfo[];
    readonly value: {
        original: unknown;
        converted: V;
    };
} | {
    readonly ok: false;
    readonly tested: true;
    readonly errors: ErrorInfo[];
    readonly value: {
        original: unknown;
        converted: V | undefined;
    };
}) => result is CheckResult<V>;
export declare type CheckerSet<V = any> = Record<string, Checker<V, any[]>>;
export declare type ValueConverter<V> = (value: unknown) => V | undefined;
export declare type CheckerContainer<V, Cs extends CheckerSet<V>> = {
    readonly checkers: Cs;
    readonly convert: ValueConverter<V>;
};
export declare const defineCheckers: <V, Cs extends Record<string, Checker<V, any[]>>>(convert: ValueConverter<V>, checkers: Cs) => CheckerContainer<V, Cs>;
