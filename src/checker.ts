import { Meta } from './meta';

export type CheckedValue<V> = {
  readonly original: unknown;
  readonly converted: V | undefined;
};

export type TestedValidationResult<V> =
  | {
      readonly ok: true;
      readonly tested: true;
      readonly errors: ErrorInfo[];
      readonly value: { original: unknown; converted: V };
    }
  | {
      readonly ok: false;
      readonly tested: true;
      readonly errors: ErrorInfo[];
      readonly value: { original: unknown; converted: V | undefined };
    };

export type UntestedValidationResult = {
  readonly ok: true;
  readonly tested: false;
  readonly errors: ErrorInfo[];
  readonly value: undefined;
};

export type ValidationResult<V> = TestedValidationResult<V> | UntestedValidationResult;

export const isValidationResult = <V>(result: unknown): result is ValidationResult<V> => {
  return result instanceof ValidationResultEntity;
};

export class ValidationResultEntity<V> {
  static untested(): UntestedValidationResult {
    return new ValidationResultEntity<undefined>([]) as UntestedValidationResult;
  }

  static tested<V>(errors: ErrorInfo[], value: CheckedValue<V>): TestedValidationResult<V> {
    return new ValidationResultEntity(errors, value) as TestedValidationResult<V>;
  }

  readonly ok: boolean;
  readonly tested: boolean;

  private constructor(readonly errors: ErrorInfo[], readonly value?: CheckedValue<V>) {
    this.ok = errors.length === 0;
    this.tested = value !== undefined;
  }
}

export type ErrorInfo = {
  readonly name: string;
  readonly message: string;
};

export type CheckResult<V> = { ok: boolean; value?: V; message?: string };

export type CheckFn<V> = (
  value: CheckedValue<V>,
  meta: Meta
) => CheckResult<V> | TestedValidationResult<V>;

export class Checker<V, Args extends unknown[]> {
  constructor(readonly checkWith: (...args: Args) => CheckFn<V>) {}
}

export const check = <Args extends unknown[], V>(
  fn: (...args: Args) => CheckFn<V>
): Checker<V, Args> => {
  return new Checker(fn);
};

export const isCheckResult = <V>(
  result: CheckResult<V> | TestedValidationResult<V>
): result is CheckResult<V> => {
  return 'ok' in result;
};

export type CheckerSet<V = any> = Record<string, Checker<V, any[]>>;

export type ValueConverter<V> = (value: unknown) => V | undefined;

export type CheckerContainer<V, Cs extends CheckerSet<V>> = {
  readonly checkers: Cs;
  readonly convert: ValueConverter<V>;
};

export const defineCheckers = <V, Cs extends CheckerSet<V>>(
  convert: ValueConverter<V>,
  checkers: Cs
): CheckerContainer<V, Cs> => {
  return { convert, checkers };
};
