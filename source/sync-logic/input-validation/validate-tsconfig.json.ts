import * as t from 'io-ts';
import { PartialTSConfigJson } from '../../config-file-structural-checking/io-ts-trial';
import { ConfigError, ErrorType } from "../../common/errors";
import { TOOL_NAME } from "../../common/constants";

export function validateTSConfigJson(tsConfig: t.TypeOf<typeof PartialTSConfigJson>, configLocation: string): ConfigError[] {
    const tsConfigWithAnyPossibleValues = tsConfig as any;
    const errors: ConfigError[] = [];
    function ensureValueNotSetExplicitly(field: string, compilerOptions: boolean, errorType: ErrorType) {
        function generateError(fullFieldName: string): ConfigError {
            return {
                type: errorType,
                message: `${configLocation} the tsconfig.json config illegally sets the ${fullFieldName} explicitly. ${TOOL_NAME} sets this for you.`
            }
        }
        if (compilerOptions) {
            if (field in tsConfigWithAnyPossibleValues.compilerOptions) {
                errors.push(generateError(`compilerOptions.${field}`));
            }
        } else {
            if (field in tsConfig) {
                errors.push(generateError(field));
            }
        }
    }
    if ('compilerOptions' in tsConfigWithAnyPossibleValues) {
        ensureValueNotSetExplicitly('rootDir', true, ErrorType.ExplicitRootDirInTSConfigJson);
        ensureValueNotSetExplicitly('outDir', true, ErrorType.ExplicitOutDirInTSConfigJson);
        ensureValueNotSetExplicitly('composite', true, ErrorType.ExplicitCompositeInTSConfigJson);
        ensureValueNotSetExplicitly('declaration', true, ErrorType.ExplicitDeclarationInTSConfigJson);
        ensureValueNotSetExplicitly('declarationMap', true, ErrorType.ExplicitDeclarationMapInTSConfigJson);
        ensureValueNotSetExplicitly('sourceMap', true, ErrorType.ExplicitSourceMapInTSConfigJson);
    }
    ensureValueNotSetExplicitly('references', true, ErrorType.ExplicitReferencesInTSConfigJson);
    return errors;
}