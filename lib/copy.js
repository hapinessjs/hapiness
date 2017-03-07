const fs = require('fs-extra');

function copy() {
    fs.copy(__dirname + '/injection-js', './node_modules/injection-js', (error) => {
        if (error) {
            return console.error(error);
        }
        console.info('Library injection-js copied in node_modules');
    });
}

copy();
