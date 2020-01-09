import ansicolor = require("ansicolor");

type JSONPrimitive = string | number | boolean | null | Object | any[];
export function deepComparison(oldObj: any, newObj: any, keyChain: string): string[] {
    const oldObjKeys = Object.keys(oldObj);
    const newObjKeys = Object.keys(newObj);
    const fields = new Set<string>([...oldObjKeys, ...newObjKeys]);
    const differences: string[] = [];
    function representation(colorizer: (input: string) => string, value?: JSONPrimitive) {
        if(value === undefined) return "";
        if(typeof value === 'object') {
            if (Array.isArray(value)) {
                return " [" + value.length + "]";
            } else {
                return " {...}";
            }
        } else if (typeof value === 'string') {
            return ` "${colorizer(value)}"`;
        } else {
            return " " + colorizer(String(value));
        }
    }
    function explainDifference(field: string, newValue?: JSONPrimitive, oldValue?: JSONPrimitive) {
        const action = 
            newValue === undefined ? "Remove" :
            oldValue === undefined ? "   Add" :
                                     "Change";
        differences.push(`${action} ${keyChain}[${ansicolor.white(field)}]:${representation(ansicolor.lightMagenta, oldValue)}${representation(ansicolor.lightGreen, newValue)}`);
    }
    fields.forEach(field => {
        const oldField = oldObj[field];
        const oldIsObject = typeof oldField === 'object';

        const newField = newObj[field];
        const newIsObject = typeof newField === 'object';

        if (!oldIsObject && !newIsObject) {
            if (oldField !== newField) explainDifference(field, newField, oldField);
        } else if (oldIsObject !== newIsObject) {
            explainDifference(field, newField, oldField);
        }
        if (oldIsObject || newIsObject) {
            deepComparison(oldIsObject ? oldField : {}, newIsObject? newField : {}, keyChain + "[" + ansicolor.white(field) + "]")
            .forEach(difference => {
                differences.push(difference);
            });
        }
    });
    return differences;
}