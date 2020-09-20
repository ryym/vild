import { ValidationResult } from './checker';
import { Validator, isValidator } from './validator';

export type AnyValidators = {
  [key: string]: Validator<any> | [Validator<any>] | AnyValidators | [AnyValidators];
};

export type ValidationResultSet<Vs> = Vs extends [infer E]
  ? Array<ValidationResultSet<E>>
  : Vs extends Validator<infer V>
  ? ValidationResult<V>
  : { [K in keyof Vs]: ValidationResultSet<Vs[K]> };

export class ValidatorSet<Vs extends AnyValidators> {
  constructor(private readonly _validators: Vs) {}

  testObject<O extends Record<string, unknown>>(values: O): ValidationResultSet<Vs> {
    const result = this._testObject(values, this._validators);
    return result as ValidationResultSet<Vs>;
  }

  private _testObject<O extends Record<string, unknown>>(
    values: O,
    validators: AnyValidators
  ): ValidationResultSet<AnyValidators> {
    const result = {} as ValidationResultSet<AnyValidators>;

    for (const key of Object.keys(validators)) {
      const validator = validators[key];
      const value = values[key];
      const hasValue = key in values;

      if (Array.isArray(validator)) {
        if (!hasValue) {
          result[key] = [];
        } else {
          if (!Array.isArray(value)) {
            throw new Error(`[vild] ValidatorSet expects ${key} to be an array but value is not`);
          }
          const validator0 = validator[0];
          if (isValidator(validator0)) {
            result[key] = (value as any[]).map((v) => validator0.test(v));
          } else {
            result[key] = (value as any[]).map((v) => this._testObject(v, validator0));
          }
        }
      } else if (isValidator(validator)) {
        result[key] = hasValue ? validator.test(value) : this.initialResult();
      } else {
        result[key] = this._testObject((value as any) ?? {}, validator);
      }
    }

    return result;
  }

  private initialResult(): ValidationResult<unknown> {
    return { errors: [], value: { original: undefined, converted: undefined } };
  }
}

export const validatorSet = <Vs extends AnyValidators>(validators: Vs): ValidatorSet<Vs> => {
  return new ValidatorSet(validators);
};
