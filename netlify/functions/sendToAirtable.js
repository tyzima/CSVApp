const axios = require('axios');
const { chunk } = require('lodash'); // Ensure lodash is installed

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.handler = async (event) => {
  // Setting CORS headers to allow only requests from your specific domain
  const headers = {
    'Access-Control-Allow-Origin': 'https://omgcleanup.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handling OPTIONS method for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: 'Method Not Allowed' 
    };
  }

  const payload = JSON.parse(event.body);
  const { records } = payload;
  const batches = chunk(records, 10); // Split records into batches of 10

  const config = {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const responses = [];
    for (const batch of batches) {
      const response = await axios.post('https://api.airtable.com/v0/appJaZT3HpcWc1IFL/upload', { records: batch }, config);
      responses.push(response.data);
      await delay(200); // Delay to prevent hitting the rate limit
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responses)
    };
  } catch (error) {
    return {
      statusCode: error.response ? error.response.status : 500,
      headers,
      body: JSON.stringify(error.response ? error.response.data : { message: 'Internal Server Error' })
    };
  }
};
