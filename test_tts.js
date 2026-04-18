const apiKey = 'sk_ec99b4d76243f558edb8472b78704c3ede9a723e6b46318a';
const voiceId = 'KTHM9w7WQa0GKFb0ZXAm';

fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': apiKey
  },
  body: JSON.stringify({
    text: "Test",
    model_id: "eleven_multilingual_v2"
  })
})
.then(async res => {
  if (!res.ok) {
    console.log('Status:', res.status);
    console.log('Error Data:', await res.json().catch(() => ({})));
  } else {
    console.log('Success!', res.status);
  }
})
.catch(err => console.error('Error:', err));
