import type { CheckerContainer, ValueConverter } from './checker';
import { createValidator, CustomValidator } from './validator';
import type { ChainValidator } from './validator';
import { ValidatorSet, ValidatorDefinition } from './validatorSet';
import type { Messages } from './messages';

type CheckerContainerSet = Record<string, CheckerContainer<any, any>>;

export type CheckerChainSet<Ccs extends CheckerContainerSet> = {
  [K in keyof Ccs]: Ccs[K] extends CheckerContainer<infer V, infer Cs>
    ? () => ChainValidator<V, Cs>
    : never;
};

export interface CustomValidatorOptions<V> {
  readonly convert?: ValueConverter<V>;
}

export interface VildDefaultMethods {
  custom<V>(options?: CustomValidatorOptions<V>): CustomValidator<V>;
  validatorSet<Vs extends ValidatorDefinition>(validators: Vs): ValidatorSet<Vs>;
}

export type Vild<Ccs extends CheckerContainerSet> = CheckerChainSet<Ccs> & VildDefaultMethods;

interface VildBaseOptions {
  getLocale(): string | undefined;
}

class VildBase implements VildDefaultMethods {
  constructor(private readonly _options: VildBaseOptions) {}

  custom = <V>(options: CustomValidatorOptions<V> = {}): CustomValidator<V> => {
    return new CustomValidator([], {
      convert: options.convert ?? CustomValidator.defaultConverter(),
      getLocale: this._options.getLocale,
      getMessage: (name, _args, result) => {
        return result.message ?? `custom validation [${name}] failed`;
      },
    });
  };

  validatorSet = <Vs extends ValidatorDefinition>(validators: Vs): ValidatorSet<Vs> => {
    return new ValidatorSet(validators);
  };
}

export type MessagesSet<Ccs extends CheckerContainerSet> = {
  [K in keyof Ccs]: Messages<Ccs[K]>;
};

export type VildConfig<Ccs extends CheckerContainerSet> = {
  setMessages(locale: string, msgs: MessagesSet<Ccs>): void;
};

export type VildOptions<Ccs extends CheckerContainerSet> = {
  validators: Ccs;
  messages: MessagesSet<Ccs>;
};

export const createVildAndConfig = <Ccs extends CheckerContainerSet>(
  options: VildOptions<Ccs>
): [Vild<Ccs>, VildConfig<Ccs>] => {
  const state = {
    locale: undefined as string | undefined,
    messages: options.messages,
  };

  const containerSet = options.validators;
  const chains: CheckerChainSet<any> = {};
  for (const name of Object.keys(containerSet)) {
    const container = containerSet[name];
    const validator = createValidator(container, {
      locale: () => state.locale,
      messages: () => state.messages[name],
    });
    chains[name] = () => validator;
  }

  const config: VildConfig<Ccs> = {
    setMessages(locale, messages) {
      state.locale = locale;
      state.messages = messages;
    },
  };

  const vildBase = new VildBase({ getLocale: () => state.locale });
  const vild = (Object.assign(vildBase, chains) as unknown) as Vild<Ccs>;
  return [vild, config];
};
