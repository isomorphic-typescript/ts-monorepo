import * as t from 'io-ts';
import { PackageConfig } from '../../common/types/io-ts/config-types';
import { MergedPackageConfig } from "../../common/types/merged-config";
import { ConfigError, ErrorType } from "../../common/errors";
import { colorize } from "../../colorize-special-text";
import { mergePackageConfig } from "../converters/input-to-merged/package-config";
import { validatePackageConfig } from "./validate-package-config";
import { Either, left, right, chain } from 'fp-ts/lib/Either';
import { pipe } from "fp-ts/lib/pipeable";
import { map as arrayMap } from 'fp-ts/lib/Array';
import { eitherCoalesceConfigErrors } from "../error-coalesce";
import { SUCCESS, Success } from "../../common/constants";

function recursivelyEnsureTemplateHasNoCircularDependencies(templatePath: string[], templates: {[name: string]: t.TypeOf<typeof PackageConfig>}): Either<ConfigError[], Success> {
    if (templatePath.length === 0) return right(SUCCESS);
    const currentTemplateName = templatePath[templatePath.length - 1];
    return pipe(
        templates[currentTemplateName].extends,
        arrayMap((currentTemplateDependency) => templatePath.includes(currentTemplateDependency) ?
            left([{
                type: ErrorType.CircularTemplateDependency,
                message: `The template ${colorize.template(currentTemplateName)} circularly depends on the template ${colorize.template(currentTemplateDependency)}`
            }]) :
            recursivelyEnsureTemplateHasNoCircularDependencies([...templatePath, currentTemplateDependency], templates)
        ),
        eitherCoalesceConfigErrors
    );
}

export function validateAndMergeTemplates(templates: {[name: string]: t.TypeOf<typeof PackageConfig>}): Either<ConfigError[], Map<string, MergedPackageConfig>> {
    const templateEntries = Object.entries(templates);
    return pipe(
        // 1. Validate template contents to prevent illegal settings.
        pipe(
            templateEntries,
            arrayMap(([templateName, templateConfig]) => validatePackageConfig(
                templateConfig, 
                `In the template ${colorize.template(templateName)}`
            )),
            eitherCoalesceConfigErrors
        ),
        // 2. Ensure all templates which are referenced in template's extends actually exist
        chain(() => pipe(
            templateEntries,
            arrayMap(([templateName, templateConfig]) => pipe(
                templateConfig.extends,
                arrayMap((templateExtends) => templates[templateExtends] ?
                    right(SUCCESS) : left([{
                        type: ErrorType.NonExistentTemplate,
                        message: `The template ${colorize.template(templateName)} extends non-existent template "${colorize.template(templateExtends)}".`
                    } as ConfigError])
                ),
                eitherCoalesceConfigErrors,
            )),
            eitherCoalesceConfigErrors
        )),
        // 3. Ensure there are no circular dependencies in the templates.
        chain(() => pipe(
            templateEntries,
            arrayMap(([templateName]) => recursivelyEnsureTemplateHasNoCircularDependencies([templateName], templates)),
            eitherCoalesceConfigErrors
        )),
        // 4. Now merge all templates
        chain(() => {
            const mergedTemplatesMap: Map<string, MergedPackageConfig> = new Map();
            for (var currentTemplateEntry = templateEntries.shift(); currentTemplateEntry !== undefined; currentTemplateEntry = templateEntries.shift()) {
                const [templateName, templateConfig] = currentTemplateEntry;
                // If all dependencies are in the merged map already.
                if (templateConfig.extends.filter(mergedTemplatesMap.has.bind(mergedTemplatesMap)).length === templateConfig.extends.length) {
                    mergedTemplatesMap.set(templateName,mergePackageConfig(mergedTemplatesMap, templateConfig));
                } else {
                    templateEntries.push(currentTemplateEntry);
                }
            }
            return right(mergedTemplatesMap);
        })
    );
}