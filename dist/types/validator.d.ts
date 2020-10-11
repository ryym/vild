import { ValidationResult, ValueConverter } from './checker';
import type { Checker, CheckFn, CheckerSet, CheckerContainer, CheckResult } from './checker';
import type { MessagesForCheckerSet } from './messages';
export declare type Validator<V> = {
    test(value: unknown, context?: unknown): ValidationResult<V>;
};
export declare type CheckerChain<V, Cs extends CheckerSet> = {
    [K in keyof Cs]: Cs[K] extends Checker<V, infer Args> ? (...args: Args) => ChainValidator<V, Cs> : never;
};
export declare type ChainValidator<V, Cs extends CheckerSet> = CheckerChain<V, Cs> & Validator<V>;
declare type ValidatorOptions<Cs extends CheckerSet> = {
    locale: () => string | undefined;
    messages: () => MessagesForCheckerSet<Cs>;
};
declare type CheckItem<V> = {
    readonly name: string;
    readonly args: any[];
    readonly check: CheckFn<V>;
};
declare type ChainValidatorBaseOptions<V> = {
    convert: ValueConverter<V>;
    getLocale: () => string | undefined;
    getMessage: MessageGenerator<V>;
};
declare class ChainValidatorBase<V> implements Validator<V> {
    readonly _checks: CheckItem<V>[];
    readonly _options: ChainValidatorBaseOptions<V>;
    constructor(_checks: CheckItem<V>[], _options: ChainValidatorBaseOptions<V>);
    test(originalValue: unknown, context?: unknown): ValidationResult<V>;
}
export declare const createValidator: <V, Cs extends Record<string, Checker<any, any[]>>>(checkerContainer: CheckerContainer<V, Cs>, options: ValidatorOptions<Cs>) => ChainValidator<V, Cs>;
export declare class CustomValidator<V> extends ChainValidatorBase<V> {
    static defaultConverter: <V_1>() => ValueConverter<V_1>;
    check(name: string, check: CheckFn<V>): CustomValidator<V>;
}
declare type MessageGenerator<V> = (name: string, args: unknown[], result: CheckResult<V>) => string;
export declare const isValidator: <V>(v: Validator<V> | Record<string, unknown>) => v is Validator<V>;
export {};
