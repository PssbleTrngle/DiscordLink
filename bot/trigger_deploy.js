const axios = require('axios');
require('dotenv').config('./.env')

const repo = 'PssbleTrngle/DiscordLink';
const event_type = process.argv[2]
const client_payload = { [process.argv[3]]: process.argv[4] };

axios.post(`https://api.github.com/repos/${repo}/dispatches`, { event_type, client_payload }, {
    headers: {
        'Accept': 'application/vnd.github.everest-preview+json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    }
})
    .then(console.log(`Triggered ${event_type}`))
    .catch(e => console.error(e.message))