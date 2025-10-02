// app/api/generate-problem/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callAIToGenerateProblem() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
  Generate a math word problem suitable for a Primary 5 student.
  Respond with ONLY valid JSON in this exact shape:
  {
    "problem_text": "string",
    "final_answer": number
  }
  `;

  const result = await model.generateContent(prompt);
  let text = result.response.text();

  // Clean common issues: remove markdown fences, trim spaces
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/```json\s*|```/g, "").trim();
  }

  try {
    const parsed = JSON.parse(text);

    if (!parsed.problem_text || typeof parsed.final_answer !== "number") {
      throw new Error("Missing required fields in AI JSON");
    }

    return parsed;
  } catch (err) {
    console.error("AI did not return valid JSON:", text, "Error:", err);
    throw new Error("Invalid AI response");
  }
}

export async function POST() {
  try {
    const { problem_text, final_answer } = await callAIToGenerateProblem();

    // Save to Supabase
    const { data, error } = await supabase
      .from("math_problem_sessions")
      .insert([{ problem_text, final_answer }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (err: unknown) {
    let message = "Unknown error";

    if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
