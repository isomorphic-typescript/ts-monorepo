import { fsAsync, isSymlink } from './fs-async';
import * as path from 'path';

export async function comprehensiveDelete(absolutePath: string) {
    const exists = await fsAsync.exists(absolutePath);
    if (!exists || await isSymlink(absolutePath)) {
        try {
            await fsAsync.deleteFile(absolutePath);
        } catch(e) {}
    } else {
        const stats = await fsAsync.statistics(absolutePath);
        if(stats.isDirectory()) {
            const children = await fsAsync.readDirectory(absolutePath);
            await Promise.all(children
                .map(child => path.join(absolutePath, child))
                .map(comprehensiveDelete));
            await fsAsync.deleteDirectory(absolutePath);
        } else { // it is a file. You delete a file by unlinking it.
            await fsAsync.deleteFile(absolutePath);
        }
    }
}