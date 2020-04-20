import { Either, fold as eFold, left as eLeft, right as eRight } from 'fp-ts/lib/Either';
import { TaskEither, fold as teFold, left as teLeft, right as teRight } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { reduce } from 'fp-ts/lib/Array';

import { ConfigError } from '../common/errors';
import { Success, SUCCESS } from '../common/constants';

// TODO: switch to validations for error coalescing.
export const taskEithercoalesceConfigErrors = <T>(results: TaskEither<ConfigError[], T>[]): TaskEither<ConfigError[], Success> => {
    return pipe(
        results,
        reduce(teRight(SUCCESS), (existingTaskEither, currentTaskEither) => {
            return pipe(
                currentTaskEither,
                teFold(
                    currentErrors => pipe(
                        existingTaskEither,
                        teFold(
                            existingErrors => teLeft([...currentErrors, ...existingErrors]),
                            () => teLeft(currentErrors)
                        )
                    ),
                    () => existingTaskEither
                )
            )
        })
    );
}

export const taskEitherCoalesceConfigErrorsAndObject = <T>(results: TaskEither<ConfigError[], T>[]): TaskEither<ConfigError[], T[]> => {
    return pipe(
        results,
        reduce(teRight([] as T[]), (accumulatorTaskEither, currentTaskEither) => pipe(
            currentTaskEither,
            teFold(
                currentErrors => pipe(
                    accumulatorTaskEither,
                    teFold(
                        accumulationErrors => teLeft([...currentErrors, ...accumulationErrors]),
                        () => teLeft(currentErrors)
                    )
                ),
                currentValues => pipe(
                    accumulatorTaskEither,
                    teFold(
                        teLeft,
                        accumulationValues => teRight([...accumulationValues, currentValues])
                    )
                )
            )
        ))
    );
}

export const eitherCoalesceConfigErrors = <T>(results: Either<ConfigError[], T>[]): Either<ConfigError[], Success> => {
    return pipe(
        results,
        reduce(eRight(SUCCESS), (existingEither, currentEither) => {
            return pipe(
                currentEither,
                eFold(
                    currentErrors => pipe(
                        existingEither,
                        eFold(
                            existingErrors => eLeft([...currentErrors, ...existingErrors]),
                            () => eLeft(currentErrors)
                        )
                    ),
                    () => existingEither
                )
            );
        })
    );
}

// TODO: only use this form.
export const eitherCoalesceConfigErrorsAndObject = <T>(results: Either<ConfigError[], T>[]): Either<ConfigError[], T[]> => {
    return pipe(
        results,
        reduce(eRight([] as T[]), (accumulatorEither, currentEither) => pipe(
            currentEither,
            eFold(
                currentErrors => pipe(
                    accumulatorEither,
                    eFold(
                        accumulationErrors => eLeft([...currentErrors, ...accumulationErrors]),
                        () => eLeft(currentErrors)
                    )
                ),
                currentValues => pipe(
                    accumulatorEither,
                    eFold(
                        eLeft,
                        accumulationValues => eRight([...accumulationValues, currentValues])
                    )
                )
            )
        ))
    );
}