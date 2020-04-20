"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://github.com/gcanti/io-ts/issues/322#issuecomment-584658211
// This was written to support version 2.2.0
const t = require("io-ts");
const Either_1 = require("fp-ts/lib/Either");
const getIsCodec = (tag) => (codec) => codec._tag === tag;
const isInterfaceCodec = getIsCodec('InterfaceType');
const isPartialCodec = getIsCodec('PartialType');
const getProps = (codec) => {
    switch (codec._tag) {
        case 'RefinementType':
        case 'ReadonlyType':
            return getProps(codec.type);
        case 'InterfaceType':
        case 'StrictType':
        case 'PartialType':
            return codec.props;
        case 'IntersectionType':
            return codec.types.reduce((props, type) => Object.assign(props, getProps(type)), {});
    }
};
const getNameFromProps = (props) => Object.keys(props)
    .map((k) => `${k}: ${props[k].name}`)
    .join(', ');
const getPartialTypeName = (inner) => `Partial<${inner}>`;
const getExcessTypeName = (codec) => {
    if (isInterfaceCodec(codec)) {
        return `{| ${getNameFromProps(codec.props)} |}`;
    }
    if (isPartialCodec(codec)) {
        return getPartialTypeName(`{| ${getNameFromProps(codec.props)} |}`);
    }
    return `Exactly<${codec.name}>`;
};
const stripKeys = (o, props) => {
    const keys = Object.getOwnPropertyNames(o);
    const propsKeys = Object.getOwnPropertyNames(props);
    propsKeys.forEach((pk) => {
        const index = keys.indexOf(pk);
        if (index !== -1) {
            keys.splice(index, 1);
        }
    });
    return keys.length
        ? Either_1.left(keys)
        : Either_1.right(o);
};
exports.exactly = (codec, name = getExcessTypeName(codec)) => {
    const props = getProps(codec);
    return new Exactly(name, (u) => Either_1.isRight(stripKeys(u, props)) && codec.is(u), (u, c) => Either_1.either.chain(t.UnknownRecord.validate(u, c), () => Either_1.either.chain(codec.validate(u, c), (a) => Either_1.either.mapLeft(stripKeys(a, props), (keys) => keys.map((k) => ({
        value: a[k],
        context: c,
        message: k,
    }))))), (a) => codec.encode(stripKeys(a, props).right), codec);
};
class Exactly extends t.Type {
    constructor(name, is, validate, encode, type) {
        super(name, is, validate, encode);
        this.type = type;
        this._tag = "ExactType";
    }
}
exports.Exactly = Exactly;
//# sourceMappingURL=exactly.js.map