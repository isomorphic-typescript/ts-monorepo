export const inspectTypeAtRuntime = (object: any, name: string, prefix: string, remainingLevels: number) => {
    if (remainingLevels < 0) return;
    const typeOf = typeof object;
    console.log(`${prefix}type of ${name} is ${typeOf}`);
    if (typeOf === 'object') {
        const keys = Object.getOwnPropertyNames(object);
        console.log(`${prefix}keys of ${name} are ${keys}`);
        keys.forEach(key => {
            const val = object[key];
            const typeofVal = typeof val;
            const keyName = `${name}.${key}`
            console.log(`${prefix}type of ${keyName} is ${typeofVal}`);
            if (typeofVal === 'object') {
                inspectTypeAtRuntime(val, keyName, prefix + '\t', remainingLevels - 1);
            } else if (typeofVal !== 'function') {
                console.log(`${prefix}value of ${keyName} is ${val}`);
            }
        });
    }
}