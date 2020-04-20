import { MonorepoPackage } from "../../../common/types/monorepo-package";
import { ConfigError } from '../../../common/errors';
import { Success } from '../../../common/constants';
import { MonorepoPackageRegistry } from '../../../package-dependency-logic/monorepo-package-registry';
import { CachedLatestVersionFetcher } from '../../cached-latest-version-fetcher';
import * as taskEither from 'fp-ts/lib/TaskEither';
export declare function writeMonorepoPackageFiles(monorepoPackage: MonorepoPackage, monorepoPackageRegistry: MonorepoPackageRegistry, latestVersionGetter: CachedLatestVersionFetcher): taskEither.TaskEither<ConfigError[], Success>;
//# sourceMappingURL=write-monorepo-package-files.d.ts.map