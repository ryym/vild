import { ValidationResult } from './checker';
import { Validator, isValidator } from './validator';

export type AnyValidators = {
  [key: string]: Validator<any> | [Validator<any>] | AnyValidators | [AnyValidators];
};

export type ValidationResultTree<Vs> = Vs extends [infer E]
  ? Array<ValidationResultTree<E>>
  : Vs extends Validator<infer V>
  ? ValidationResult<V>
  : { [K in keyof Vs]: ValidationResultTree<Vs[K]> };

export class ValidatorSet<Vs extends AnyValidators> {
  constructor(private readonly _validators: Vs) {}

  testObject<O extends Record<string, unknown>>(values: O): ValidatorSetResult<Vs> {
    const results = this._testObject(values, this._validators) as ValidationResultTree<Vs>;
    return new ValidatorSetResult(results);
  }

  private _testObject<O extends Record<string, unknown>>(
    values: O,
    validators: AnyValidators
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
          results[key] = (value as any[]).map((v) => this._testObject(v, validator0));
        }
      } else if (isValidator(validator)) {
        results[key] = validator.test(value);
      } else {
        results[key] = this._testObject((value as any) ?? {}, validator);
      }
    }

    return results;
  }
}

export const validatorSet = <Vs extends AnyValidators>(validators: Vs): ValidatorSet<Vs> => {
  return new ValidatorSet(validators);
};

export class ValidatorSetResult<Vs extends AnyValidators> {
  constructor(readonly results: ValidationResultTree<Vs>) {}
}
