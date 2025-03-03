import axios from "axios"

const embeddingCache = new Map() // Cache to avoid redundant API calls

// Simple fallback embedding function that creates a basic vector
// This is only used when OpenAI API is unavailable
function createFallbackEmbedding(text: string): number[] {
  // Create a simple hash-based embedding (not for production use)
  const vector = new Array(1536).fill(0) // OpenAI embeddings are 1536 dimensions

  // Simple hash function to populate some values
  const hash = Array.from(text).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  // Use the hash to seed some values in the vector
  for (let i = 0; i < 100; i++) {
    const index = Math.abs((hash * (i + 1)) % vector.length)
    vector[index] = Math.sin(hash * (i + 1)) * 0.1
  }

  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  return vector.map((val) => (magnitude > 0 ? val / magnitude : 0))
}

export async function getEmbedding(text: string, retries = 3): Promise<number[]> {
  console.log("Embedding Input Text Length:", text.length)

  // Truncate text if it's too long (OpenAI has token limits)
  const truncatedText = typeof text === "string" ? text.slice(0, 8000) : JSON.stringify(text).slice(0, 8000)

  if (embeddingCache.has(truncatedText)) {
    return embeddingCache.get(truncatedText)
  }

  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not found, using fallback embedding")
    const fallbackEmbedding = createFallbackEmbedding(truncatedText)
    embeddingCache.set(truncatedText, fallbackEmbedding)
    return fallbackEmbedding
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        input: truncatedText,
        model: "text-embedding-3-small", // Using smaller model to reduce costs
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    const embedding = response.data.data[0].embedding
    embeddingCache.set(truncatedText, embedding) // Store in cache
    return embedding
  } catch (err: any) {
    if (err.response?.status === 429 && retries > 0) {
      const waitTime = Math.pow(2, 3 - retries) * 1000 // Exponential backoff (2s, 4s, 8s)
      console.warn(`Rate limit hit. Retrying in ${waitTime / 1000}s...`)
      await new Promise((res) => setTimeout(res, waitTime))
      return getEmbedding(truncatedText, retries - 1)
    }

    console.error("Embedding API Error:", err?.response?.data || err.message)

    // Use fallback embedding when API fails
    console.warn("Using fallback embedding due to API error")
    const fallbackEmbedding = createFallbackEmbedding(truncatedText)
    embeddingCache.set(truncatedText, fallbackEmbedding)
    return fallbackEmbedding
  }
}

