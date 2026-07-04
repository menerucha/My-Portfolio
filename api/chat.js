export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const bearerToken = process.env.GOOGLE_API_TOKEN;
  if (!apiKey && !bearerToken) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY or GOOGLE_API_TOKEN" });
  }

  const { system, messages } = req.body || {};

  const contents = (messages || []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent${!bearerToken && apiKey ? `?key=${apiKey}` : ""}`;
  const headers = { "Content-Type": "application/json" };
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  } else {
    headers["x-goog-api-key"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.error || "Gemini API error";
      const help = response.status === 401 || response.status === 403
        ? "Check that your Gemini credentials are valid and that the Generative AI API is enabled in Google Cloud."
        : "";
      console.error("Gemini API error:", response.status, errorMessage, data);
      return res.status(response.status).json({ error: `${errorMessage} ${help}`.trim() });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return res.status(500).json({ error: "Failed to reach Gemini API" });
  }
}
