import { MonorepoPackageRegistry } from "../../package-dependency-logic/monorepo-package-registry";
import { ConfigError } from "../../common/errors";
import { Success } from "../../common/constants";
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { TSMonorepoJson } from "../../common/types/io-ts/config-types";
export declare function validateMonorepoConfig(monorepoConfig: t.TypeOf<typeof TSMonorepoJson>, packageRegistry: MonorepoPackageRegistry): taskEither.TaskEither<ConfigError[], Success>;
//# sourceMappingURL=validate-monorepo-config.d.ts.map