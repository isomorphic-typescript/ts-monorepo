import { MonorepoPackageRegistry } from "../../../../package-dependency-logic/monorepo-package-registry";
import * as taskEither from 'fp-ts/lib/TaskEither';
import { ConfigError } from "../../../../common/errors";
export declare function monorepoPackageRegistryToMonorepoRootPackageJson(monorepoPackageRegistry: MonorepoPackageRegistry): taskEither.TaskEither<ConfigError[], Object>;
//# sourceMappingURL=monorepo-package.json.d.ts.map