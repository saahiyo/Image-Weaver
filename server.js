// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({path: "./.env.local"});


const app = express();
app.use(cors());
app.use(express.json());

// POST /generate-image
app.post("/generate-image", async (req, res) => {
  const { prompt, model } = req.body;

  try {
    const apiUrl = "https://api.infip.pro/v1/images/generations";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`, // <-- move to .env later
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const result = await response.json();
    const imageUrl = result?.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: "No image URL returned." });
    }

    res.json({ url: imageUrl });
  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ error: "Image generation failed." });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
