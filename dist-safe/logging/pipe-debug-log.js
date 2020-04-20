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
const taskEither = require("fp-ts/lib/TaskEither");
// These utility functions are for debugging.
function taskEitherLog(te) {
    taskEither.fold(left => {
        console.log("TaskEither Left =", left);
        return () => __awaiter(this, void 0, void 0, function* () { });
    }, right => {
        console.log("TaskEither Right =", right);
        return () => __awaiter(this, void 0, void 0, function* () { });
    })(te)();
    return te;
}
exports.taskEitherLog = taskEitherLog;
function eitherLog(e) {
    either.fold(left => {
        console.log("Either Left =", left);
    }, right => {
        console.log("Either Right =", right);
    })(e);
    return e;
}
exports.eitherLog = eitherLog;
//# sourceMappingURL=pipe-debug-log.js.map