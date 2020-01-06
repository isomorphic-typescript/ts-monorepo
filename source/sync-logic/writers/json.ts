import * as fs from 'fs';
import * as path from 'path';

import { log } from '../../util/log';

import { deepComparison } from '../deep-object-compare';
import { ConfigError } from '../../common/errors';
import { assertFileSystemObjectType } from '../../file-system/presence-assertions';
import { FileSystemObjectType } from '../../file-system/object';
import { colorize } from '../../colorize-special-text';
import { TaskEither, chain } from 'fp-ts/lib/TaskEither';
import { right } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';

export function writeJsonAndReportChanges(relativePath: string, outputObject: Object): TaskEither<ConfigError[], string> {
    const outputJSONString = JSON.stringify(outputObject, null, 2);
    const absolutePath = path.resolve(relativePath);
    return pipe(
        assertFileSystemObjectType(relativePath, [FileSystemObjectType.file, FileSystemObjectType.nothing]),
        chain(descriptor => async () => {
            if (descriptor.type === FileSystemObjectType.file) {
                // The json file already existed, so we will print a detailed explanation of changes to the file after writing it to disk,
                // to inform the end-user of all the changes made.
                const currentJSONString = (await fs.promises.readFile(absolutePath)).toString();
                var parseFailed = false;
                var currentObject: any;
                try {
                    currentObject = JSON.parse(currentJSONString);
                } catch(e) {
                    parseFailed = true;
                    log.error(`The current contents of '${colorize.file(relativePath)}' are not valid JSON.`);
                    log.info(`Replacing current contents of '${colorize.file(relativePath)}' with the JSON\n${outputJSONString}`);
                }
                if (!parseFailed && currentObject !== undefined) {
                    const differences = deepComparison(currentObject, outputObject, "");
                    if (differences.length > 0) {
                        log.trace(`modifying ${colorize.file(relativePath)}`);
                    }
                    differences.forEach(explanation => {
                        log.info(explanation);
                    });
                }
            }
            try {
                await fs.promises.writeFile(absolutePath, outputJSONString);
            } catch(e) {
                throw new Error(e);
            }
            return right(outputJSONString);
        })
    );
}