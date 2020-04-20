import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import { Success, SUCCESS } from '../../common/constants';
import { ConfigError } from '../../common/errors';
import { CommandRunner } from '../../process/command-runner';
import { pipe } from 'fp-ts/lib/pipeable';

export function installViaBerry(): taskEither.TaskEither<ConfigError[], Success> {
    return pipe(
        async () => {
            await (new CommandRunner("yarn install")).waitUntilDone();
            return either.right(SUCCESS);
        }
    );
}