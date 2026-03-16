import express from "express";
import axios from "axios";
import xml2js from "xml2js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL = "https://demo.tradelocker.com/backend-api";
const EMAIL = "minthantnaing414@gmail.com";
const PASSWORD = "&/dYD3WtN|";
const SERVER = "HEROFX";

let cachedToken: string | null = null;
let cachedAccountId: string | null = null;

let calendarCache: any[] = [];
let tradesCache: any[] = [];

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

app.get('/api/data/:key', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('app_data').select('value').eq('key', req.params.key).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data.value);
});

app.post('/api/data/:key', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const { error } = await supabase.from('app_data').upsert({ key: req.params.key, value: req.body });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

async function login() {
    const res = await fetch(`${BASE_URL}/auth/jwt/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD, server: SERVER })
    });
    const data = await res.json();
    cachedToken = data.accessToken;
}

async function getAccount() {
    const res = await fetch(`${BASE_URL}/auth/jwt/all-accounts`, {
        headers: { 
            Authorization: `Bearer ${cachedToken}`,
            "accNum": "1",
            "accept": "application/json"
        }
    });
    const data = await res.json();
    cachedAccountId = data.accounts[0].id;
}

app.get("/calendar", async (req, res) => {
  try {
    const rssUrl = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
    const response = await axios.get(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const parsed = await xml2js.parseStringPromise(response.data, { explicitArray: false });
    const events = parsed.weeklyevents?.event || [];
    const usdEvents = events.filter((ev: any) => ev.country === "USD" || ev.country?.[0] === "USD");
    calendarCache = usdEvents;
    return res.json(usdEvents);
  } catch (err) {
    return res.json(calendarCache);
  }
});

app.get("/trades", async (req, res) => {
    try {
        if (!cachedToken) await login();
        if (!cachedAccountId) await getAccount();
        const historyUrl = `${BASE_URL}/trade/accounts/${cachedAccountId}/ordersHistory`;
        const tradeRes = await fetch(historyUrl, {
            headers: {
                "accept": "application/json",
                Authorization: `Bearer ${cachedToken}`,
                "accNum": "1"
            }
        });
        const tradeData = await tradeRes.json();
        const ordersHistory = tradeData.d.ordersHistory;
        tradesCache = ordersHistory;
        return res.json(ordersHistory);
    } catch (err: any) {
        return res.json(tradesCache);
    }
});

app.get("/api/news", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not configured on server" });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const { isWeekend } = req.query;
        
        let combinedPrompt = "Analyze the top 5 to 8 high-impact macroeconomic and market-moving news events affecting S&P 500 (US500) and Nasdaq (NQ). Group similar stories together to ensure there are NO duplicate events. Rank the list with the absolute highest-impact, distinct events at the top.\nReturn a single JSON object with the following keys:\n- 'news12h': an array of events from the last 12 hours.";

        if (isWeekend !== 'true') {
            combinedPrompt += "\n- 'newsMyTime': an array of events specifically during the most recent US morning trading session (6:30 AM to 11:30 AM NY Time).";
        }

        combinedPrompt += "\nEach event object must have keys 'news' (extremely concise headline, MAXIMUM 5 to 7 words, no explanations or subtitles), 'impact' ('High'), and 'date' (formatted like '10th'). If no news exists for a category, return an empty array []. Do not include markdown formatting like ```json or any other text.";

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: combinedPrompt,
            config: {
                temperature: 0.1,
                tools: [{ googleSearch: {} }]
            }
        });

        let text = response.text ? response.text.trim() : "";
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

        if (!text || text.toUpperCase() === "NONE") {
            return res.json({ news12h: [], newsMyTime: [] });
        }

        const data = JSON.parse(text);
        res.json(data);
    } catch (err: any) {
        console.error("Server News Error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch news" });
    }
});

// ... (rest of the file)

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;