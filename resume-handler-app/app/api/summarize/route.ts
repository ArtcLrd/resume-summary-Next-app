import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `Please analyze this resume and provide a concise summary including:
    1. Key skills and expertise
    2. Years of experience
    3. Educational background
    4. Notable achievements
    5. Career progression
    6. Areas of specialization
    
    Resume text:
    ${text}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const summary = response.text()

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error) {
    console.error("Gemini API Error:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}

