import { ValidationResult, ValidationResultEntity } from './checker';
import { Validator } from './validator';

export type AnyValidators = {
  [key: string]: Validator<any> | Validator<any>[];
};

export type AnyObjectValidationResult = {
  [key: string]: ValidationResult<any> | ValidationResult<any>[];
};

export type ObjectValidationResult<Vs extends AnyValidators> = {
  [K in keyof Vs]: Vs[K] extends Validator<infer V>
    ? ValidationResult<V>
    : Vs[K] extends Validator<infer V>[]
    ? ValidationResult<V>[]
    : never;
};

export const testObject = <Vs extends AnyValidators>(
  values: unknown,
  validators: Vs,
  context?: unknown
): ObjectValidationResult<Vs> => {
  if (values != null && (typeof values !== 'object' || Array.isArray(values))) {
    throw new Error('[vild] testObject accepts an object only');
  }
  return _testObject(
    (values || {}) as Record<string, unknown>,
    validators,
    context
  ) as ObjectValidationResult<Vs>;
};

const _testObject = (
  values: Record<string, unknown>,
  validators: AnyValidators,
  context?: unknown
): AnyObjectValidationResult => {
  const results = {} as AnyObjectValidationResult;

  for (const key in validators) {
    const validator = validators[key];
    const value = values[key];

    if (Array.isArray(validator)) {
      if (!Array.isArray(value)) {
        throw new Error(`[vild] ValidatorSet expects ${key} to be an array but value is not`);
      }
      const validator0 = validator[0];
      results[key] = (value as any[]).map((v) => validator0.test(v, context));
    } else if (key in values) {
      results[key] = validator.test(value, context);
    } else {
      results[key] = ValidationResultEntity.untested();
    }
  }

  return results;
};
