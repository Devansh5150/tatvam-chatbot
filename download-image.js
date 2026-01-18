const https = require('https');
const fs = require('fs');

// Attempting to download a reliable Wikimedia thumbnail
const url = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Shri_Krishna_Chariot.jpg/800px-Shri_Krishna_Chariot.jpg";
const file = fs.createWriteStream("public/krishna-arjun.jpg");

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

https.get(url, options, function (response) {
    if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log("Download completed. Status: 200");
        });
    } else {
        console.log("Failed to download. Status Code:", response.statusCode);
        response.resume();
        file.close();
    }
}).on('error', function (err) {
    fs.unlink("public/krishna-arjun.jpg", () => { });
    console.error("Error downloading image:", err.message);
});
