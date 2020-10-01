import { Meta } from './meta';

export type CheckedValue<V> = {
  readonly original: unknown;
  readonly converted: V | undefined;
};

export class ValidationResult<V> {
  constructor(readonly errors: ErrorInfo[], readonly value: CheckedValue<V>) {}
}

export type ErrorInfo = {
  readonly name: string;
  readonly message: string;
};

export type CheckResult<V> = { ok: boolean; value?: V; message?: string };

export type CheckFn<V> = (
  value: CheckedValue<V>,
  meta: Meta
) => CheckResult<V> | ValidationResult<V>;

export class Checker<V, Args extends unknown[]> {
  constructor(readonly checkWith: (...args: Args) => CheckFn<V>) {}
}

export const check = <Args extends unknown[], V>(
  fn: (...args: Args) => CheckFn<V>
): Checker<V, Args> => {
  return new Checker(fn);
};

export const isCheckResult = <V>(
  result: CheckResult<V> | ValidationResult<V>
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
