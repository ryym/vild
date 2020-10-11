import type { CheckerContainer, ValueConverter } from './checker';
import { CustomValidator } from './validator';
import type { ChainValidator } from './validator';
import { ValidatorSet, ValidatorDefinition } from './validatorSet';
import type { Messages } from './messages';
declare type CheckerContainerSet = Record<string, CheckerContainer<any, any>>;
export declare type CheckerChainSet<Ccs extends CheckerContainerSet> = {
    [K in keyof Ccs]: Ccs[K] extends CheckerContainer<infer V, infer Cs> ? () => ChainValidator<V, Cs> : never;
};
export interface CustomValidatorOptions<V> {
    readonly convert?: ValueConverter<V>;
}
export interface VildDefaultMethods {
    custom<V>(options?: CustomValidatorOptions<V>): CustomValidator<V>;
    validatorSet<Vs extends ValidatorDefinition>(validators: Vs): ValidatorSet<Vs>;
}
export declare type Vild<Ccs extends CheckerContainerSet> = CheckerChainSet<Ccs> & VildDefaultMethods;
export declare type MessagesSet<Ccs extends CheckerContainerSet> = {
    [K in keyof Ccs]: Messages<Ccs[K]>;
};
export declare type VildConfig<Ccs extends CheckerContainerSet> = {
    setMessages(locale: string, msgs: MessagesSet<Ccs>): void;
};
export declare type VildOptions<Ccs extends CheckerContainerSet> = {
    validators: Ccs;
    messages: MessagesSet<Ccs>;
};
export declare const createVildAndConfig: <Ccs extends Record<string, CheckerContainer<any, any>>>(options: VildOptions<Ccs>) => [Vild<Ccs>, VildConfig<Ccs>];
export {};
