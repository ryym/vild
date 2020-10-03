import { ValidationResult, ValidationResultEntity, isValidationResult } from './checker';
import { Validator, isValidator } from './validator';

export type AnyValidators = {
  [key: string]: Validator<any> | [Validator<any>] | AnyValidators | [AnyValidators];
};

export type ValidationResultTree<Vs> = Vs extends [infer E]
  ? Array<ValidationResultTree<E>>
  : Vs extends Validator<infer V>
  ? ValidationResult<V>
  : { [K in keyof Vs]: ValidationResultTree<Vs[K]> };

export type AnyValidationResultTree = {
  [key: string]: AnyValidationResult;
};

export type AnyValidationResult =
  | ValidationResult<any>
  | ValidationResult<any>[]
  | AnyValidationResultTree
  | AnyValidationResultTree[];

export type ErrorMessagesTree<Vs> = Vs extends [infer E]
  ? Array<ErrorMessagesTree<E>>
  : Vs extends Validator<unknown>
  ? string[]
  : { [K in keyof Vs]: ErrorMessagesTree<Vs[K]> };

export type AnyErrorMessagesTree = {
  [key: string]: AnyErrorMessages;
};

export type AnyErrorMessages =
  | string[]
  | AnyErrorMessages[]
  | AnyErrorMessagesTree
  | AnyErrorMessagesTree[];

export class ValidatorSet<Vs extends AnyValidators> {
  constructor(private readonly _validators: Vs) {}

  testObject<O extends Record<string, unknown>>(
    values: O,
    context?: unknown
  ): ValidatorSetResult<Vs> {
    const results = this._testObject(values, this._validators, context) as ValidationResultTree<Vs>;
    return new ValidatorSetResult(results);
  }

  private _testObject<O extends Record<string, unknown>>(
    values: O,
    validators: AnyValidators,
    context?: unknown
  ): ValidationResultTree<AnyValidators> {
    const results = {} as ValidationResultTree<AnyValidators>;

    for (const key in validators) {
      const validator = validators[key];
      const value = values[key];

      if (Array.isArray(validator)) {
        if (!Array.isArray(value)) {
          throw new Error(`[vild] ValidatorSet expects ${key} to be an array but value is not`);
        }
        const validator0 = validator[0];
        if (isValidator(validator0)) {
          results[key] = (value as any[]).map((v) => validator0.test(v));
        } else {
          results[key] = (value as any[]).map((v) => this._testObject(v, validator0, context));
        }
      } else if (isValidator(validator)) {
        results[key] = key in values ? validator.test(value) : ValidationResultEntity.untested();
      } else {
        results[key] = this._testObject((value as any) ?? {}, validator, context);
      }
    }

    return results;
  }
}

export class ValidatorSetResult<Vs extends AnyValidators> {
  private _errors?: ErrorMessagesTree<Vs>;

  constructor(readonly results: ValidationResultTree<Vs>) {}

  get errors(): ErrorMessagesTree<Vs> {
    if (this._errors == null) {
      this._errors = mapResultsToErrors(this.results) as ErrorMessagesTree<Vs>;
    }
    return this._errors;
  }
}

const mapResultsToErrors = (results: AnyValidationResult): AnyErrorMessages => {
  if (Array.isArray(results)) {
    return (results as AnyValidationResult[]).map((r) => mapResultsToErrors(r));
  }
  if (isValidationResult(results)) {
    return results.errors.map((e) => e.message);
  }
  const errors = {} as Record<string, ErrorMessagesTree<any>>;
  for (const key in results) {
    errors[key] = mapResultsToErrors(results[key]);
  }
  return errors;
};
