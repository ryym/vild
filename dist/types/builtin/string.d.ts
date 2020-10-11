import { Messages } from '../messages';
export declare const convertToString: (val: unknown) => string | undefined;
export declare const string: import("../checker").CheckerContainer<string, {
    required: import("../checker").Checker<string, []>;
    trim: import("../checker").Checker<string, []>;
}>;
export declare const stringMessages: Messages<typeof string>;
