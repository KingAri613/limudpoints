// netlify/functions/generate.js
const { GoogleGenAI, Type } = require("@google/genai");

// Handler function for Netlify
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Check if API_KEY is available
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { type } = JSON.parse(event.body);

    let prompt;
    if (type === 'reward') {
      prompt = "Generate 5 creative reward ideas for students in a Jewish classroom. The rewards should be fun, educational, and culturally relevant. Examples could be related to Jewish holidays, values (mitzvot), or culture.";
    } else if (type === 'reason') {
      prompt = "Generate 5 positive reasons for giving points to a student in a Jewish classroom setting. The reasons should be concise and related to good behavior, effort, or Jewish values (middot).";
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid generation type specified.' }) };
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        ideas: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A single reward or reason idea."
          },
          description: "A list of generated ideas."
        },
      },
      required: ["ideas"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    // The response.text from the SDK is already a JSON string.
    // We send it back to the client.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.text,
    };

  } catch (error) {
    console.error('Error in Netlify function:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while generating AI content.' }),
    };
  }
};
