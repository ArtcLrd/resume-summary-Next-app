import { NextResponse } from "next/server"
import pinecone from "@/lib/pinecone"
import { getEmbedding } from "@/lib/embeddings"
import { extractSkills } from "@/lib/resume-utils"

export async function POST(req: Request) {
  try {
    const { query } = await req.json() // The job description or search query

    if (!query) {
      return NextResponse.json({ error: "Query text is required" }, { status: 400 })
    }

    // Generate embedding for the query
    const queryVector = await getEmbedding(query)
    const index = pinecone.Index("resumes")

    // Perform similarity search
    const searchResults = await index.query({
      vector: queryVector,
      topK: 10, // Retrieve the top 10 matching resumes
      includeMetadata: true,
    })

    // Format the results for the frontend
    const formattedResults =
      searchResults.matches?.map((match) => {
        const metadata = match.metadata as any

        // Extract skills from text
        const skills = extractSkills(metadata.text || "")

        return {
          id: match.id,
          name: metadata.name || "Unknown",
          email: metadata.email || "No email provided",
          linkedin: metadata.linkedin || "",
          skills: skills,
          text: metadata.text || "",
          relevanceScore: Math.round((match.score || 0) * 100), // Convert score to percentage
        }
      }) || []

    return NextResponse.json({ results: formattedResults }, { status: 200 })
  } catch (error) {
    console.error("Search API Error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

