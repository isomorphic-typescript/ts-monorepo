import * as t from 'io-ts';
import { MergedPackageConfig } from "../../../common/types/merged-config";
import { convertToMergedPackageJSON } from "./files/package.json";
import deepmerge = require("deepmerge");
import { colorize } from "../../../colorize-special-text";
import { PackageConfig } from '../../../config-file-structural-checking/io-ts-trial';
import { TS_CONFIG_JSON_FILENAME } from '../../../common/constants';
import { MandatoryTSConfigJsonValues } from '../../input-validation/validate-tsconfig.json';

export function mergePackageConfig(templates: Map<string, MergedPackageConfig>,
    subject: t.TypeOf<typeof PackageConfig>, name: string = "", version: string = ""): MergedPackageConfig {

    var result: MergedPackageConfig | undefined;
    
    // 1. Merge default settings into result

    // 2. Merge templates into result.
    const templatesToMerge = [...subject.extends];
    for (var templateName = templatesToMerge.shift(); templateName !== undefined; templateName = templatesToMerge.shift()) {
        const currentTemplate = templates.get(templateName);
        if (currentTemplate === undefined) {
            throw new Error(`Template to merge ${colorize.template(templateName)} is unknown`);
        }
        if (result === undefined) {
            result = currentTemplate;
        } else {
            result = deepmerge(currentTemplate, result);
        }
    }

    // 3. Merge subject into result.
    const packageJSON = (subject.files && subject.files.json) ? subject.files.json["package.json"] : undefined;
    const packageConfigMerged = {
        files: {
            ...(subject.files ?? {}),
            json: {
                ...(subject?.files?.json ?? {}),
                "package.json": convertToMergedPackageJSON(name, version, packageJSON)
            }
        }
    } as MergedPackageConfig;
    if (result === undefined) {
        result = packageConfigMerged
    } else {
        result = deepmerge(result, packageConfigMerged);
    }

    // 4. Merge non-overridable settings into result
    result = deepmerge(result, {
        files: {
            json: {
                [TS_CONFIG_JSON_FILENAME]: MandatoryTSConfigJsonValues
            }
        }
    });

    return result;
}