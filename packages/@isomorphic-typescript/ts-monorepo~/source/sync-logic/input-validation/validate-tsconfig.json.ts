import * as t from 'io-ts';
import * as either from 'fp-ts/lib/Either';
import * as array from 'fp-ts/lib/Array';
import { PartialTSConfigJson } from '../../common/types/io-ts/config-types';
import { ConfigError, ErrorType } from "../../common/errors";
import { TOOL_SHORT_NAME, TS_CONFIG_JSON_ROOT_DIR, TS_CONFIG_JSON_OUT_DIR, Success, SUCCESS } from "../../common/constants";
import { pipe } from 'fp-ts/lib/pipeable';
import { eitherCoalesceConfigErrors } from '../error-coalesce';
import { colorize } from '../../colorize-special-text';

export const MandatoryTSConfigJsonValues = {
    compilerOptions: {
        rootDir: TS_CONFIG_JSON_ROOT_DIR,
        outDir: TS_CONFIG_JSON_OUT_DIR,
        // See https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson
        composite: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
    },
    references: []
};

function ensureValueNotSetExplicitly(field: string, compilerOptions: boolean, errorType: ErrorType, tsConfig: t.TypeOf<typeof PartialTSConfigJson>, configLocation: string): either.Either<ConfigError[], Success> {
    function generateError(fullFieldName: string): ConfigError {
        return {
            type: errorType,
            message: `${configLocation} the ${colorize.file('tsconfig.json')} config illegally sets field '${colorize.type(fullFieldName)}' explicitly. ${colorize.package(TOOL_SHORT_NAME)} will set this for you.`
        }
    }
    if (compilerOptions) {
        if (field in tsConfig.compilerOptions) {
            return either.left([generateError(`compilerOptions.${field}`)]);
        }
    } else {
        if (field in tsConfig) {
            return either.left([generateError(field)]);
        }
    }
    return either.right(SUCCESS);
}

// TODO: validate based on the non-overrideable settings 
export function validateTSConfigJson(tsConfig: t.TypeOf<typeof PartialTSConfigJson>, configLocation: string): either.Either<ConfigError[], Success> {
    return pipe(
        [
            (() => {
                if (tsConfig.compilerOptions) {
                    return pipe(
                        Object.keys(MandatoryTSConfigJsonValues.compilerOptions),
                        array.map(mandatoryValueKey => 
                            ensureValueNotSetExplicitly(mandatoryValueKey, true, ErrorType.ExplicitlySetNonOverridableValueInTSConfigJson, tsConfig, configLocation)),
                        eitherCoalesceConfigErrors
                    );
                }
                return either.right(SUCCESS);
            })(),
            ensureValueNotSetExplicitly('references', false, ErrorType.ExplicitlySetNonOverridableValueInTSConfigJson, tsConfig, configLocation)
        ],
        eitherCoalesceConfigErrors
    );
}