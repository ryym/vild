import { number, numberMessages } from './number';
import { string, stringMessages } from './string';
import { VildOptions } from '../vild';

const containers = {
  number,
  string,
};

export const builtin: VildOptions<typeof containers> = {
  validators: containers,
  messages: {
    number: numberMessages,
    string: stringMessages,
  },
};
