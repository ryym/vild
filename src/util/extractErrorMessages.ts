import { ValidationResult, isValidationResult } from '../checker';

export type AnyValidationResultTree = {
  [key: string]: AnyValidationResult;
};

export type AnyValidationResult =
  | ValidationResult<any>
  | ValidationResult<any>[]
  | AnyValidationResultTree
  | AnyValidationResultTree[];

export type AnyErrorMessagesTree = {
  [key: string]: AnyErrorMessages;
};

export type AnyErrorMessages =
  | string[]
  | AnyErrorMessages[]
  | AnyErrorMessagesTree
  | AnyErrorMessagesTree[];

export type ErrorMessagesTree<Vr> = {
  [K in keyof Vr]: Vr[K] extends ValidationResult<any>
    ? string[]
    : Vr[K] extends ValidationResult<any>[]
    ? string[][]
    : ErrorMessagesTree<Vr[K]>;
};

export const extractErrorMessages = <Vr extends AnyValidationResult>(
  results: Vr
): ErrorMessagesTree<Vr> => {
  return _extractErrorMessages(results) as ErrorMessagesTree<Vr>;
};

const _extractErrorMessages = (results: AnyValidationResult): AnyErrorMessages => {
  if (Array.isArray(results)) {
    return (results as AnyValidationResult[]).map((r) => _extractErrorMessages(r));
  }
  if (isValidationResult(results)) {
    return results.errors.map((e) => e.message);
  }
  const errors = {} as Record<string, AnyErrorMessages>;
  for (const key in results) {
    errors[key] = _extractErrorMessages(results[key]);
  }
  return errors;
};
