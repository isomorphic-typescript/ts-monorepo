import { NodeDependency } from '../config-file-structural-checking/config';

export interface MergedPackageJson {
    name: string;
    version: string;
    dependencies: NodeDependency[];
    devDependencies: NodeDependency[];
    peerDependencies: NodeDependency[];
    optionalDependencies: NodeDependency[];
}