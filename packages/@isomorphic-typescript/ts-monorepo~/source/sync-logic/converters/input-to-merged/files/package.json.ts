import * as t from 'io-ts';
import { PartialPackageJson } from '../../../../common/types/io-ts/config-types';
import { MergedPackageJson } from "../../../../common/types/merged-config";

export function convertToMergedPackageJSON(name: string, inputPackageJSON?: t.TypeOf<typeof PartialPackageJson>): MergedPackageJson {
    return {
        ...inputPackageJSON, // Their own input.
        name,
        dependencies: inputPackageJSON?.dependencies ?? [],
        devDependencies: inputPackageJSON?.devDependencies ?? [],
        peerDependencies: inputPackageJSON?.peerDependencies ?? [],
        optionalDependencies: inputPackageJSON?.optionalDependencies ?? []
    } as MergedPackageJson;
}