import { Terminateable } from "../common/types/traits";
import { TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH } from "../common/constants";
import { MonorepoConfig } from "../common/types/io-ts/config-types";
import { CommandRunner } from "./command-runner";

function generateTSBuildCommand(ttypescipt: boolean) {
    return `${ttypescipt ? "t" : ""}tsc -b --watch --preserveWatchOutput ${TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH}`;
}

export const startTypeScript = (monorepoConfig: MonorepoConfig): Terminateable => {
    const buildTask = new CommandRunner(generateTSBuildCommand(monorepoConfig.ttypescript));
    return {
        terminate: async () => {
            await buildTask.kill();
        }
    }
}