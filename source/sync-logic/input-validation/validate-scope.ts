import validateNpmPackageName = require('validate-npm-package-name');
import { GLOBAL_SCOPE_NAME, Success, SUCCESS, CONFIG_FILE_NAME } from '../../common/constants';
import { colorize } from '../../colorize-special-text';
import { ConfigError, ErrorType } from '../../common/errors';
import { Either, right, left } from 'fp-ts/lib/Either';

export function validateScope(scope: string): Either<ConfigError[], Success> {
    // If the package belongs under no scope then they should be placed under the global scope name.
    if (scope !== GLOBAL_SCOPE_NAME) {
        const invalidScopePrefix = `Keys of ${colorize.file(CONFIG_FILE_NAME)}.packages must be npm scopes.\nScope "${colorize.scope(scope)}" is not a valid scope.`;
        const invalidScopeSuffix = `\nTo configure packages without a scope, use the key "${colorize.scope(GLOBAL_SCOPE_NAME)}".`
        const result = validateNpmPackageName(`${scope}/test`);
        if (!result.validForNewPackages) {
            return left([{
                type: ErrorType.InvalidScope,
                message: `${invalidScopePrefix}${invalidScopeSuffix}`
            }]);
        }
    }
    return right(SUCCESS);
}