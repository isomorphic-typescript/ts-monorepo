import * as t from 'io-ts';
import { PartialPackageJson } from '../../../../config-file-structural-checking/io-ts-trial';
import { MergedPackageJson } from "../../../../common/types/merged-config";

export function convertToMergedPackageJSON(name: string, version: string,
    inputPackageJSON?: t.TypeOf<typeof PartialPackageJson>): MergedPackageJson {
    return {
        version, // Putting version first allows the user to overwrite specific package version with their own input.
        ...inputPackageJSON, // Their own input.
        name,
        dependencies: inputPackageJSON ?
            inputPackageJSON.dependencies ? inputPackageJSON.dependencies : [] : [],
        devDependencies: inputPackageJSON ?
            inputPackageJSON.devDependencies ? inputPackageJSON.devDependencies : [] : [],
        peerDependencies: inputPackageJSON ?
            inputPackageJSON.peerDependencies ? inputPackageJSON.peerDependencies : [] : [],
        optionalDependencies: inputPackageJSON ?
            inputPackageJSON.optionalDependencies ? inputPackageJSON.optionalDependencies : [] : []
    };
}