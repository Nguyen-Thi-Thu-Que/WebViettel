const https = require('https');
const { TextDecoder } = require('util');

/**
 * Gọi Groq API bằng model cấu hình từ .env
 */
const generateResponse = (prompt, timeoutMs = 8000) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    if (!apiKey) {
      return reject(new Error("Missing GROQ_API_KEY in environment variables"));
    }

    const postData = JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept-Charset': 'utf-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      const decoder = new TextDecoder('utf-8');
      let data = '';

      res.on('data', (chunk) => {
        data += decoder.decode(chunk, { stream: true });
      });

      res.on('end', () => {
        try {
          data += decoder.decode(); // flush remaining bytes
          if (res.statusCode !== 200) {
            return reject(new Error(`Groq API returned HTTP status ${res.statusCode}: ${data}`));
          }
          const responseJson = JSON.parse(data);
          const responseText = responseJson.choices?.[0]?.message?.content;
          if (responseText === undefined || responseText === null) {
            return reject(new Error('Empty response from Groq API'));
          }
          resolve(responseText.trim());
        } catch (error) {
          reject(error);
        }
      });
    });

    // Thêm cơ chế timeout
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Groq API request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

module.exports = { generateResponse };
