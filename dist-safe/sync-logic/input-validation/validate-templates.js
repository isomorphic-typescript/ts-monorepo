"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../common/errors");
const colorize_special_text_1 = require("../../colorize-special-text");
const package_config_1 = require("../converters/input-to-merged/package-config");
const validate_package_config_1 = require("./validate-package-config");
const Either_1 = require("fp-ts/lib/Either");
const pipeable_1 = require("fp-ts/lib/pipeable");
const Array_1 = require("fp-ts/lib/Array");
const error_coalesce_1 = require("../error-coalesce");
const constants_1 = require("../../common/constants");
function recursivelyEnsureTemplateHasNoCircularDependencies(templatePath, templates) {
    if (templatePath.length === 0)
        return Either_1.right(constants_1.SUCCESS);
    const currentTemplateName = templatePath[templatePath.length - 1];
    return pipeable_1.pipe(templates[currentTemplateName].extends, Array_1.map((currentTemplateDependency) => templatePath.includes(currentTemplateDependency) ?
        Either_1.left([{
                type: errors_1.ErrorType.CircularTemplateDependency,
                message: `The template ${colorize_special_text_1.colorize.template(currentTemplateName)} circularly depends on the template ${colorize_special_text_1.colorize.template(currentTemplateDependency)}`
            }]) :
        recursivelyEnsureTemplateHasNoCircularDependencies([...templatePath, currentTemplateDependency], templates)), error_coalesce_1.eitherCoalesceConfigErrors);
}
function validateAndMergeTemplates(templates) {
    const templateEntries = Object.entries(templates);
    return pipeable_1.pipe(
    // 1. Validate template contents to prevent illegal settings.
    pipeable_1.pipe(templateEntries, Array_1.map(([templateName, templateConfig]) => validate_package_config_1.validatePackageConfig(templateConfig, `In the template ${colorize_special_text_1.colorize.template(templateName)}`)), error_coalesce_1.eitherCoalesceConfigErrors), 
    // 2. Ensure all templates which are referenced in template's extends actually exist
    Either_1.chain(() => pipeable_1.pipe(templateEntries, Array_1.map(([templateName, templateConfig]) => pipeable_1.pipe(templateConfig.extends, Array_1.map((templateExtends) => templates[templateExtends] ?
        Either_1.right(constants_1.SUCCESS) : Either_1.left([{
            type: errors_1.ErrorType.NonExistentTemplate,
            message: `The template ${colorize_special_text_1.colorize.template(templateName)} extends non-existent template "${colorize_special_text_1.colorize.template(templateExtends)}".`
        }])), error_coalesce_1.eitherCoalesceConfigErrors)), error_coalesce_1.eitherCoalesceConfigErrors)), 
    // 3. Ensure there are no circular dependencies in the templates.
    Either_1.chain(() => pipeable_1.pipe(templateEntries, Array_1.map(([templateName]) => recursivelyEnsureTemplateHasNoCircularDependencies([templateName], templates)), error_coalesce_1.eitherCoalesceConfigErrors)), 
    // 4. Now merge all templates
    Either_1.chain(() => {
        const mergedTemplatesMap = new Map();
        for (var currentTemplateEntry = templateEntries.shift(); currentTemplateEntry !== undefined; currentTemplateEntry = templateEntries.shift()) {
            const [templateName, templateConfig] = currentTemplateEntry;
            // If all dependencies are in the merged map already.
            if (templateConfig.extends.filter(mergedTemplatesMap.has.bind(mergedTemplatesMap)).length === templateConfig.extends.length) {
                mergedTemplatesMap.set(templateName, package_config_1.mergePackageConfig(mergedTemplatesMap, templateConfig));
            }
            else {
                templateEntries.push(currentTemplateEntry);
            }
        }
        return Either_1.right(mergedTemplatesMap);
    }));
}
exports.validateAndMergeTemplates = validateAndMergeTemplates;
//# sourceMappingURL=validate-templates.js.map