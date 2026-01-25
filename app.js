const totalTurns = 5;

const presets = {
  frontend:
    "Frontend Engineer. Skills: React, TypeScript, accessibility, performance, design collaboration.",
  backend:
    "Backend Engineer. Skills: Node.js, APIs, databases, scalability, reliability, security.",
  pm: "Product Manager. Skills: discovery, metrics, stakeholder alignment, roadmap planning.",
};

const roleQuestions = {
  hr: [
    "Tell me about yourself and what you are looking for in your next role.",
    "What motivates you at work and how do you stay engaged?",
    "Describe a time you handled feedback from a manager.",
    "How do you prioritize when multiple deadlines collide?",
    "What company values matter most to you?",
  ],
  tech: [
    "Walk me through a recent technical project and your contributions.",
    "How do you balance speed and quality in engineering work?",
    "Describe a challenging bug and how you resolved it.",
    "How do you design for scalability and reliability?",
    "What does good testing strategy look like to you?",
  ],
  behavioral: [
    "Describe a time you led through ambiguity.",
    "Tell me about a conflict on your team and how you handled it.",
    "Share a time you received critical feedback and what you did next.",
    "Describe a moment you influenced without authority.",
    "How do you maintain resilience during setbacks?",
  ],
};

const adaptivePrompts = [
  {
    trigger: ["lead", "mentor", "coach"],
    question: "You mentioned leadership. How do you coach or develop others?",
  },
  {
    trigger: ["performance", "optimize", "latency"],
    question: "How do you measure and improve performance in your work?",
  },
  {
    trigger: ["collaboration", "team", "stakeholder"],
    question: "How do you keep stakeholders aligned throughout a project?",
  },
  {
    trigger: ["user", "customer", "empathy"],
    question: "How do you incorporate user feedback into your decisions?",
  },
];

const elements = {
  roleSelect: document.getElementById("roleSelect"),
  presetSelect: document.getElementById("presetSelect"),
  contextInput: document.getElementById("contextInput"),
  audioToggle: document.getElementById("audioToggle"),
  startBtn: document.getElementById("startBtn"),
  questionText: document.getElementById("questionText"),
  answerInput: document.getElementById("answerInput"),
  submitBtn: document.getElementById("submitBtn"),
  micBtn: document.getElementById("micBtn"),
  scoreText: document.getElementById("scoreText"),
  feedbackText: document.getElementById("feedbackText"),
  memoryList: document.getElementById("memoryList"),
  reportContent: document.getElementById("reportContent"),
  turnIndicator: document.getElementById("turnIndicator"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
};

const state = {
  turn: 0,
  role: "hr",
  context: "",
  answers: [],
  scores: [],
  lastQuestion: "",
  usedQuestions: new Set(),
  audio: false,
};

const speechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;
const recognizer = speechRecognition ? new speechRecognition() : null;

if (recognizer) {
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
}

elements.presetSelect.addEventListener("change", (event) => {
  const selected = event.target.value;
  if (selected && presets[selected]) {
    elements.contextInput.value = presets[selected];
  }
});

elements.startBtn.addEventListener("click", () => {
  state.role = elements.roleSelect.value;
  state.context = elements.contextInput.value.trim();
  state.turn = 0;
  state.answers = [];
  state.scores = [];
  state.usedQuestions = new Set();
  state.audio = elements.audioToggle.checked;
  elements.answerInput.value = "";
  elements.memoryList.innerHTML = "";
  elements.reportContent.innerHTML =
    "<p>No report yet. Finish all five questions to see your summary.</p>";
  elements.submitBtn.disabled = false;
  elements.answerInput.disabled = false;
  elements.micBtn.disabled = !recognizer;
  setStatus(true, "Interview in progress");
  nextQuestion();
});

elements.submitBtn.addEventListener("click", () => {
  const answer = elements.answerInput.value.trim();
  if (!answer) {
    elements.answerInput.focus();
    return;
  }
  recordAnswer(answer);
  elements.answerInput.value = "";
  if (state.turn >= totalTurns) {
    finishInterview();
  } else {
    nextQuestion();
  }
});

elements.micBtn.addEventListener("click", () => {
  if (!recognizer) {
    return;
  }
  recognizer.start();
  elements.micBtn.textContent = "Listening...";
});

if (recognizer) {
  recognizer.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript;
    elements.answerInput.value = transcript;
  });

  recognizer.addEventListener("end", () => {
    elements.micBtn.textContent = "🎙️ Use Mic";
  });
}

function setStatus(active, text) {
  elements.statusDot.classList.toggle("status__dot--active", active);
  elements.statusText.textContent = text;
}

