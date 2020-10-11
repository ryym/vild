import { VildOptions } from '../vild';
declare const containers: {
    number: import("..").CheckerContainer<number, {
        required: import("..").Checker<number, []>;
        valid: import("..").Checker<number, []>;
        min: import("..").Checker<number, [min: number]>;
        max: import("..").Checker<number, [max: number]>;
    }>;
    string: import("..").CheckerContainer<string, {
        required: import("..").Checker<string, []>;
        trim: import("..").Checker<string, []>;
    }>;
};
export declare const builtin: VildOptions<typeof containers>;
export {};
