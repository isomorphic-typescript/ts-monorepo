declare module 'validate-npm-package-name' {
    namespace validate {
        export const scopedPackagePattern: RegExp;
    }
    interface result {
        validForNewPackages: boolean;
        validForOldPackages: boolean;
        warnings?: string[];
        errors?: string[];
    }
    function validate(name: string): result;
    export = validate;
}