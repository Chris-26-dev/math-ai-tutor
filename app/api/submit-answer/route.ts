// app/api/submit-answer/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callAIForFeedback(isCorrect: boolean, userAnswer: number, finalAnswer: number) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
  The student answered a math problem.
  - Correct? ${isCorrect}
  - Student's answer: ${userAnswer}
  - Correct answer: ${finalAnswer}

  Please give a short, encouraging feedback (1–2 sentences) suitable for a Primary 5 student.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function POST(req: Request) {
  try {
    const { sessionId, userAnswer } = await req.json();

    // Fetch problem from Supabase
    const { data: session, error } = await supabase
      .from("math_problem_sessions")
      .select("final_answer")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const finalAnswer = session.final_answer;
    const isCorrect = Number(userAnswer) === finalAnswer;

    // Ask Gemini for feedback
    const feedback = await callAIForFeedback(isCorrect, Number(userAnswer), finalAnswer);

    // Optionally: save submission
    await supabase.from("math_problem_submissions").insert([
      { session_id: sessionId, user_answer: userAnswer, is_correct: isCorrect, feedback }
    ]);

    return NextResponse.json({ feedback, isCorrect, finalAnswer });
  } catch (err: unknown) {
    console.error("submit-answer error:", err);
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
