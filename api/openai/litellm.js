import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const LITELLM_ENDPOINT = process.env.LITELLM_ENDPOINT || 'http://localhost:4000';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || 'special-key-for-litellm';
const MODEL_ID = process.env.MODEL_ID || 'moonshotai/Kimi-K2-Thinking';

const client = new OpenAI({
  baseURL: LITELLM_ENDPOINT,
  apiKey: LITELLM_API_KEY,
});

export async function chatCompletion(messages, options = {}) {
  try {
    const response = await client.chat.completions.create({
      model: MODEL_ID,
      messages: messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      stream: options.stream ?? false,
    });

    return {
      success: true,
      answer: response.choices[0].message.content,
      usage: response.usage,
    };
  } catch (error) {
    console.error('LiteLLM Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function streamChatCompletion(messages, options = {}) {
  try {
    const stream = await client.chat.completions.create({
      model: MODEL_ID,
      messages: messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      stream: true,
    });

    return {
      success: true,
      stream: stream,
    };
  } catch (error) {
    console.error('LiteLLM Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function getModelInfo() {
  return {
    endpoint: LITELLM_ENDPOINT,
    model: MODEL_ID,
  };
}
