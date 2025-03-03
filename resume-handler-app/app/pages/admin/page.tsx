"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, FileText, Search, Upload, Loader2, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Candidate = {
  id: string
  name: string
  email: string
  linkedin: string
  skills: string[]
  text: string
  relevanceScore: number
}

// Add this type for the summary
type ResumeSummary = {
  loading: boolean
  content: string | null
  error: string | null
}

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedResume, setSelectedResume] = useState<File | null>(null)
  const [resumeSummary, setResumeSummary] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [geminiSummary, setGeminiSummary] = useState<ResumeSummary>({
    loading: false,
    content: null,
    error: null,
  })

  // Initial load - can fetch some default candidates or leave empty
  useEffect(() => {
    // Optional: Load initial candidates
    // handleSearch();
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery || "all candidates", // If empty, search for all candidates
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search candidates")
      }

      const data = await response.json()
      setCandidates(data.results)

      if (data.results.length === 0) {
        setError("No candidates found matching your search criteria")
      }
    } catch (err) {
      setError((err as Error).message)
      setCandidates([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setSelectedResume(file)
        setIsLoading(true)

        try {
          // Create a FormData object to send the file
          const formData = new FormData()
          formData.append("resume", file)

          // Send the file to the parseResume API
          const response = await fetch("/api/parseResume", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to parse resume")
          }

          const data = await response.json()
          setResumeSummary(JSON.stringify(data, null, 2))
        } catch (err) {
          setError((err as Error).message)
          setResumeSummary("Failed to analyze resume")
        } finally {
          setIsLoading(false)
        }
      }
    }
  }

  const viewCandidateDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setResumeSummary(candidate.text)
  }

  const generateGeminiSummary = async () => {
    if (!resumeSummary && !selectedCandidate?.text) {
      setGeminiSummary((prev) => ({
        ...prev,
        error: "No resume content available to summarize",
      }))
      return
    }

    setGeminiSummary({
      loading: true,
      content: null,
      error: null,
    })

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedCandidate?.text || resumeSummary,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      setGeminiSummary({
        loading: false,
        content: data.summary,
        error: null,
      })
    } catch (error) {
      setGeminiSummary({
        loading: false,
        content: null,
        error: (error as Error).message,
      })
    }
  }

  // Update the analyze tab content
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Search and manage candidate applications</p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Resumes</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Candidate Resumes</CardTitle>
                <CardDescription>
                  Find the most relevant candidates based on skills, experience, or keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search by skills, job title, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-md border">
                    <div className="flex items-center justify-between p-4 bg-muted/50">
                      <div className="text-sm font-medium">{candidates.length} candidates found</div>
                      <div className="text-sm text-muted-foreground">Sorted by relevance</div>
                    </div>

                    <ScrollArea className="h-[400px]">
                      {candidates.length > 0 ? (
                        <div>
                          {candidates.map((candidate, index) => (
                            <div key={candidate.id}>
                              <div className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{candidate.name}</h3>
                                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                                    {candidate.linkedin && (
                                      <a
                                        href={
                                          candidate.linkedin.startsWith("http")
                                            ? candidate.linkedin
                                            : `https://${candidate.linkedin}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        LinkedIn Profile
                                      </a>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {candidate.skills.map((skill, i) => (
                                        <Badge key={i} variant="secondary">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <Badge
                                      className="mb-2"
                                      variant={
                                        candidate.relevanceScore > 80
                                          ? "default"
                                          : candidate.relevanceScore > 60
                                            ? "secondary"
                                            : "outline"
                                      }
                                    >
                                      {candidate.relevanceScore}% match
                                    </Badge>
                                    <Button size="sm" variant="outline" onClick={() => viewCandidateDetails(candidate)}>
                                      <FileText className="h-4 w-4 mr-1" />
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {index < candidates.length - 1 && <Separator />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <h3 className="font-medium mb-1">No candidates found</h3>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search terms or click Search to see all candidates
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyze" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Analysis</CardTitle>
                <CardDescription>
                  {selectedCandidate
                    ? `Viewing details for ${selectedCandidate.name}`
                    : "Upload a resume to analyze its content or view candidate details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedCandidate && (
                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center space-x-2">
                      <Input id="resume-upload" type="file" accept=".pdf" onChange={handleResumeUpload} />
                      <Button type="button" disabled={!selectedResume || isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Analyze
                      </Button>
                    </div>
                    {selectedResume && (
                      <p className="text-sm text-muted-foreground">Selected file: {selectedResume.name}</p>
                    )}
                  </div>
                )}

                {selectedCandidate && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">{selectedCandidate.name}</h3>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCandidate(null)}>
                        Back to Upload
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm">{selectedCandidate.email}</p>
                      </div>
                      {selectedCandidate.linkedin && (
                        <div>
                          <p className="text-sm font-medium">LinkedIn</p>
                          <a
                            href={
                              selectedCandidate.linkedin.startsWith("http")
                                ? selectedCandidate.linkedin
                                : `https://${selectedCandidate.linkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {selectedCandidate.linkedin}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Match Score</p>
                      <Badge
                        variant={
                          selectedCandidate.relevanceScore > 80
                            ? "default"
                            : selectedCandidate.relevanceScore > 60
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {selectedCandidate.relevanceScore}% match
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{selectedCandidate ? "Resume Content" : "Resume Summary"}</h3>
                    {(resumeSummary || selectedCandidate) && (
                      <Button onClick={generateGeminiSummary} disabled={geminiSummary.loading} variant="outline">
                        {geminiSummary.loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate AI Summary
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={resumeSummary}
                    readOnly
                    placeholder={
                      selectedCandidate ? "Loading resume content..." : "Upload a resume to see its summary..."
                    }
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                {/* Gemini Summary Section */}
                {(geminiSummary.content || geminiSummary.error || geminiSummary.loading) && (
                  <div className="space-y-2 border-t pt-6">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI-Generated Summary
                    </h3>

                    {geminiSummary.error ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{geminiSummary.error}</AlertDescription>
                      </Alert>
                    ) : geminiSummary.loading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="prose prose-sm max-w-none">
                            {geminiSummary.content?.split("\n").map((line, i) => (
                              <p key={i} className="mb-2">
                                {line}
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

