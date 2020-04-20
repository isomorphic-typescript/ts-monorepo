import * as t from 'io-ts';

export function customType<T>(name: string, is: t.Is<T>) {
    return new t.Type(name, is, function(input: unknown, context) {
        if (is(input)) {
            return t.success(input);
        } else {
            return t.failure(input, context);
        }
    }, validated => String(validated));
}