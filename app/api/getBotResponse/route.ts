import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // 최대 메시지 수 설정
    const maxMessages = 10;
    const recentMessages = messages.slice(-maxMessages);

    const systemMessage = {
      role: "system",
      content: "당신은 에어비앤비 사이트의 정보를 제공하는 챗봇입니다.",
    };

    const formattedMessages = [
      systemMessage,
      ...recentMessages.map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
    });

    const botResponse =
      completion.choices[0]?.message?.content || "응답을 가져오지 못했습니다.";
    return NextResponse.json({ text: botResponse });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { text: "에러 발생: " + error.message },
      { status: 500 },
    );
  }
}
