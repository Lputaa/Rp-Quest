import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Sage Chat Endpoint
  app.post("/api/sage", async (req, res) => {
    try {
      const { prompt, transactions, language } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: language === 'id' ? "API Key Gemini tidak ditemukan! Sage terdiam." : "Gemini API Key missing! The Sage is silent." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Context summarizing for Sage
      const systemInstruction = `You are the Sage of the Realm, a wise financial advisor in a medieval fantasy setting. 
      You help adventurers manage their Gold (money). You use words like quests, potions, bounties, and tolls. 
      You MUST respond in ${language === 'id' ? 'Indonesian language (Bahasa Indonesia)' : 'English'}, maintaining the medieval fantasy tone.
      Answer the user's question based strictly on their last 30 days of transactions provided: ${JSON.stringify(transactions)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Sage Error:", error);
      res.status(500).json({ error: "The Sage needs rest. Too many inquiries." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
