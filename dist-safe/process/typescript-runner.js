"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../common/constants");
const command_runner_1 = require("./command-runner");
function generateTSBuildCommand(ttypescipt) {
    return `${ttypescipt ? "t" : ""}tsc -b --watch --preserveWatchOutput ${constants_1.TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH}`;
}
exports.startTypeScript = (monorepoConfig) => {
    const buildTask = new command_runner_1.CommandRunner(generateTSBuildCommand(monorepoConfig.ttypescript));
    return {
        terminate: () => __awaiter(void 0, void 0, void 0, function* () {
            yield buildTask.kill();
        })
    };
};
//# sourceMappingURL=typescript-runner.js.map