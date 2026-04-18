const apiKey = 'sk_ec99b4d76243f558edb8472b78704c3ede9a723e6b46318a';

fetch('https://api.elevenlabs.io/v1/user', {
  headers: {
    'xi-api-key': apiKey
  }
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(res => console.log('Response:', res))
.catch(err => console.error('Error:', err));
