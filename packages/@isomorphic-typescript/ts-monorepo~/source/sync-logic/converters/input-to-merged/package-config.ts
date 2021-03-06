import * as t from 'io-ts';
import { MergedPackageConfig } from "../../../common/types/merged-config";
import { convertToMergedPackageJSON } from "./files/package.json";
import deepmerge = require("deepmerge");
import { colorize } from "../../../colorize-special-text";
import { PackageConfig } from '../../../common/types/io-ts/config-types';
import { TS_CONFIG_JSON_FILENAME, PACKAGE_JSON_FILENAME } from '../../../common/constants';
import { MandatoryTSConfigJsonValues } from '../../input-validation/validate-tsconfig.json';
import { MANDATORY_PACKAGE_JSON_VALUES } from '../../input-validation/validate-package.json';

export function mergePackageConfig(templates: Map<string, MergedPackageConfig>,
    subject: t.TypeOf<typeof PackageConfig>, name: string = "", version?: string): MergedPackageConfig {

    var result: MergedPackageConfig
    // 1. Merge default settings into result
    = version ? {
        files: {
            json: {
                [PACKAGE_JSON_FILENAME]: {
                    version
                }
            }
        }
    } as MergedPackageConfig : 
    {} as MergedPackageConfig;

    // 2. Merge templates into result.
    const templatesToMerge = [...subject.extends];
    for (var templateName = templatesToMerge.shift(); templateName !== undefined; templateName = templatesToMerge.shift()) {
        const currentTemplate = templates.get(templateName);
        if (currentTemplate === undefined) {
            throw new Error(`Template to merge ${colorize.template(templateName)} is unknown`);
        }
        result = deepmerge(result, currentTemplate);
    }

    // 3. Merge subject into result.
    const packageJSON = (subject.files && subject.files.json) ? subject.files.json[PACKAGE_JSON_FILENAME] : undefined;
    const packageConfigMerged = {
        files: {
            ...(subject.files ?? {}),
            json: {
                ...(subject?.files?.json ?? {}),
                [PACKAGE_JSON_FILENAME]: convertToMergedPackageJSON(name, packageJSON)
            },
            ignore: {
                ...(subject?.files?.ignore ?? {})
            }
        }
    } as MergedPackageConfig;
    result = deepmerge(result, packageConfigMerged);

    // 4. Merge non-overridable settings into result
    result = deepmerge(result, {
        files: {
            json: {
                [PACKAGE_JSON_FILENAME]: MANDATORY_PACKAGE_JSON_VALUES,
                [TS_CONFIG_JSON_FILENAME]: MandatoryTSConfigJsonValues
            }
        }
    });

    return result;
}