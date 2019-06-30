import * as ansicolor from 'ansicolor';

import { fsAsync } from '../util/fs-async';
import { log } from '../util/log';
import { validateFilePresence } from '../util/validate-presence-in-file-system';

import { deepComparison } from './deep-object-compare';

export async function syncGenericJSON(absolutePath: string, pathDisplayName: string, outputObject: any) {
    const outputJSONString = JSON.stringify(outputObject, null, 2);

    const outputFilePresence = await validateFilePresence(
        absolutePath, 
        false, false, 
        outputJSONString, 
        pathDisplayName);

    if(outputFilePresence.exists && !outputFilePresence.wrong) {
        // The json file already existed, so we will print a detailed explanation of changes to the file after writing it to disk,
        // to inform the end-user of all the changes made.
        const currentJSONString = (await fsAsync.readFile(absolutePath)).toString();
        var parseFailed = false;
        var currentObject: any;
        try {
            currentObject = JSON.parse(currentJSONString);
        } catch(e) {
            parseFailed = true;
            log.error(`The current contents of '${ansicolor.green(pathDisplayName)}' are not valid JSON.`);
            log.info(`Replacing current contents of '${ansicolor.green(pathDisplayName)}' with the JSON\n${outputJSONString}`);
        }
        if (!parseFailed && currentObject !== undefined) {
            const differences = deepComparison(currentObject, outputObject, "");
            if (differences.length > 0) {
                log.trace(ansicolor.green(pathDisplayName));
            }
            differences.forEach(explanation => {
                log.info(explanation);
            });
        }
        await fsAsync.writeFile(absolutePath, outputJSONString);
    }
}