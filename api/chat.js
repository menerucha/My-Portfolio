export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
  }

  const { system, messages } = req.body || {};

  // Convert Anthropic-style messages [{role: "user"|"assistant", content: "..."}]
  // into Gemini's format: [{role: "user"|"model", parts: [{text: "..."}]}]
  const contents = (messages || []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await fetch(url, {
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
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.error || "Gemini API error";
      console.error("Gemini API error:", response.status, errorMessage, data);
      return res.status(response.status).json({ error: errorMessage });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return res.status(500).json({ error: "Failed to reach Gemini API" });
  }
}
