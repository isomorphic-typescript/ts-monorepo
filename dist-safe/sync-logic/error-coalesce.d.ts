import { Either } from 'fp-ts/lib/Either';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { ConfigError } from '../common/errors';
import { SUCCESS } from '../common/constants';
export declare const taskEithercoalesceConfigErrors: <T>(results: TaskEither<ConfigError[], T>[]) => TaskEither<ConfigError[], typeof SUCCESS>;
export declare const taskEitherCoalesceConfigErrorsAndObject: <T>(results: TaskEither<ConfigError[], T>[]) => TaskEither<ConfigError[], T[]>;
export declare const eitherCoalesceConfigErrors: <T>(results: Either<ConfigError[], T>[]) => Either<ConfigError[], typeof SUCCESS>;
export declare const eitherCoalesceConfigErrorsAndObject: <T>(results: Either<ConfigError[], T>[]) => Either<ConfigError[], T[]>;
//# sourceMappingURL=error-coalesce.d.ts.map