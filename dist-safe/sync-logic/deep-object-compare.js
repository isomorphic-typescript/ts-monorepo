"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ansicolor = require("ansicolor");
function deepComparison(oldObj, newObj, keyChain) {
    const oldObjKeys = Object.keys(oldObj);
    const newObjKeys = Object.keys(newObj);
    const fields = new Set([...oldObjKeys, ...newObjKeys]);
    const differences = [];
    function representation(colorizer, value) {
        if (value === undefined)
            return "";
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return " [" + value.length + "]";
            }
            else {
                return " {...}";
            }
        }
        else if (typeof value === 'string') {
            return ` "${colorizer(value)}"`;
        }
        else {
            return " " + colorizer(String(value));
        }
    }
    function explainDifference(field, newValue, oldValue) {
        const action = newValue === undefined ? "removing" :
            oldValue === undefined ? "  adding" :
                "changing";
        differences.push(`    ${action} ${keyChain}[${ansicolor.white(field)}]:${representation(ansicolor.lightMagenta, oldValue)}${representation(ansicolor.lightGreen, newValue)}`);
    }
    fields.forEach(field => {
        const oldField = oldObj[field];
        const oldIsObject = typeof oldField === 'object';
        const newField = newObj[field];
        const newIsObject = typeof newField === 'object';
        if (!oldIsObject && !newIsObject) {
            if (oldField !== newField)
                explainDifference(field, newField, oldField);
        }
        else if (oldIsObject !== newIsObject) {
            explainDifference(field, newField, oldField);
        }
        if (oldIsObject || newIsObject) {
            deepComparison(oldIsObject ? oldField : {}, newIsObject ? newField : {}, keyChain + "[" + ansicolor.white(field) + "]")
                .forEach(difference => {
                differences.push(difference);
            });
        }
    });
    return differences;
}
exports.deepComparison = deepComparison;
//# sourceMappingURL=deep-object-compare.js.map