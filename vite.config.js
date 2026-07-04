import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function geminiChatMiddleware(apiKey) {
  return async (req, res, next) => {
    if (req.method !== "POST" || req.url !== "/api/chat") {
      next();
      return;
    }

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Server is missing GEMINI_API_KEY" }));
      return;
    }

    try {
      const body = await new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", (chunk) => {
          raw += chunk;
        });
        req.on("end", () => {
          try {
            resolve(raw ? JSON.parse(raw) : {});
          } catch (error) {
            reject(error);
          }
        });
        req.on("error", reject);
      });

      const { system, messages } = body || {};

      const contents = (messages || []).map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents,
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            generationConfig: { maxOutputTokens: 1000 },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        res.statusCode = response.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: data?.error?.message || "Gemini API error" }));
        return;
      }

      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ content: [{ type: "text", text }] }));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Failed to reach Gemini API" }));
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      {
        name: "local-gemini-chat",
        configureServer(server) {
          server.middlewares.use(geminiChatMiddleware(env.GEMINI_API_KEY));
        },
        configurePreviewServer(server) {
          server.middlewares.use(geminiChatMiddleware(env.GEMINI_API_KEY));
        },
      },
    ],
  };
});
