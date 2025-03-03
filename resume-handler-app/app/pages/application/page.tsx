"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, FileText, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ApplyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [useTextResume, setUseTextResume] = useState(false)
  const [textResumeContent, setTextResumeContent] = useState("")
  const [parsedResume, setParsedResume] = useState<Record<string, any> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    linkedin: "",
    skills: "",
    experience: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      let resumeText = ""

      if (useTextResume) {
        // Use the text resume directly
        resumeText = textResumeContent
      } else {
        // Parse the PDF resume
        if (!resumeFile) {
          setErrorMessage("Please upload a valid PDF file.")
          setIsSubmitting(false)
          return
        }

        const formdata = new FormData()
        formdata.append("resume", resumeFile)

        const res = await fetch("/api/parseResume/", {
          method: "POST",
          body: formdata,
        })

        if (!res.ok) {
          throw new Error("Failed to parse resume")
        }

        const data = await res.json()
        setParsedResume(data)
        resumeText = JSON.stringify(data)
      }

      // Combine all text for better embedding
      const combinedText = `
        Name: ${formData.name}
        Email: ${formData.email}
        LinkedIn: ${formData.linkedin}
        Skills: ${formData.skills}
        Experience: ${formData.experience}
        Resume: ${resumeText}
      `

      // Store the resume data
      await storeResume(combinedText)

      // Navigate to success page
      router.push("/pages/application/success")
    } catch (error) {
      console.error("Application submission error:", error)
      setErrorMessage(`Failed to submit application: ${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const storeResume = async (resumeText: string) => {
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `${formData.email}-${Date.now()}`, // Add timestamp to make ID unique
          text: resumeText,
          name: formData.name,
          email: formData.email,
          linkedin: formData.linkedin,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to store resume")
      }

      return result
    } catch (error) {
      console.error("Store API Client error:", error)
      throw error
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setResumeFile(file)
        setErrorMessage(null)
      } else {
        setErrorMessage("Please upload a PDF file")
        setResumeFile(null)
      }
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Candidate Application</CardTitle>
          <CardDescription>Please fill out the form below to submit your application</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>

              <div className="grid grid-cols-1 gap-4">
                {["name", "email", "linkedin"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                    <Input
                      id={field}
                      type={field === "email" ? "email" : "text"}
                      placeholder={`Enter ${field}`}
                      value={formData[field as keyof typeof formData]}
                      onChange={handleInputChange}
                      required={field !== "linkedin"}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Resume</h3>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseTextResume(false)}
                  className={!useTextResume ? "bg-primary text-primary-foreground" : ""}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseTextResume(true)}
                  className={useTextResume ? "bg-primary text-primary-foreground" : ""}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Text Resume
                </Button>
              </div>

              {!useTextResume ? (
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="resume">Upload Resume (PDF)</Label>
                  <Input id="resume" type="file" accept=".pdf" onChange={handleFileChange} required={!useTextResume} />
                  {resumeFile && <p className="text-sm text-muted-foreground">Selected file: {resumeFile.name}</p>}
                </div>
              ) : (
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="text-resume">Resume Text</Label>
                  <Textarea
                    id="text-resume"
                    placeholder="Paste your resume text here..."
                    className="min-h-[200px]"
                    value={textResumeContent}
                    onChange={(e) => setTextResumeContent(e.target.value)}
                    required={useTextResume}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills & Experience</h3>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input
                  id="skills"
                  placeholder="JavaScript, React, Node.js, TypeScript"
                  value={formData.skills}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="experience">Professional Experience</Label>
                <Textarea
                  id="experience"
                  placeholder="Describe your relevant work experience..."
                  className="min-h-[150px]"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                By submitting this application, you confirm that all information provided is accurate and complete.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                  <span className="animate-spin">⟳</span>
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

