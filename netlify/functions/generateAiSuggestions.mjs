import { GoogleGenAI } from "@google/genai";

export async function handler(event) {
  // Only allow POST requests from your app
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Get the prompt sent from the frontend
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) };
    }
    
    // This is the crucial security step: The API key is read from Netlify's
    // secure environment variables, never from the frontend code.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set in Netlify.");
    }

    // Initialize the Gemini API client with the secure key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Call the Gemini model to get the suggestions
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    // The Gemini API sometimes wraps its JSON response in markdown backticks.
    // This code reliably removes them to ensure the response is clean JSON.
    let textResponse = response.text.trim();
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7, -3);
    }
    
    // Parse the cleaned text to ensure it's valid JSON before sending it back
    const jsonData = JSON.parse(textResponse);

    // Send the successful JSON response back to the frontend app
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData),
    };

  } catch (error) {
    // If anything goes wrong, log the error and send a clear error message back
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate AI content.', details: error.message }),
    };
  }
}
