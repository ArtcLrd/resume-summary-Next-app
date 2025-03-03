import { NextResponse } from "next/server"
import pinecone from "@/lib/pinecone"
import { getEmbedding } from "@/lib/embeddings"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Received Data Type:", typeof body.text)

    const { id, text, name, email, linkedin } = body
    if (!id || !text || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert text to string if it's an object
    const textToEmbed = typeof text === "object" ? JSON.stringify(text) : text

    // Generate embedding
    const vector = await getEmbedding(textToEmbed)
    if (!vector || !Array.isArray(vector)) {
      throw new Error("Invalid embedding generated")
    }

    // Store in Pinecone
    const index = pinecone.Index("resumes")
    await index.upsert([
      {
        id,
        values: vector,
        metadata: {
          name,
          email,
          linkedin,
          text: typeof text === "object" ? JSON.stringify(text) : text,
        },
      },
    ])

    return NextResponse.json({ message: "Resume stored successfully" }, { status: 200 })
  } catch (error) {
    console.error("Store API Error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
