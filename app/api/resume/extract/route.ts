import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";

const KNOWN_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node",
  "node.js",
  "python",
  "sql",
  "power bi",
  "tableau",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "graphql",
  "rest",
  "html",
  "css",
  "java",
  "go",
  "c++",
  "c#",
  "product management",
  "analytics",
  "data analysis",
  "machine learning",
  "leadership",
  "communication",
];

const ROLE_HINTS: Record<string, string> = {
  "frontend engineer": "Frontend Engineer",
  "backend engineer": "Backend Engineer",
  "full stack": "Full-stack Engineer",
  "product manager": "Product Manager",
  "data analyst": "Data Analyst",
  "data scientist": "Data Scientist",
};

const extractSkills = (rawText: string) => {
  const normalized = rawText.toLowerCase();
  const found = new Set<string>();
  for (const skill of KNOWN_SKILLS) {
    const token = skill.toLowerCase();
    const pattern = new RegExp(`\\b${token.replace(/\./g, "\\.")}\\b`, "i");
    if (pattern.test(normalized)) {
      found.add(skill.replace(/\b\w/g, (m) => m.toUpperCase()));
    }
  }
  return Array.from(found).slice(0, 12);
};

const extractRole = (rawText: string) => {
  const normalized = rawText.toLowerCase();
  for (const [hint, role] of Object.entries(ROLE_HINTS)) {
    if (normalized.includes(hint)) {
      return role;
    }
  }
  return "";
};

const extractProjects = (rawText: string) => {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const projects = [];
  for (const line of lines) {
    if (/project/i.test(line)) {
      const name = line.replace(/project[:\s-]*/i, "").slice(0, 80);
      if (!name) continue;
      projects.push({
        name,
        stack: extractSkills(line),
        highlights: [line],
      });
    }
    if (projects.length >= 5) break;
  }
  return projects;
};

const extractKeywords = (rawText: string, skills: string[]) => {
  const tokens = rawText
    .split(/\W+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 3);
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token);
  const keywords = [...skills.map((s) => s.toLowerCase()), ...sorted]
    .filter((value, index, self) => self.indexOf(value) === index)
    .slice(0, 12);
  return keywords.map((token) => token.replace(/\b\w/g, (m) => m.toUpperCase()));
};

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let rawText = "";
  try {
    const parsed = await pdf(buf);
    rawText = parsed.text || "";
  } catch {
    return NextResponse.json(
      { error: "PDF parse failed. Paste resume text instead." },
      { status: 400 }
    );
  }

  const skills = extractSkills(rawText);
  const role = extractRole(rawText);
  const projects = extractProjects(rawText);
  const keywords = extractKeywords(rawText, skills);

  return NextResponse.json({
    role,
    skills,
    projects,
    keywords,
    rawText,
  });
}
