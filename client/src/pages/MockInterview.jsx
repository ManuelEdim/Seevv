import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Card, Spinner } from "@/components/ui";
import useJobTargets from "@/hooks/useJobTargets";
import api from "@/lib/api";

// ─── Score ring ────────────────────────────────────────────
const ScoreRing = ({ score, size = 80 }) => {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#0f6e56" : score >= 50 ? "#ba7517" : "#993c1d";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="7"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dy="0.35em"
        fontSize={size * 0.2}
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
};

// ─── Sub-score bar ─────────────────────────────────────────
const SubScoreBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-700">{value}/100</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-brand-600 rounded-full transition-all duration-700"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// ─── Single question screen ────────────────────────────────
const QuestionScreen = ({ question, index, total, onSubmit, isScoring }) => {
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setAnswer(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const hasSpeechAPI = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {index + 1} / {total}
        </span>
      </div>

      <Card padding="md">
        <div className="space-y-4">
          {/* Question */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-2">
              Question {index + 1}
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-relaxed">
              {question.question}
            </p>
          </div>

          {/* CV reference hint */}
          {question.cv_reference && (
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-brand-400 shrink-0 mt-0.5">📎</span>
              <span>
                Based on your CV: <em>{question.cv_reference}</em>
              </span>
            </div>
          )}

          {/* Answer input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Your answer
              </label>
              {hasSpeechAPI && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isListening
                      ? "bg-coral-50 text-coral-700 border border-coral-200 animate-pulse"
                      : "bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100"
                  }`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  {isListening ? "Stop recording" : "Voice answer"}
                </button>
              )}
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak your answer or type it here…"
              rows={6}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400">
              {answer.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          <Button
            variant="primary"
            fullWidth
            isLoading={isScoring}
            disabled={answer.trim().length < 20}
            onClick={() => onSubmit(answer)}
          >
            {isScoring ? "Scoring your answer…" : "Submit answer →"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ─── Score result screen ───────────────────────────────────
const ScoreScreen = ({ scoring, question, onNext, isLast }) => (
  <Card padding="md">
    <div className="space-y-5">
      <div className="flex items-center gap-5">
        <ScoreRing score={scoring.readiness_score} />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            Readiness score
          </p>
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            {scoring.verdict}
          </p>
        </div>
      </div>

      {/* Sub-scores */}
      {scoring.scores && (
        <div className="space-y-2">
          <SubScoreBar label="Substance" value={scoring.scores.substance} />
          <SubScoreBar label="Clarity" value={scoring.scores.clarity} />
          <SubScoreBar label="Specificity" value={scoring.scores.specificity} />
          <SubScoreBar
            label="Confidence tone"
            value={scoring.scores.confidence_tone}
          />
        </div>
      )}

      {/* Model answer */}
      {scoring.model_answer_snippet && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-2">
            Strong opening sounds like:
          </p>
          <p className="text-xs text-teal-900 italic leading-relaxed">
            "{scoring.model_answer_snippet}"
          </p>
        </div>
      )}

      {/* Coaching notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scoring.strengths?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-2">
              Strengths
            </p>
            <ul className="space-y-1">
              {scoring.strengths.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-700 flex items-start gap-1.5"
                >
                  <span className="text-teal-500 shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {scoring.improvements?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-coral-600 mb-2">
              Improve this
            </p>
            <ul className="space-y-1">
              {scoring.improvements.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-700 flex items-start gap-1.5"
                >
                  <span className="text-coral-400 shrink-0 mt-0.5">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button variant="primary" fullWidth onClick={onNext}>
        {isLast ? "See final score →" : "Next question →"}
      </Button>
    </div>
  </Card>
);

// ─── Final results ─────────────────────────────────────────
const FinalResults = ({ scorings, questions, onRetry }) => {
  const avg = Math.round(
    scorings.reduce((s, r) => s + (r.readiness_score || 0), 0) /
      scorings.length,
  );
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <Card padding="md">
        <div className="text-center py-4 space-y-3">
          <ScoreRing score={avg} size={100} />
          <div>
            <p className="text-base font-bold text-gray-900">
              Overall Readiness Score
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {avg >= 80
                ? "Excellent — you're ready to interview."
                : avg >= 60
                  ? "Good — polish a few answers and you're there."
                  : "Needs work — focus on specificity and outcomes."}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Question breakdown
        </p>
        {scorings.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
          >
            <ScoreRing score={s.readiness_score} size={56} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
                {questions[i]?.question}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                {s.verdict}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onRetry}>
          Try again
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate("/interview-prep")}
        >
          Back to prep sheet
        </Button>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const MockInterview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselected = searchParams.get("jobId");

  const { jobs, isLoading: isLoadingJobs } = useJobTargets();
  const [selectedJobId, setSelectedJobId] = useState(preselected || "");
  const [phase, setPhase] = useState("select"); // select | loading | interview | scoring | done
  const [questions, setQuestions] = useState([]);
  const [jobMeta, setJobMeta] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [scorings, setScoringss] = useState([]);
  const [currentScoring, setCurrentScoring] = useState(null);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    if (!selectedJobId) return;
    setPhase("loading");
    setError(null);
    try {
      const data = await api.post("/interview/questions", {
        jobTargetId: selectedJobId,
      });
      const qs = Array.isArray(data.questions) ? data.questions : [];
      setQuestions(qs);
      setJobMeta({ title: data.jobTitle, company: data.company });
      setCurrentQ(0);
      setScoringss([]);
      setPhase("interview");
    } catch (err) {
      setError(err.message);
      setPhase("select");
    }
  };

  const handleAnswer = async (answer) => {
    const q = questions[currentQ];
    setPhase("scoring");
    try {
      const score = await api.post("/interview/score", {
        question: q.question,
        answer,
        cvReference: q.cv_reference,
        jobTitle: jobMeta?.title,
      });
      setCurrentScoring(score);
    } catch (err) {
      setError(err.message);
      setPhase("interview");
    }
  };

  const handleNext = () => {
    const updated = [...scorings, currentScoring];
    setScoringss(updated);
    setCurrentScoring(null);
    if (currentQ + 1 >= questions.length) {
      setPhase("done");
    } else {
      setCurrentQ((q) => q + 1);
      setPhase("interview");
    }
  };

  const handleRetry = () => {
    setPhase("select");
    setQuestions([]);
    setScoringss([]);
    setCurrentQ(0);
    setCurrentScoring(null);
  };

  return (
    <div className="mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Mock Interview</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          5 stress-test questions drawn from your actual CV. Answer by voice or
          text — get instant coaching feedback.
        </p>
      </div>

      {/* Select */}
      {phase === "select" && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Choose your interview
          </h2>
          {isLoadingJobs ? (
            <Spinner size="sm" />
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 mb-4"
            >
              <option value="">Choose a job target…</option>
              {jobs?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_title} — {j.company_name}
                </option>
              ))}
            </select>
          )}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">5 questions</span> will be
              generated specifically from your CV content — no generic Q&A
              banks. Voice input works in Chrome and Safari.
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={handleStart}
            disabled={!selectedJobId}
          >
            Start mock interview
          </Button>
        </Card>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                Reading your CV…
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Generating questions that target what's actually in your
                experience
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Active interview */}
      {phase === "interview" && questions.length > 0 && (
        <QuestionScreen
          question={questions[currentQ]}
          index={currentQ}
          total={questions.length}
          onSubmit={handleAnswer}
          isScoring={false}
        />
      )}

      {/* Scoring in progress */}
      {phase === "scoring" && !currentScoring && (
        <Card padding="md">
          <div className="flex flex-col items-center py-8 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Scoring your answer…</p>
          </div>
        </Card>
      )}

      {/* Score result */}
      {phase === "scoring" && currentScoring && (
        <ScoreScreen
          scoring={currentScoring}
          question={questions[currentQ]}
          onNext={handleNext}
          isLast={currentQ + 1 >= questions.length}
        />
      )}

      {/* Final results */}
      {phase === "done" && (
        <FinalResults
          scorings={scorings}
          questions={questions}
          onRetry={handleRetry}
        />
      )}

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
