import { Validator, isValidator } from './validator';
import { ValidationResult, ValidationResultEntity, isValidationResult } from './checker';

/*
 * - バリデーションの集合を簡単・柔軟・型安全に定義するためのユーティリティ。
 * - schema validation のようにフィールドとバリデータが 1:1 対応する必要はない。
 * - 条件によって特定のバリデーションをスキップしたり、後回しにしたり出来る。 DSL は最小限。
 *
 *   const validators = vild.validatorSet({ ... });
 *   const [v, root] = validators.newValidation();
 *   const result = v.test(root, form, { exclude: 'age' });
 *   if (someCondition) {
 *     result.age = v.test(root.age, form.age);
 *   }
 *   result.address = v.emptyResult(root.address);
 *   return v.fixResult(result);
 */

type LitValidator<V> = Validator<V>;

const _isArrayValidator = Symbol('_isArrayValidator');

const isArrayValidator = <T>(v: AnyValidator<T>): v is ArrayValidator<T> => {
  return v != null && _isArrayValidator in v;
};

const _isObjectValidator = Symbol('_isObjectValidator');

const isObjectValidator = <T>(v: AnyValidator<T>): v is ObjectValidator<T> => {
  return v != null && _isObjectValidator in v;
};

type LitArrayValidator<T> = LitValidator<T> & {
  [_isArrayValidator]: true;
};

type ObjectArrayValidator<T> = ObjectValidator<T> & {
  [_isArrayValidator]: true;
};

type ArrayValidator<T> = T extends LitValidator<infer V>
  ? LitArrayValidator<V>
  : ObjectArrayValidator<T>;

type ObjectValidator<T> = {
  [K in keyof T]: ValidatorSetOf<T[K]>;
} & {
  [_isObjectValidator]: true;
};

export type ValidatorSetOf<Vs> = Vs extends Array<infer E>
  ? ArrayValidator<E>
  : Vs extends LitValidator<any>
  ? Vs
  : ObjectValidator<Vs>;

type AnyValidator<T> = LitValidator<T> | ArrayValidator<T> | ObjectValidator<T>;

export type ValidatorDefinition = {
  [key: string]: AnyValidatorDefinition;
};

type AnyValidatorDefinition =
  | LitValidator<any>
  | LitValidator<any>[]
  | ValidatorDefinition
  | ValidatorDefinition[];

const _buildValidatorSet = (v: AnyValidatorDefinition): AnyValidator<any> => {
  if (Array.isArray(v)) {
    if (v.length !== 1) {
      throw new Error('[vild] array in validatorSet must be a tuple like [validator]');
    }
    const av = _buildValidatorSet(v[0]) as ArrayValidator<any>;
    av[_isArrayValidator] = true;
    return av;
  }
  if (isValidator(v)) {
    return v;
  }
  const ov = {} as ObjectValidator<any>;
  for (const k in v) {
    ov[k] = _buildValidatorSet(v[k]);
  }
  ov[_isObjectValidator] = true;
  return ov;
};

export type ValidatorSetResultOf<Vs extends ValidatorSet<any>> = ValidatorSetResult2<
  Vs['validators']
>;

export interface ValidatorSetResult<Vs extends ValidatorDefinition> {
  readonly isValid: boolean;
  readonly results: ValidationResultOf<Vs>;
  readonly errors: ErrorMessagesOf<ValidationResultOf<Vs>>;
}

export interface ValidatorSetResult2<Vs extends AnyValidator<any>> {
  readonly isValid: boolean;
  readonly results: ValidationResultOf<Vs>;
  readonly errors: ErrorMessagesOf<ValidationResultOf<Vs>>;
}

export class ValidatorSetResultEntity2<Vr extends AnyValidationResult> {
  private _isValid: boolean | null = null;
  private _errors: ErrorMessagesOf<Vr> | null = null;

  constructor(readonly results: Vr) {}

  get isValid(): boolean {
    if (this._isValid != null) {
      return this._isValid;
    }
    return (this._isValid = _isValid(this.results));
  }

  get errors(): ErrorMessagesOf<Vr> {
    if (this._errors != null) {
      return this._errors;
    }
    return (this._errors = _extractErrorMessages(this.results) as ErrorMessagesOf<Vr>);
  }
}

export type ValidationResultOf<Vs> = Vs extends ArrayValidator<infer E>
  ? Array<ValidationResultOf<E>>
  : Vs extends LitValidator<infer V>
  ? ValidationResult<V>
  : { [K in keyof Vs]: ValidationResultOf<Vs[K]> };

export type AnyValidationResult =
  | ValidationResult<any>
  | Array<AnyValidationResult>
  | { [key: string]: AnyValidationResult };

export type TestResultOf<Vs> = Vs extends ArrayValidator<infer E>
  ? Array<TestResultOf<E>>
  : Vs extends LitValidator<infer V>
  ? ValidationResult<V>
  : {
      [K in keyof Vs]: Vs[K] extends ObjectValidator<any>
        ? TestResultOf<Vs[K]> | undefined
        : TestResultOf<Vs[K]>;
    };

