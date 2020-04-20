"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateNpmPackageName = require("validate-npm-package-name");
const constants_1 = require("../../common/constants");
const colorize_special_text_1 = require("../../colorize-special-text");
const errors_1 = require("../../common/errors");
const Either_1 = require("fp-ts/lib/Either");
function validateScope(scope) {
    // If the package belongs under no scope then they should be placed under the global scope name.
    if (scope !== constants_1.GLOBAL_SCOPE_NAME) {
        const invalidScopePrefix = `Keys of ${colorize_special_text_1.colorize.file(constants_1.CONFIG_FILE_NAME)}[${constants_1.PACKAGES_DIRECTORY_NAME}] must be npm scopes.\nScope "${colorize_special_text_1.colorize.scope(scope)}" is not a valid scope.`;
        const invalidScopeSuffix = `\nTo configure packages without a scope, use the key "${colorize_special_text_1.colorize.scope(constants_1.GLOBAL_SCOPE_NAME)}".`;
        const result = validateNpmPackageName(`${scope}/test`);
        if (!result.validForNewPackages) {
            return Either_1.left([{
                    type: errors_1.ErrorType.InvalidScope,
                    message: `${invalidScopePrefix}${invalidScopeSuffix}`
                }]);
        }
    }
    return Either_1.right(constants_1.SUCCESS);
}
exports.validateScope = validateScope;
//# sourceMappingURL=validate-scope.js.map