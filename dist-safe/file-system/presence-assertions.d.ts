import { FileSystemObjectType, FileSystemObjectDescriptor } from "./object";
import { ConfigError } from '../common/errors';
import { Success } from '../common/constants';
import { TaskEither } from 'fp-ts/lib/TaskEither';
export declare function assertFileSystemObjectType(pathRelativeToProjectRoot: string, isOneOf: FileSystemObjectType[]): TaskEither<ConfigError[], FileSystemObjectDescriptor>;
export declare function assertDirectoryExistsOrCreate(directoryPathRelativeToProjectRoot: string): TaskEither<ConfigError[], Success>;
//# sourceMappingURL=presence-assertions.d.ts.map