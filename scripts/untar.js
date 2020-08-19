const path = require('path');
const tar = require('tar');

const sourceTarLocation = process.argv[2];
const destinationDirectoryLocation = process.argv[3];

tar.extract({
    cwd: path.resolve(destinationDirectoryLocation),
    file: path.resolve(sourceTarLocation),
    sync: true,
    strip: 1
});