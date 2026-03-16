import { loadEnv } from 'vite';
const env = loadEnv('development', '.', '');
console.log("Vite loaded env:", env.GEMINI_API_KEY);
