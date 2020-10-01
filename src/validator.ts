import { isCheckResult, ValidationResult, ValueConverter } from './checker';
import type {
  Checker,
  CheckFn,
  CheckedValue,
  CheckerSet,
  CheckerContainer,
  CheckResult,
  ErrorInfo,
} from './checker';
import type { MessagesForCheckerSet } from './messages';
import type { Meta } from './meta';

export type Validator<V> = {
  test(value: unknown, context?: unknown): ValidationResult<V>;
};

export type CheckerChain<V, Cs extends CheckerSet> = {
  [K in keyof Cs]: Cs[K] extends Checker<V, infer Args>
    ? (...args: Args) => ChainValidator<V, Cs>
    : never;
};

export type ChainValidator<V, Cs extends CheckerSet> = CheckerChain<V, Cs> & Validator<V>;

type ValidatorOptions<Cs extends CheckerSet> = {
  locale: () => string | undefined;
  messages: () => MessagesForCheckerSet<Cs>;
};

type CheckItem<V> = {
  readonly name: string;
  readonly args: any[];
  readonly check: CheckFn<V>;
};

type ChainValidatorBaseOptions<V> = {
  convert: ValueConverter<V>;
  getLocale: () => string | undefined;
  getMessage: MessageGenerator<V>;
};

class ChainValidatorBase<V> implements Validator<V> {
  constructor(readonly _checks: CheckItem<V>[], readonly _options: ChainValidatorBaseOptions<V>) {}

  test(originalValue: unknown, context?: unknown): ValidationResult<V> {
    const converted = this._options.convert(originalValue);
    const value = { original: originalValue, converted };
    const meta = { context, locale: this._options.getLocale() };
    return validateValue(value, this._checks, meta, this._options.getMessage);
  }
}

export const createValidator = <V, Cs extends CheckerSet>(
  checkerContainer: CheckerContainer<V, Cs>,
  options: ValidatorOptions<Cs>
): ChainValidator<V, Cs> => {
  const { checkers, convert } = checkerContainer;

  const getMessage: MessageGenerator<V> = (name, args) => {
    const msgs = options.messages();
    const msg = msgs[name];
    if (msg == null) {
      throw new Error(`[vild] message function not defined for ${name}`);
    }
    return msg(...args);
  };

  const baseOptions: ChainValidatorBaseOptions<V> = {
    convert,
    getLocale: options.locale,
    getMessage,
  };

  class ValidatorInner extends ChainValidatorBase<V> {}

  const chain: CheckerChain<V, CheckerSet<V>> = {};
  for (const name of Object.keys(checkers)) {
    chain[name] = function (this: ValidatorInner, ...args: any[]) {
      const check = checkers[name].checkWith(...args) as CheckFn<V>;
      const checks = [...this._checks, { name, check, args }];
      return (new ValidatorInner(checks, baseOptions) as unknown) as ChainValidator<V, Cs>;
    };
  }

  Object.assign(ValidatorInner.prototype, chain);

  return (new ValidatorInner([], baseOptions) as unknown) as ChainValidator<V, Cs>;
};

export class CustomValidator<V> extends ChainValidatorBase<V> {
  static defaultConverter = <V>(): ValueConverter<V> => {
    return (value) => value as V;
  };

  check(name: string, check: CheckFn<V>): CustomValidator<V> {
    this._checks.push({ name, check, args: [] });
    return this;
  }
}

type MessageGenerator<V> = (name: string, args: unknown[], result: CheckResult<V>) => string;

const validateValue = <V>(
  firstValue: CheckedValue<V>,
  checks: CheckItem<V>[],
  meta: Meta,
  getMessage: MessageGenerator<V>
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
        const message = getMessage(name, args, result);
        errors.push({ name, message });
        break;
      }
    } else {
      errors.push(...result.errors);
      value = result.value;
    }
  }
  return new ValidationResult(errors, value);
};

export const isValidator = <V>(v: Validator<V> | Record<string, unknown>): v is Validator<V> => {
  return typeof (v as any).test === 'function';
};
