# 🎤 Composable AI Mock Interviewer

## 🚀 Live Demo  
👉 https://composable-ai-mock-interviewer-pi.vercel.app/

An AI-powered mock interview platform that simulates **real interviews** (HR / Tech / Behavioral) with **adaptive questioning**, **live evaluation**, **audio mode**, and a **final performance report** — built for rapid MVP demos and hackathons.

This project enables a candidate to:

1. Choose interview type & role  
2. Provide skills or resume context  
3. Answer adaptive questions  
4. Get instant scores + coaching tips  
5. Receive a final structured interview report  

Designed with a **Composable Blocks** mindset where each stage (Question, Memory, Evaluation, Feedback, Report) is modular and reusable.

---

## 🚀 Features

### 🧩 Composable Pipeline
- Role Block  
- Question Generator  
- Memory Block  
- Evaluation Block  
- Feedback Block  
- Final Report Block  

Each block is independent and reusable — perfect for rapid prototyping and AI workflows.

### 🧠 Adaptive Interview Logic
Each next question adapts based on:
- Previous answer quality  
- Weak / strong skills  
- Role & interview type  

This makes every interview feel *real* and personalized.

### 📊 Live Evaluation
- Scores for: **Clarity, Relevance, Depth, Confidence**  
- Overall score per answer  
- Strengths & improvement areas in real time  

### 🎧 Audio Mode
- 🔊 Speak questions (Text-to-Speech)  
- 🎙️ Answer using mic (Speech-to-Text)  

### 📄 Final Interview Report
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

## 🎥 Demo Video  
👉 https://youtu.be/QN_AsVww9dI  

This video walks through the entire product from setup to the final report — ready for hackathon submission.

---

## 📁 Project Structure

```

ai-mock-interviewer/
├── app/
│   ├── page.tsx              # Setup screen
│   ├── interview/
│   │   └── page.tsx          # Interview UI
│   └── report/
│       └── page.tsx          # Final report
│
├── api/
│   └── session/
│       ├── create/
│       │   └── route.ts
│       ├── next-question/
│       │   └── route.ts
│       ├── submit-answer/
│       │   └── route.ts
│       └── report/
│           └── route.ts
│
├── lib/
│   ├── store.ts
│   ├── llm.ts
│   ├── prompts.ts
│   ├── schema.ts
│   └── scoring.ts
│
├── components/
│   ├── BlocksPanel.tsx
│   ├── ChatPanel.tsx
│   ├── OutputPanel.tsx
│   └── AudioControls.tsx
│
├── README.md
├── next.config.js
└── package.json

```

---

## ⚙️ Setup

1. Create project
```bash
npm create next-app@latest ai-mock-interviewer --ts
cd ai-mock-interviewer
cd ai-mock-interviewer
```
Add environment key

Create .env.local:
```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```
Run
```
npm run dev
Open: http://localhost:3000
```

🧪 Demo Flow (For Judges)
Select Tech Interview → Data Analyst

Enter skills: SQL, Power BI, Python

Start interview

Answer Q1 via mic

Show:

Live scores

Tips

Memory update

Next question adapts based on weakness

Complete 5 turns

Show Final Report

---
🎯 Why This Stands Out
Clear end-to-end user journey

Shows real AI reasoning + memory

Demonstrates composability

Works in 24-hour hackathon scope

Easy to extend into a real product

---
🗺 Roadmap

🌗 Dark / Light Mode Toggle

📄 Resume Upload & Resume-Based Questions

📊 User Dashboard & Progress Tracking

📥 Downloadable PDF Report

---
👨‍💻 Author

Built by Jitendra Gaherwar

B.Tech IT | Data & AI Developer

Focused on building practical AI tools for learning and productivity.


