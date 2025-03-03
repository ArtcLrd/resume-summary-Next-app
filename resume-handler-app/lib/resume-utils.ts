/**
 * Extracts skills from resume text
 * This is a simple implementation - in a production app,
 * you might want to use NLP or a more sophisticated approach
 */
export function extractSkills(text: string): string[] {
    if (!text) return []
  
    try {
      // Look for skills section
      const skillsRegex = /skills:(.+?)(?:\n|$)/i
      const skillsMatch = text.match(skillsRegex)
  
      if (skillsMatch && skillsMatch[1]) {
        return skillsMatch[1].split(",").map((skill) => skill.trim())
      }
  
      // If no skills section found, try to extract common tech skills
      const commonSkills = [
        "javascript",
        "typescript",
        "react",
        "node",
        "python",
        "java",
        "c#",
        "c++",
        "html",
        "css",
        "sql",
        "nosql",
        "mongodb",
        "postgresql",
        "mysql",
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "git",
        "github",
        "machine learning",
        "data science",
        "ai",
        "product management",
        "agile",
        "scrum",
        "kanban",
        "jira",
        "figma",
        "adobe",
        "photoshop",
        "illustrator",
        "ui",
        "ux",
        "design",
        "marketing",
        "seo",
        "content",
      ]
  
      const foundSkills = commonSkills.filter((skill) => new RegExp(`\\b${skill}\\b`, "i").test(text))
  
      return foundSkills.length > 0 ? foundSkills : ["Not specified"]
    } catch (e) {
      console.error("Error extracting skills:", e)
      return ["Not specified"]
    }
  }
  
  