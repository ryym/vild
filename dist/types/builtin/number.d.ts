import { Messages } from '../messages';
export declare const convertToNumber: (val: unknown) => number | undefined;
export declare const number: import("../checker").CheckerContainer<number, {
    required: import("../checker").Checker<number, []>;
    valid: import("../checker").Checker<number, []>;
    min: import("../checker").Checker<number, [min: number]>;
    max: import("../checker").Checker<number, [max: number]>;
}>;
export declare const numberMessages: Messages<typeof number>;
