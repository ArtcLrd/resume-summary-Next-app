import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // Important for file uploads
  },
};

// Function to extract text from PDF
const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdfParse(buffer);
  return data.text;
};

// Function to extract keywords
// Function to extract text segments based on keywords
const extractTextSections = (text: string): Record<string, string> => {
    const keywords = [
      "Skills", "Experience", "Education",
    ];
  
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    const matches = [...text.matchAll(regex)];
  
    const extractedData: Record<string, string> = {};
    for (let i = 0; i < matches.length; i++) {
      const keyword = matches[i][0];
      const startIndex = matches[i].index! + keyword.length;
  
      // Find next keyword position
      const endIndex = i + 1 < matches.length ? matches[i + 1].index! : text.length;
      extractedData[keyword] = text.substring(startIndex, endIndex).trim();
    }
  
    return extractedData;
  };
  
  // Handle POST request (file upload and parsing)
  export async function POST(req: Request) {
    try {
      const formData = await req.formData();
      const file = formData.get("resume") as File;
  
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
  
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
  
      // Extract text from PDF
      const text = await extractTextFromPDF(buffer);
      const extractedSections = extractTextSections(text);
  
      return NextResponse.json({ extractedSections }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }
  

// Handle GET request
export async function GET() {
  return NextResponse.json({
    message: "Resume Parser API",
    usage: "Send a POST request with a PDF file to extract text and keywords.",
  });
}
