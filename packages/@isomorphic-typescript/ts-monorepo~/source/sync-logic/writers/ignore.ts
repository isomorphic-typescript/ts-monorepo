import * as fs from 'fs';
import * as path from 'path';
import { EOL } from 'os';

import { log } from '../../logging/log';

import { deepComparison } from '../deep-object-compare';
import { ConfigError } from '../../common/errors';
import { assertFileSystemObjectType } from '../../file-system/presence-assertions';
import { FileSystemObjectType } from '../../file-system/object';
import { colorize } from '../../colorize-special-text';
import { TaskEither, chain } from 'fp-ts/lib/TaskEither';
import { right } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

// Examples of uses: .npmignore, .gitignore
// TODO: in the future use the later lines to cancel out earlier lines if they dictate contradictory rules.
export function writeIgnoreAndReportChanges(relativePath: string, outputLines: string[]): TaskEither<ConfigError[], string> {
    const absolutePath = path.resolve(relativePath);
    const outputString = outputLines.join(EOL);
    return pipe(
        assertFileSystemObjectType(relativePath, [FileSystemObjectType.file, FileSystemObjectType.nothing]),
        chain(descriptor => async () => {
            if (descriptor.type === FileSystemObjectType.file) {
                // The ignore file already existed, so we will print a detailed explanation of changes to the file after writing it to disk,
                // to inform the end-user of all the changes made.
                const currentIgnoreFile = (await fs.promises.readFile(absolutePath)).toString();
                const currentIgnoreFileLines = currentIgnoreFile.split(EOL).join("\n").split("\n");
                const differences = deepComparison(currentIgnoreFileLines, outputLines, "");
                if (differences.length > 0) {
                    log.trace(`modifying file ${colorize.file(relativePath)}`);
                }
                differences.forEach(explanation => {
                    log.info(explanation);
                });
            } else if (descriptor.type === FileSystemObjectType.nothing) {
                log.info(`creating file ${colorize.file(relativePath)}`);
            }
            try {
                await fs.promises.writeFile(absolutePath, outputString);
            } catch(e) {
                throw new Error(e);
            }
            return right(outputString);
        })
    );
}