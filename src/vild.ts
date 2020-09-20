import type { CheckerContainer } from './checker';
import { createValidator } from './validator';
import type { ChainValidator } from './validator';
import type { Messages } from './messages';

type CheckerContainerSet = Record<string, CheckerContainer<any, any>>;

export type Vild<Ccs extends CheckerContainerSet> = {
  [K in keyof Ccs]: Ccs[K] extends CheckerContainer<infer V, infer Cs>
    ? () => ChainValidator<V, Cs>
    : never;
};

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

export const createVild = <Ccs extends CheckerContainerSet>(
  options: VildOptions<Ccs>
): [Vild<Ccs>, VildConfig<Ccs>] => {
  const state = {
    locale: undefined as string | undefined,
    messages: options.messages,
  };

  const containerSet = options.validators;
  const vild: Vild<any> = {};
  for (const name of Object.keys(containerSet)) {
    const container = containerSet[name];
    const validator = createValidator(container, {
      locale: () => state.locale,
      messages: () => state.messages[name],
    });
    vild[name] = () => validator;
  }

  const config: VildConfig<Ccs> = {
    setMessages(locale, messages) {
      state.locale = locale;
      state.messages = messages;
    },
  };

  return [vild, config];
};
