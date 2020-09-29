import { defineCheckers, check } from '../checker';
import { Messages } from '../messages';

export const convertToString = (val: unknown): string | undefined => {
  if (val == null) {
    return undefined;
  }
  return String(val);
};

export const string = defineCheckers(convertToString, {
  required: check(() => (val) => {
    return { ok: val.converted != null && val.converted.length > 0 };
  }),

  trim: check(() => (val) => {
    if (val.converted == null) {
      return { ok: false };
    }
    return { ok: true, value: val.converted.trim() };
  }),
});

export const stringMessages: Messages<typeof string> = {
  required: () => 'is required',
  trim: () => '', // XXX
};
