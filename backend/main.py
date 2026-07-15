"""
Offline RAG Study Assistant — CrewAI Backend
FastAPI server exposing multi-agent AI study tools powered by CrewAI.

Agents:
  • Quiz Generation Crew  — Content Analyst + Quiz Master
  • Study Plan Crew       — Topic Extractor + Study Coach
  • Analysis Crew         — Researcher + Academic Summarizer
"""

import json
import os
import re
from typing import List, Optional

import uvicorn
from crewai import Agent, Crew, LLM, Process, Task
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="StudyMind AI — CrewAI Backend",
    description="Multi-agent AI study tools for the Offline RAG Study Assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── LLM factory ───────────────────────────────────────────────────────────────
def get_llm() -> LLM:
    """Return the best available LLM based on environment config."""
    use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"

    if use_ollama:
        model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        return LLM(model=f"ollama/{model}", base_url=base_url)

    api_key = os.getenv("OPENAI_API_KEY", "")
    if api_key and not api_key.startswith("sk-your"):
        return LLM(model="gpt-4o-mini", api_key=api_key)

    # Last resort: try Ollama with default settings
    return LLM(model="ollama/llama3.2:3b", base_url="http://localhost:11434")


def extract_json_object(text: str) -> dict:
    """Extract the first JSON object from a string."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No JSON object found in response")


def extract_json_array(text: str) -> list:
    """Extract the first JSON array from a string."""
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No JSON array found in response")


# ── Request / Response models ─────────────────────────────────────────────────
class QuizRequest(BaseModel):
    context: str
    num_questions: int = 5
    difficulty: str = "medium"  # easy | medium | hard
    topic: Optional[str] = None


class StudyPlanRequest(BaseModel):
    context: str
    study_hours_per_day: int = 2
    days_available: int = 7
    focus_areas: Optional[List[str]] = None


class AnalysisRequest(BaseModel):
    context: str


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    llm_type = "ollama" if os.getenv("USE_OLLAMA", "false").lower() == "true" else "openai"
    return {"status": "ok", "llm": llm_type, "message": "CrewAI backend is running"}


# ── Quiz Generation ────────────────────────────────────────────────────────────
@app.post("/api/quiz/generate")
async def generate_quiz(req: QuizRequest):
    try:
        llm = get_llm()
        ctx = req.context[:4000]  # guard against token overflow

        analyst = Agent(
            role="Educational Content Analyst",
            goal="Identify the most important concepts, facts, and learning objectives in study material",
            backstory=(
                "You are a seasoned educational content analyst with 15 years of experience designing "
                "assessments for top universities. You excel at pinpointing exactly what students need "
                "to understand to master a subject."
            ),
            verbose=False,
            llm=llm,
        )

        quiz_master = Agent(
            role="Quiz Master",
            goal="Create precise, challenging, and pedagogically sound multiple-choice questions",
            backstory=(
                "You are an expert quiz designer who has created thousands of questions for standardised "
                "exams. Your questions test deep understanding, not just memorisation, and always include "
                "clear explanations for every answer."
            ),
            verbose=False,
            llm=llm,
        )

        analyse_task = Task(
            description=(
                f"Analyse the educational content below and extract the {req.num_questions} most "
                f"important concepts a student MUST understand.\n"
                f"{'Focus on: ' + req.topic if req.topic else ''}\n\n"
                f"Content:\n{ctx}\n\n"
                "Produce a numbered list of key concepts with one-sentence explanations."
            ),
            expected_output="Numbered list of key concepts with brief explanations.",
            agent=analyst,
        )

        quiz_task = Task(
            description=(
                f"Using the identified concepts, create exactly {req.num_questions} multiple-choice "
                f"questions at {req.difficulty} difficulty.\n\n"
                "Output ONLY a valid JSON array — no markdown, no extra text:\n"
                "[\n"
                "  {\n"
                '    "question": "...",\n'
                '    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n'
                '    "correct_answer": "A",\n'
                '    "explanation": "..."\n'
                "  }\n"
                "]"
            ),
            expected_output="A valid JSON array of quiz question objects.",
            agent=quiz_master,
        )

        crew = Crew(
            agents=[analyst, quiz_master],
            tasks=[analyse_task, quiz_task],
            process=Process.sequential,
            verbose=False,
        )

        result = crew.kickoff()
        questions = extract_json_array(str(result))
        return {"success": True, "questions": questions}

    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse quiz JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Study Plan Generation ──────────────────────────────────────────────────────
@app.post("/api/study-plan/generate")
async def generate_study_plan(req: StudyPlanRequest):
    try:
        llm = get_llm()
        ctx = req.context[:4000]

        topic_extractor = Agent(
            role="Curriculum Designer",
            goal="Extract and organise study topics from educational material into a clear learning hierarchy",
            backstory=(
                "You are a curriculum design expert who has built courses for leading e-learning platforms. "
                "You break complex material into digestible modules that optimise learning retention."
            ),
            verbose=False,
            llm=llm,
        )

        study_coach = Agent(
            role="Study Coach",
            goal="Build personalised, achievable study schedules that maximise retention",
            backstory=(
                "You are a renowned study coach who has helped thousands of students ace competitive exams. "
                "You create realistic, motivating plans that balance depth of study with mental wellbeing."
            ),
            verbose=False,
            llm=llm,
        )

        extract_task = Task(
            description=(
                f"From the content below, extract all major topics and subtopics. "
                f"Estimate the relative complexity (low/medium/high) of each.\n\n"
                f"Content:\n{ctx}"
            ),
            expected_output="Structured list of topics with complexity ratings.",
            agent=topic_extractor,
        )

        focus = ", ".join(req.focus_areas) if req.focus_areas else "all topics equally"
        plan_task = Task(
            description=(
                f"Create a {req.days_available}-day study plan with {req.study_hours_per_day} "
                f"study hours per day, focusing on: {focus}.\n\n"
                "Output ONLY a valid JSON object — no markdown fences:\n"
                "{\n"
                '  "overview": "...",\n'
                '  "total_days": ' + str(req.days_available) + ",\n"
                '  "hours_per_day": ' + str(req.study_hours_per_day) + ",\n"
                '  "days": [\n'
                "    {\n"
                '      "day": 1,\n'
                '      "title": "...",\n'
                '      "topics": ["..."],\n'
                '      "goals": ["..."],\n'
                '      "activities": ["..."],\n'
                '      "review": "..."\n'
                "    }\n"
                "  ],\n"
                '  "tips": ["..."]\n'
                "}"
            ),
            expected_output="A valid JSON study plan object.",
            agent=study_coach,
        )

        crew = Crew(
            agents=[topic_extractor, study_coach],
            tasks=[extract_task, plan_task],
            process=Process.sequential,
            verbose=False,
        )

        result = crew.kickoff()
        plan = extract_json_object(str(result))
        return {"success": True, "plan": plan}

    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse plan JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Document Analysis ──────────────────────────────────────────────────────────
@app.post("/api/analyze")
async def analyze_document(req: AnalysisRequest):
    try:
        llm = get_llm()
        ctx = req.context[:4000]

        researcher = Agent(
            role="Educational Researcher",
            goal="Conduct an in-depth analysis of educational content to surface all key insights",
            backstory=(
                "You are a PhD-level educational researcher who specialises in distilling complex academic "
                "material. You have a talent for spotting relationships between concepts that students "
                "typically miss."
            ),
            verbose=False,
            llm=llm,
        )

        summarizer = Agent(
            role="Academic Summarizer",
            goal="Transform deep research analysis into clear, actionable study insights",
            backstory=(
                "You are an expert academic writer who produces crisp, exam-focused summaries. "
                "Your outputs are used by thousands of students to prepare for high-stakes exams."
            ),
            verbose=False,
            llm=llm,
        )

        research_task = Task(
            description=(
                "Conduct a thorough analysis of the content below. Identify:\n"
                "1. Main themes\n2. Key facts & data\n3. Concept relationships\n"
                "4. Likely exam topics\n5. Areas needing special attention\n\n"
                f"Content:\n{ctx}"
            ),
            expected_output="Detailed analysis covering themes, concepts, and exam focus areas.",
            agent=researcher,
        )

        summarize_task = Task(
            description=(
                "Based on the research, produce a JSON analysis object. Output ONLY valid JSON:\n"
                "{\n"
                '  "executive_summary": "2-3 sentence overview",\n'
                '  "key_concepts": [\n'
                '    {"concept": "...", "explanation": "...", "importance": "high|medium|low"}\n'
                "  ],\n"
                '  "key_facts": ["..."],\n'
                '  "exam_topics": ["..."],\n'
                '  "connections": ["..."],\n'
                '  "study_recommendations": ["..."],\n'
                '  "difficulty_areas": ["..."]\n'
                "}"
            ),
            expected_output="A valid JSON analysis object.",
            agent=summarizer,
        )

        crew = Crew(
            agents=[researcher, summarizer],
            tasks=[research_task, summarize_task],
            process=Process.sequential,
            verbose=False,
        )

        result = crew.kickoff()
        analysis = extract_json_object(str(result))
        return {"success": True, "analysis": analysis}

    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse analysis JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
