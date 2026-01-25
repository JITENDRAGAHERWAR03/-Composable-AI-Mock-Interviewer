# 🎤 Composable AI Mock Interviewer

An AI-powered mock interview platform that simulates **real interviews** (HR / Tech / Behavioral) with **adaptive questioning**, **live evaluation**, **audio mode**, and a **final performance report** — built for rapid MVP demos and hackathons.

This project lets a candidate:
1. Choose interview type & role  
2. Provide skills / resume context  
3. Answer 5 adaptive questions  
4. Get instant scores + coaching tips  
5. Receive a final structured interview report  

Designed with a **Composable Blocks** mindset where each stage (Question, Memory, Evaluation, Feedback, Report) is modular and reusable.

---

## 🚀 Features

- 🧩 **Composable Pipeline**
  - Role Block  
  - Question Generator  
  - Memory Block  
  - Evaluation Block  
  - Feedback Block  
  - Final Report Block  

- 🧠 **Adaptive Interview Logic**
  - Each next question adapts based on:
    - Previous answer quality
    - Weak/strong skills
    - Role & interview type

- 📊 **Live Evaluation**
  - Scores for: Clarity, Relevance, Depth, Confidence
  - Overall score per answer
  - Strengths & improvement areas

- 🎧 **Audio Mode**
  - 🔊 Speak questions (Text-to-Speech)
  - 🎙️ Answer using mic (Speech-to-Text)

- 📄 **Final Interview Report**
  - Overall score
  - Skill-wise breakdown
  - Top strengths & gaps
  - 7-day improvement plan

---

## 🛠 Tech Stack

- **Next.js (App Router)** – Frontend + Backend in one app  
- **LLM** – Gemini / OpenAI (pluggable adapter)  
- **In-memory Store** – Fast MVP sessions  
- **Web Speech API** – Audio input/output  

---

## 📁 Project Structure

ai-mock-interviewer/
app/
page.tsx # Setup screen
interview/page.tsx # Interview UI
report/page.tsx # Final report
api/
session/create/route.ts
session/next-question/route.ts
session/submit-answer/route.ts
session/report/route.ts
lib/
store.ts
llm.ts
prompts.ts
schema.ts
scoring.ts
components/
BlocksPanel.tsx
ChatPanel.tsx
OutputPanel.tsx
AudioControls.tsx


---

## ⚙️ Setup

1. Create project
```bash
npm create next-app@latest ai-mock-interviewer --ts
cd ai-mock-interviewer

