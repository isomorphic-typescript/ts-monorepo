import * as taskEither from 'fp-ts/lib/TaskEither';
import { ConfigError } from '../common/errors';
import { Terminateable } from '../common/types/traits';
export declare function syncMonorepo(): taskEither.TaskEither<ConfigError[], Terminateable>;
//# sourceMappingURL=sync-monorepo.d.ts.map