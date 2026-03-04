import express from "express";
import axios from "axios";
import xml2js from "xml2js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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

// ================= IN-MEMORY CACHES =================
let calendarCache: any[] = [];
let tradesCache: any[] = [];

app.use(cors());
app.use(express.json());

// Supabase Setup
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
    const response = await axios.get(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const parsed = await xml2js.parseStringPromise(response.data, { explicitArray: false });
    const events = parsed.weeklyevents?.event || [];
    const usdEvents = events.filter((ev: any) => ev.country === "USD" || ev.country?.[0] === "USD");

    // Update in-memory cache instead of writing file
    calendarCache = usdEvents;

    console.log("Now i am at try");
    return res.json(usdEvents);
  } catch (err) {
    console.log("Now i am at catch");
    return res.json(calendarCache); // fallback to in-memory cache
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

        // Update in-memory cache instead of writing file
        tradesCache = ordersHistory;

        console.log("Trades loaded from API and cached.");
        return res.json(ordersHistory);
        
    } catch (err: any) {
        console.error("API Error, attempting to load cache:", err.message);

        console.log("Loading trades from in-memory cache");
        return res.json(tradesCache); // fallback to in-memory cache
    }
});

// Vite middleware for development
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

// Only start the server if we're not in a serverless environment like Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
