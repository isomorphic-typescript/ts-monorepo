import * as t from 'io-ts';
import { ErrorType, ConfigError } from "../../errors";
import { colorize } from '../../../colorize-special-text';
import ansicolor = require('ansicolor');
import { CONFIG_FILE_NAME } from '../../constants';
import { constructPresentableConfigObjectPath } from '../../console-formatters/config-path';
import { Exactly } from './exactly';

export const convertErorrs = (pathPrefix: string[], additionalMessage?: string) => (errors: t.Errors): ConfigError[] => {
    return errors.map(error => ({
        type: ErrorType.InvalidConfig,
        message: (() => {
            const lastContextEntry = error.context[error.context.length - 1];
            var priorContextEntry: t.ContextEntry | undefined = undefined;
            const contextWithParentTags: {parentTag: string | undefined, entry: t.ContextEntry}[] = [];
            for (var i = 0; i < error.context.length; ++i) {
                contextWithParentTags[i] = {
                    parentTag: (priorContextEntry?.type as any)?._tag,
                    entry: error.context[i]
                };
                priorContextEntry = error.context[i];
            }

            const keyPath = constructPresentableConfigObjectPath([
                ...pathPrefix,
                ...contextWithParentTags
                    .filter(({parentTag}) => parentTag && !parentTag.includes('IntersectionType'))
                    .map(contextEntry => contextEntry.entry.key)
            ]);

            const badValue = lastContextEntry.actual;
            const badValueString = 
                typeof badValue === 'string' ?
                    `string value "${colorize.badValue(badValue)}"` :
                Array.isArray(badValue) ?
                    `array [${colorize.badValue(String(badValue))}]` :
                lastContextEntry.type instanceof Exactly ?
                    `object with unrecognized key "${colorize.badValue(error.message as string)}"` :
                // else
                    `value ${colorize.badValue(JSON.stringify(badValue))}`;
            return `\n ${ansicolor.magenta('subject:')} ${colorize.file(CONFIG_FILE_NAME)}${keyPath}${
                 "\n"}   ${ansicolor.red('error:')} expected type ${colorize.type(lastContextEntry.type.name)}, but instead got ${badValueString}${additionalMessage ? "\n\n" + additionalMessage : ""}`;
        })()
    }));
}