function nextQuestion() {
  state.turn += 1;
  const question = generateQuestion();
  state.lastQuestion = question;
  elements.questionText.textContent = question;
  elements.turnIndicator.textContent = `Turn ${state.turn} / ${totalTurns}`;
  if (state.audio) {
    speakQuestion(question);
  }
}

function generateQuestion() {
  const baseQuestions = roleQuestions[state.role] || [];
  const contextKeywords = extractKeywords(state.context);

  if (state.answers.length > 0) {
    const lastAnswer = state.answers[state.answers.length - 1].answer.toLowerCase();
    const adaptive = adaptivePrompts.find((prompt) =>
      prompt.trigger.some((word) => lastAnswer.includes(word))
    );
    if (adaptive && !state.usedQuestions.has(adaptive.question)) {
      state.usedQuestions.add(adaptive.question);
      return adaptive.question;
    }
  }

  if (contextKeywords.length > 0) {
    const skill = contextKeywords[state.turn % contextKeywords.length];
    const skillQuestion = `How have you applied ${skill} in your recent work?`;
    if (!state.usedQuestions.has(skillQuestion)) {
      state.usedQuestions.add(skillQuestion);
      return skillQuestion;
    }
  }

  const fallback = baseQuestions.find((q) => !state.usedQuestions.has(q));
  if (fallback) {
    state.usedQuestions.add(fallback);
    return fallback;
  }

  const random = baseQuestions[Math.floor(Math.random() * baseQuestions.length)];
  return random || "Tell me about a project you are proud of.";
}

function recordAnswer(answer) {
  const evaluation = evaluateAnswer(answer, state.lastQuestion, state.context);
  state.answers.push({
    question: state.lastQuestion,
    answer,
    score: evaluation.score,
    notes: evaluation.notes,
  });
  state.scores.push(evaluation.score);

  elements.scoreText.textContent = `Score: ${evaluation.score} / 5`;
  elements.feedbackText.textContent = evaluation.notes;

  const memoryItem = document.createElement("li");
  memoryItem.textContent = `Q${state.turn}: ${answer.slice(0, 80)}${
    answer.length > 80 ? "..." : ""
  }`;
  elements.memoryList.prepend(memoryItem);
}

function evaluateAnswer(answer, question, context) {
  const words = answer.split(/\s+/).filter(Boolean);
  const lengthScore = Math.min(3, Math.floor(words.length / 20) + 1);
  const keywords = extractKeywords(`${question} ${context}`);
  const relevanceHits = keywords.filter((keyword) =>
    answer.toLowerCase().includes(keyword)
  ).length;
  const relevanceScore = relevanceHits > 2 ? 2 : relevanceHits;
  const score = Math.min(5, lengthScore + relevanceScore);

  let notes = "Focus on a clear structure with Situation, Task, Action, Result.";
  if (score >= 4) {
    notes = "Strong answer. Add metrics or impact to make it even sharper.";
  } else if (score === 3) {
    notes = "Good start. Add more detail on your specific actions and results.";
  } else if (score <= 2) {
    notes = "Try to expand with concrete examples, outcomes, and lessons learned.";
  }

  return { score, notes };
}

function finishInterview() {
  elements.submitBtn.disabled = true;
  elements.answerInput.disabled = true;
  elements.micBtn.disabled = true;
  setStatus(false, "Interview complete");
  renderReport();
}

function renderReport() {
  const avgScore =
    state.scores.reduce((total, score) => total + score, 0) / state.scores.length;
  const strengths = state.scores.filter((score) => score >= 4).length;
  const improvements = state.scores.filter((score) => score <= 2).length;

  const summary = `
    <div class="report__summary">
      <div class="report__card">
        <h3>Overall Score</h3>
        <p>${avgScore.toFixed(1)} / 5</p>
      </div>
      <div class="report__card">
        <h3>Strengths</h3>
        <p>${strengths} strong responses</p>
      </div>
      <div class="report__card">
        <h3>Needs Improvement</h3>
        <p>${improvements} responses to deepen</p>
      </div>
      <div class="report__card">
        <h3>Focus Areas</h3>
        <p>${extractKeywords(state.context).slice(0, 3).join(", ") || "General"}</p>
      </div>
    </div>
  `;

  const details = state.answers
    .map(
      (entry, index) => `
        <div class="report__card">
          <h3>Q${index + 1}: ${entry.question}</h3>
          <p><strong>Answer:</strong> ${entry.answer}</p>
          <p><strong>Score:</strong> ${entry.score} / 5</p>
          <p><strong>Feedback:</strong> ${entry.notes}</p>
        </div>
      `
    )
    .join("");

  elements.reportContent.innerHTML = summary + details;
}

function extractKeywords(text) {
  if (!text) {
    return [];
  }
  return text
    .toLowerCase()
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2)
    .slice(0, 6);
}

function speakQuestion(text) {
  if (!window.speechSynthesis) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
