const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://tripo-data.rg1.data.tripo3d.com/tripo-studio/20260418/9a728597-8ed7-45a7-9eb2-dbca3255f208/tripo_model_9a728597-8ed7-45a7-9eb2-dbca3255f208_meshopt.glb?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA3E74C7A7R27G2P2V%2F20260419%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260419T043144Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=07e7b579069d95f879688b13e1174620056158778f7e256788f62f85467e256';
const dest = path.join(__dirname, 'public', 'models', 'monk.glb');

// Ensure directory exists
const dir = path.dirname(dest);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

console.log('Downloading high-fidelity monk model...');
const file = fs.createWriteStream(dest);
https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error('Failed to download: ' + response.statusCode);
        process.exit(1);
    }
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download complete: ' + dest);
    });
}).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Download error: ' + err.message);
    process.exit(1);
});
