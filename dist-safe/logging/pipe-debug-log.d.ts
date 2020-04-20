import * as either from 'fp-ts/lib/Either';
import * as taskEither from 'fp-ts/lib/TaskEither';
export declare function taskEitherLog<L, R>(te: taskEither.TaskEither<L, R>): taskEither.TaskEither<L, R>;
export declare function eitherLog<L, R>(e: either.Either<L, R>): either.Either<L, R>;
//# sourceMappingURL=pipe-debug-log.d.ts.map