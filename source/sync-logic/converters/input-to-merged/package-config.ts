import * as t from 'io-ts';
import { MergedPackageConfig } from "../../../common/types/merged-config";
import { convertToMergedPackageJSON } from "./files/package.json";
import deepmerge = require("deepmerge");
import { colorize } from "../../../colorize-special-text";
import { PackageConfig } from '../../../config-file-structural-checking/io-ts-trial';

export function mergePackageConfig(templates: Map<string, MergedPackageConfig>,
    subject: t.TypeOf<typeof PackageConfig>, name: string = "", version: string = ""): MergedPackageConfig {

    var current: MergedPackageConfig | undefined;

    // First merge templates into result.
    const templatesToMerge = [...subject.extends];
    for (var templateName = templatesToMerge.shift(); templateName !== undefined; templateName = templatesToMerge.shift()) {
        const currentTemplate = templates.get(templateName);
        if (currentTemplate === undefined) {
            throw new Error(`Template to merge ${colorize.template(templateName)} is unknown`);
        }
        if (current === undefined) {
            current = currentTemplate;
        } else {
            current = deepmerge(currentTemplate, current);
        }
    }

    // Now merge subject into result.
    const packageJSON = (subject.files && subject.files.json) ? subject.files.json["package.json"] : undefined;
    const packageConfigMerged = {
        files: {
            ...(subject.files ? subject.files : {}),
            json: {
                ...((subject.files && subject.files.json) ? subject.files.json : {}),
                "package.json": convertToMergedPackageJSON(name, version, packageJSON)
            }
        }
    }
    if (current === undefined) {
        current = packageConfigMerged
    } else {
        current = deepmerge(current, packageConfigMerged);
    }

    return current;
}