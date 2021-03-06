import fs from 'fs';

export function replaceAllInEmail(string, params) {
    let _result = '';
    _result = string.replace(/\{\{[^\}]*\}\}/g, matched => {
        return params[matched.replace('{', '').replace('}', '')];
    });
    return _result.replace(/{[^{}]+}/g, matched => {
        return params[matched.replace('{', '').replace('}', '')];
    });
}

export function readFileAsync(path) {
    return new Promise(function (resolve, reject) {
        return fs.readFile(path, 'utf8', function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}