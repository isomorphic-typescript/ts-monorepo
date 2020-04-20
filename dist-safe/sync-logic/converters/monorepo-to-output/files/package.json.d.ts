import * as taskEither from 'fp-ts/lib/TaskEither';
import { MonorepoPackage } from "../../../../common/types/monorepo-package";
import { MonorepoPackageRegistry } from "../../../../package-dependency-logic/monorepo-package-registry";
import { CachedLatestVersionFetcher } from "../../../cached-latest-version-fetcher";
import { ConfigError } from '../../../../common/errors';
export declare function monorepoPackageToPackageJsonOutput(monorepoPackage: MonorepoPackage, monorepoPackageRegistry: MonorepoPackageRegistry, latestVersionGetter: CachedLatestVersionFetcher): taskEither.TaskEither<ConfigError[], Object>;
//# sourceMappingURL=package.json.d.ts.map