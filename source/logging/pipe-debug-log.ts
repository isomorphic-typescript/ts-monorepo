import * as either from 'fp-ts/lib/Either';
import * as taskEither from 'fp-ts/lib/TaskEither';

// These utility functions are for debugging.

export function taskEitherLog<L, R>(te: taskEither.TaskEither<L, R>) {
    taskEither.fold(
        left => {
            console.log("TaskEither Left =", left);
            return async () => {};
        },
        right => {
            console.log("TaskEither Right =", right);
            return async () => {};
        }
    )(te)();
    return te;
}

export function eitherLog<L, R>(e: either.Either<L, R>) {
    either.fold(
        left => {
            console.log("Either Left =", left);
        },
        right => {
            console.log("Either Right =", right);
        }
    )(e);
    return e;
}