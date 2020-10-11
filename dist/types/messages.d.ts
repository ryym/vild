import { Checker, CheckerSet, CheckerContainer } from './checker';
export declare type Messages<C extends CheckerContainer<any, CheckerSet>> = C extends CheckerContainer<any, infer Cs> ? MessagesForCheckerSet<Cs> : never;
export declare type MessagesForCheckerSet<Cs extends CheckerSet> = {
    [K in keyof Cs]: Cs[K] extends Checker<any, infer Args> ? (...args: Args) => string : never;
};
