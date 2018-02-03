/**
 * Generate a stub directory and file to prevent nyc from crashing before running
 */
var fs = require('fs');

if (!fs.existsSync('./.nyc_output')) {
  fs.mkdirSync('./.nyc_output');
}
