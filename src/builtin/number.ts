import { defineCheckers, check } from '../checker';
import { Messages } from '../messages';

export const convertToNumber = (val: unknown): number | undefined => {
  switch (typeof val) {
    case 'number':
      return val;

    case 'string': {
      if (val.trim().length === 0) {
        return undefined;
      }
      const n = Number(val);
      return Number.isNaN(n) ? undefined : n;
    }

    default:
      return undefined;
  }
};

export const number = defineCheckers(convertToNumber, {
  required: check(() => (val) => {
    const empty = val.original == false && val.original !== 0;
    return { ok: !empty };
  }),

  valid: check(() => (val) => {
    return { ok: val.original == false || val.converted != null };
  }),

  min: check((min: number) => (val) => {
    return { ok: val.converted == null || min <= val.converted };
  }),

  max: check((max: number) => (val) => {
    return { ok: val.converted == null || val.converted <= max };
  }),
});

export const numberMessages: Messages<typeof number> = {
  required: () => 'is required',
  valid: () => 'not a number',
  min: (min: number) => `must be greater than or equal to ${min}`,
  max: (max: number) => `must be less than or equal to ${max}`,
};
