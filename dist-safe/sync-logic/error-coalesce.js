"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Either_1 = require("fp-ts/lib/Either");
const TaskEither_1 = require("fp-ts/lib/TaskEither");
const pipeable_1 = require("fp-ts/lib/pipeable");
const Array_1 = require("fp-ts/lib/Array");
const constants_1 = require("../common/constants");
// TODO: switch to validations for error coalescing.
exports.taskEithercoalesceConfigErrors = (results) => {
    return pipeable_1.pipe(results, Array_1.reduce(TaskEither_1.right(constants_1.SUCCESS), (existingTaskEither, currentTaskEither) => {
        return pipeable_1.pipe(currentTaskEither, TaskEither_1.fold(currentErrors => pipeable_1.pipe(existingTaskEither, TaskEither_1.fold(existingErrors => TaskEither_1.left([...currentErrors, ...existingErrors]), () => TaskEither_1.left(currentErrors))), () => existingTaskEither));
    }));
};
exports.taskEitherCoalesceConfigErrorsAndObject = (results) => {
    return pipeable_1.pipe(results, Array_1.reduce(TaskEither_1.right([]), (accumulatorTaskEither, currentTaskEither) => pipeable_1.pipe(currentTaskEither, TaskEither_1.fold(currentErrors => pipeable_1.pipe(accumulatorTaskEither, TaskEither_1.fold(accumulationErrors => TaskEither_1.left([...currentErrors, ...accumulationErrors]), () => TaskEither_1.left(currentErrors))), currentValues => pipeable_1.pipe(accumulatorTaskEither, TaskEither_1.fold(TaskEither_1.left, accumulationValues => TaskEither_1.right([...accumulationValues, currentValues])))))));
};
exports.eitherCoalesceConfigErrors = (results) => {
    return pipeable_1.pipe(results, Array_1.reduce(Either_1.right(constants_1.SUCCESS), (existingEither, currentEither) => {
        return pipeable_1.pipe(currentEither, Either_1.fold(currentErrors => pipeable_1.pipe(existingEither, Either_1.fold(existingErrors => Either_1.left([...currentErrors, ...existingErrors]), () => Either_1.left(currentErrors))), () => existingEither));
    }));
};
// TODO: only use this form.
exports.eitherCoalesceConfigErrorsAndObject = (results) => {
    return pipeable_1.pipe(results, Array_1.reduce(Either_1.right([]), (accumulatorEither, currentEither) => pipeable_1.pipe(currentEither, Either_1.fold(currentErrors => pipeable_1.pipe(accumulatorEither, Either_1.fold(accumulationErrors => Either_1.left([...currentErrors, ...accumulationErrors]), () => Either_1.left(currentErrors))), currentValues => pipeable_1.pipe(accumulatorEither, Either_1.fold(Either_1.left, accumulationValues => Either_1.right([...accumulationValues, currentValues])))))));
};
//# sourceMappingURL=error-coalesce.js.map