export type AnyTestResult =
  | ValidationResult<any>
  | Array<AnyTestResult>
  | { [key: string]: AnyTestResult | undefined };

export class ValidatorSet<Vs extends ValidatorDefinition> {
  constructor(readonly validators: Vs) {}

  newValidation = (): [Validation<Vs>, ValidatorSetOf<Vs>] => {
    const vs = _buildValidatorSet(this.validators) as ValidatorSetOf<Vs>;
    return [new Validation(), vs];
  };
}

export interface TestOptions<T> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  exclude?: T extends object ? (keyof T)[] : never;
}

export class Validation<Vs extends ValidatorDefinition> {
  // readonly result = new ValidationResultBuilder();

  test = <V extends AnyValidator<any>>(
    v: V,
    value: unknown,
    opts?: TestOptions<V>
  ): TestResultOf<V> => {
    return _test(v, value, opts || {}) as TestResultOf<V>;
  };

  emptyResult = <V extends AnyValidator<any>>(v: V): TestResultOf<V> => {
    return _empty(v) as TestResultOf<V>;
  };

  fixResult = (
    result: TestResultOf<ValidatorSetOf<Vs>>
  ): ValidatorSetResult2<ValidatorSetOf<Vs>> => {
    const checkedResult = _assertAllResultsSet(result, 'root') as ValidationResultOf<
      ValidatorSetOf<Vs>
    >;
    return new ValidatorSetResultEntity2(checkedResult);
  };
}

// 配列とネストしたオブジェクトには結果をセットしない。
const _test = (v: AnyValidator<any>, value: unknown, opts: TestOptions<any>): AnyTestResult => {
  if (isArrayValidator(v)) {
    return [];
  }
  if (isObjectValidator(v)) {
    const exclude = new Set(opts.exclude || []);
    const result: { [key: string]: AnyTestResult | undefined } = {};
    for (const k in v) {
      if (isObjectValidator(v[k])) {
        result[k] = undefined;
      } else if (isArrayValidator(v[k])) {
        result[k] = [];
      } else {
        const shouldTest = value != null && k in (value as any) && !exclude.has(k);
        result[k] = shouldTest ? v[k].test((value as any)[k]) : ValidationResultEntity.untested();
      }
    }
    return result;
  }
  return v.test(value);
};

const _empty = (v: AnyValidator<any>): AnyTestResult => {
  if (isArrayValidator(v)) {
    return [];
  }
  if (isObjectValidator(v)) {
    const result: any = {};
    for (const k in v) {
      result[k] = isObjectValidator(v[k]) ? undefined : ValidationResultEntity.untested();
    }
    return result;
  }
  return ValidationResultEntity.untested();
};

const _assertAllResultsSet = (
  result: AnyTestResult | undefined,
  path: string
): AnyValidationResult => {
  if (result == undefined) {
    throw new Error(`[vild] result.build: ${path} is not set`);
  }
  if (isValidationResult(result)) {
    return result;
  }
  if (Array.isArray(result)) {
    return result.map((e, i) => _assertAllResultsSet(e, `${path}[${i}]`));
  }
  const results: any = {};
  for (const k in result) {
    results[k] = _assertAllResultsSet(result[k], `${path}.${k}`);
  }
  return results;
};

const _extractErrorMessages = (results: AnyTestResult): AnyErrorMessages => {
  if (Array.isArray(results)) {
    return results.map((r) => _extractErrorMessages(r));
  }
  if (isValidationResult(results)) {
    return results.errors.map((e) => e.message);
  }
  const errors = {} as Record<string, AnyErrorMessages>;
  for (const key in results) {
    errors[key] = _extractErrorMessages(results[key] as AnyTestResult);
  }
  return errors;
};

const _isValid = (results: AnyTestResult): boolean => {
  if (Array.isArray(results)) {
    return results.every((r) => _isValid(r));
  }
  if (isValidationResult(results)) {
    return results.ok;
  }
  for (const key in results) {
    if (!_isValid(results[key] as AnyTestResult)) {
      return false;
    }
  }
  return true;
};

export type AnyErrorMessagesObject = {
  [key: string]: AnyErrorMessages;
};

export type AnyErrorMessages =
  | string[]
  | AnyErrorMessages[]
  | AnyErrorMessagesObject
  | AnyErrorMessagesObject[];

export type ErrorMessagesOf<Vr> = {
  [K in keyof Vr]: Vr[K] extends ValidationResult<any>
    ? string[]
    : Vr[K] extends ValidationResult<any>[]
    ? string[][]
    : Exclude<ErrorMessagesOf<Vr[K]>, undefined>;
};

export type Fixed<Vr> = {
  [K in keyof Vr]: Vr[K] extends ValidationResult<any> ? Vr[K] : Exclude<Fixed<Vr[K]>, undefined>;
};
