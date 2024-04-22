const axios = require('axios');

exports.handler = async (event) => {
  // Setting CORS headers to allow only requests from your specific domain
  const headers = {
    'Access-Control-Allow-Origin': 'https://omgcleanup.netlify.app', // Allow only this domain
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' // Adjust methods according to your needs
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

  const config = {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.post('https://api.airtable.com/v0/appJaZT3HpcWc1IFL/upload', { records }, config);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: error.response ? error.response.status : 500,
      headers,
      body: JSON.stringify(error.response ? error.response.data : { message: 'Internal Server Error' })
    };
  }
};
