import validateNpmPackageName = require('validate-npm-package-name');
import { GLOBAL_SCOPE_NAME } from '../common-values';
import { colorize } from '../colorize-special-text';
import { ConfigError, ErrorType } from '../error';
export function validateScope(scope: string): ConfigError[] {
    // If the package belongs under no scope then they should be placed under the global scope name.
    if (scope !== GLOBAL_SCOPE_NAME) {
        const result = validateNpmPackageName(`${scope}/test`);
        if (!result.validForNewPackages) {
            const numberedErrors = result.errors ?
                result.errors.map((errorMessage, index) => `${index+1}. ${errorMessage}`).join("\n") + "\n"
                :
                "";
            return [
                {
                    type: ErrorType.InvalidScope,
                    message: `Invalid scope ${colorize.scope(scope)}:\n${numberedErrors}For packages which belong under no scope, use ${colorize.scope(GLOBAL_SCOPE_NAME)} as the scope name.`
                }
            ];
        }
    }
    return [];
}