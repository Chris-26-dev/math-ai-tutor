"use client";

import { useState } from "react";
import { Sparkles, Trophy, CheckCircle, XCircle } from "lucide-react";

interface GenerateProblemResponse {
  id: string;
  problem_text: string;
  final_answer: number;
}

interface SubmitAnswerResponse {
  feedback: string;
  isCorrect: boolean;
  finalAnswer: number;
}

export default function HomePage() {
  const [problem, setProblem] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [highlightNewChallenge, setHighlightNewChallenge] = useState(true); // ✅ NEW

  // Generate new problem
  const generateProblem = async () => {
    setLoadingProblem(true);
    setFeedback(null);
    setAnswer("");
    setCorrectAnswer(null);
    setHasAnswered(false);
    setHighlightNewChallenge(false); // stop pulsing once clicked

    try {
      const res = await fetch("/api/generate-problem", { method: "POST" });
      const data: GenerateProblemResponse | { error: string } = await res.json();

      if (res.ok && "problem_text" in data) {
        setProblem(data.problem_text);
        setSessionId(data.id);
      } else if ("error" in data) {
        setProblem("⚠️ Failed to generate problem: " + data.error);
      }
    } catch (err) {
      console.error("generateProblem error:", err);
      setProblem("⚠️ Error generating problem.");
    } finally {
      setLoadingProblem(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!sessionId) return;
    setLoadingSubmit(true);

    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userAnswer: Number(answer),
        }),
      });

      const data: SubmitAnswerResponse | { error: string } = await res.json();

      if (res.ok && "feedback" in data) {
        setFeedback(data.feedback ?? "⚠️ Something went wrong.");
        if ("finalAnswer" in data && data.finalAnswer !== undefined) {
          setCorrectAnswer(data.finalAnswer);
        }
        setHasAnswered(true);
        setHighlightNewChallenge(true); // ✅ pulse again after answered
      } else if ("error" in data) {
        setFeedback("⚠️ " + data.error);
      }
    } catch (err) {
      console.error("submit-answer error:", err);
      setFeedback("⚠️ Error submitting answer.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <main className="p-6 max-w-lg mx-auto space-y-6 font-sans mt-12">
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-center text-indigo-600 flex items-center justify-center gap-2">
        <Sparkles className="w-7 h-7 text-yellow-400" />
        Math Quest
      </h1>
      <p className="text-center text-gray-600">
        Solve fun problems, earn stars, and become a{" "}
        <span className="font-semibold">Math Champion!</span>
      </p>

      {/* Generate Problem */}
      <div className="flex justify-center">
        <button
          onClick={generateProblem}
          disabled={loadingProblem}
          className={`px-6 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2
            ${
              loadingProblem
                ? "bg-gray-400 cursor-not-allowed text-white"
                : `bg-indigo-500 hover:bg-indigo-600 text-white ${
                    highlightNewChallenge ? "animate-bounce" : ""
                  }`
            }`}
        >
          <Sparkles className="w-5 h-5" />
          {loadingProblem ? "Generating..." : " New Challenge"}
        </button>
      </div>

      {/* Problem */}
      {problem && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 shadow space-y-4">
          <p className="text-lg font-semibold text-gray-800">{problem}</p>

          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={hasAnswered}
            className="border-2 border-indigo-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-400 text-lg disabled:bg-gray-100"
          />

          <button
            onClick={submitAnswer}
            disabled={loadingSubmit || !answer || hasAnswered}
            className={`w-full px-6 py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 ${
              loadingSubmit || !answer || hasAnswered
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            <Trophy className="w-5 h-5" />
            {loadingSubmit ? "Checking..." : hasAnswered ? "Answered" : "Submit Answer"}
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-5 rounded-2xl shadow space-y-3 border-2 ${
            Number(answer) === correctAnswer
              ? "bg-green-100 border-green-300"
              : "bg-red-100 border-red-300"
          }`}
        >
          <p
            className={`font-bold flex items-center gap-2 ${
              Number(answer) === correctAnswer ? "text-green-800" : "text-red-800"
            }`}
          >
            {Number(answer) === correctAnswer ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Feedback
          </p>

          <p
            className={`text-lg ${
              Number(answer) === correctAnswer ? "text-green-700" : "text-red-700"
            }`}
          >
            {feedback}
          </p>

          {Number(answer) !== correctAnswer && (
            <p className="flex items-center gap-2 text-red-700 font-medium">
              <XCircle className="w-5 h-5 text-red-600" />
              Your Answer: {answer}
            </p>
          )}

          {correctAnswer !== null && Number(answer) !== correctAnswer && (
            <p className="flex items-center gap-2 text-green-800 font-semibold">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Correct Answer: {correctAnswer}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
