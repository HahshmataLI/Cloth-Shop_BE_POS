// barcode generator using bwip-js - returns base64 PNG buffer
const bwipjs = require('bwip-js');


async function generateBarcodePNG(text, options = {}) {
// options can include bcid: 'code128' etc.
const bcid = options.bcid || 'code128';
const scale = options.scale || 3;
const height = options.height || 10;
const includetext = options.includetext !== undefined ? options.includetext : true;


return new Promise((resolve, reject) => {
bwipjs.toBuffer(
{
bcid,
text,
scale,
height,
includetext,
textxalign: 'center',
},
(err, png) => {
if (err) return reject(err);
// return base64 string
resolve(png.toString('base64'));
}
);
});
}


module.exports = { generateBarcodePNG };