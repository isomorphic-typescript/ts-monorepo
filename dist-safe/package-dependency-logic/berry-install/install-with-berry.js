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
const either = require("fp-ts/lib/Either");
const constants_1 = require("../../common/constants");
const command_runner_1 = require("../../process/command-runner");
const pipeable_1 = require("fp-ts/lib/pipeable");
function installViaBerry() {
    return pipeable_1.pipe(() => __awaiter(this, void 0, void 0, function* () {
        yield (new command_runner_1.CommandRunner("yarn install")).waitUntilDone();
        return either.right(constants_1.SUCCESS);
    }));
}
exports.installViaBerry = installViaBerry;
//# sourceMappingURL=install-with-berry.js.map