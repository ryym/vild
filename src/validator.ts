import { isCheckResult } from './checker';
import type {
  Checker,
  CheckFn,
  CheckedValue,
  CheckerSet,
  CheckerContainer,
  ValidationResult,
  ErrorInfo,
} from './checker';
import type { MessagesForCheckerSet, AnyMessages } from './messages';
import type { Meta } from './meta';

export type ValidatorChain<V, Cs extends CheckerSet> = {
  [K in keyof Cs]: Cs[K] extends Checker<V, infer Args>
    ? (...args: Args) => Validator<V, Cs>
    : never;
};

export type Tester<V> = {
  test(value: unknown, context?: unknown): ValidationResult<V>;
};

export type Validator<V, Cs extends CheckerSet> = ValidatorChain<V, Cs> & Tester<V>;

type ValidatorOptions<Cs extends CheckerSet> = {
  locale: () => string | undefined;
  messages: () => MessagesForCheckerSet<Cs>;
};

type CheckItem<V> = {
  readonly name: string;
  readonly args: any[];
  readonly check: CheckFn<V>;
};

export const createValidator = <V, Cs extends CheckerSet>(
  checkerContainer: CheckerContainer<V, Cs>,
  options: ValidatorOptions<Cs>
): Validator<V, Cs> => {
  const { checkers, convert } = checkerContainer;

  class ValidatorInner implements Tester<V> {
    constructor(readonly _checks: CheckItem<V>[]) {}

    test(originalValue: unknown, context?: unknown): ValidationResult<V> {
      const converted = convert(originalValue);
      const value = { original: originalValue, converted };
      const meta = { context, locale: options.locale() };
      return validateValue(value, this._checks, meta, options.messages());
    }
  }

  const chain: ValidatorChain<V, CheckerSet<V>> = {};
  for (const name of Object.keys(checkers)) {
    chain[name] = function (this: ValidatorInner, ...args: any[]) {
      const check = checkers[name].checkWith(...args) as CheckFn<V>;
      const checks = [...this._checks, { name, check, args }];
      return (new ValidatorInner(checks) as unknown) as Validator<V, Cs>;
    };
  }

  Object.assign(ValidatorInner.prototype, chain);

  return (new ValidatorInner([]) as unknown) as Validator<V, Cs>;
};

const validateValue = <V>(
  firstValue: CheckedValue<V>,
  checks: CheckItem<V>[],
  meta: Meta,
  msgs: AnyMessages
): ValidationResult<V> => {
  const errors: ErrorInfo[] = [];
  let value = firstValue;
  for (const { name, args, check } of checks) {
    const result = check(value, meta);
    if (isCheckResult(result)) {
      if ('value' in result) {
        value = { original: firstValue.original, converted: result.value };
      }
      if (!result.ok) {
        const message = msgs[name](...args);
        errors.push({ name, message });
        break;
      }
    } else {
      errors.push(...result.errors);
      value = result.value;
    }
  }
  return { errors, value };
};