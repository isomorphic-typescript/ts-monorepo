import * as t from 'io-ts';
export declare const exactly: <C extends t.HasProps>(codec: C, name?: string) => Exactly<C, C["_A"], C["_A"], unknown>;
export declare class Exactly<C extends t.Any, A = C['_A'], O = A, I = unknown> extends t.Type<A, O, I> {
    readonly type: C;
    readonly _tag: 'ExactType';
    constructor(name: string, is: Exactly<C, A, O, I>['is'], validate: Exactly<C, A, O, I>['validate'], encode: Exactly<C, A, O, I>['encode'], type: C);
}
//# sourceMappingURL=exactly.d.ts.map