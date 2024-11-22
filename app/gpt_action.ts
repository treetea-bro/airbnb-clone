"use server";

import OpenAI from "openai";
import filter_rooms_json from "./function-calling/filter_rooms.json";
import my_homes_json from "./function-calling/my_homes.json";
import favorites_json from "./function-calling/favorites.json";
import reservations_json from "./function-calling/reservations.json";
import reservation_json from "./function-calling/reservation.json";
import cheapest_room_json from "./function-calling/cheapest_room.json";
import prisma from "./lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60 * 1000,
});

const system_prompt =
  `You are a helpful personal assistant.\n\n` +
  `# Tools\n` +
  `You have the following tools that you can invoke based on the user inquiry.\n` +
  `- filter_rooms, when the user wants to search for rooms based on given conditions, country parameter format is using ISO 3166-1 alpha-2 string.\n` +
  `- my_homes, when the user wants to see own's registered home list\n` +
  `- favorites, when the user wants to see favorite home list\n` +
  `- reservation, when the user wants to reservation current page's home than from user, get startDate, endDate argument do reservation.\n` +
  `- reservations, when the user wants to see reservation list\n` +
  `- cheapest_room, when the user wants to see cheapest room, than no need any argument just call, but if user want cheapest about some category only, categoryName argument needed.\n` +
  `be sure to guide the user to fill up all required information.\n` +
  `When you fill up some of the required information yourself, be sure to confirm to user before proceeding.\n` +
  `Aside from the listed functions above, answer all other inquiries by telling the user that it is out of scope of your ability.\n\n` +
  `# User\n` +
  `If my full name is needed, please ask me for my full name.\n\n` +
  `# Language Support\n` +
  `Please reply in the language used by the user.\n\n` +
  `Today is ${new Date().toISOString().split("T")[0]}`;

export async function gpt(
  msgs: ChatCompletionMessageParam[],
  currentUrl: string,
) {
  try {
    // 최대 메시지 수 설정
    // const maxMessages = 20;
    // const recentMessages = msgs.slice(-maxMessages);

    const systemMessage: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: system_prompt,
      },
    ];

    const formattedMessages: ChatCompletionMessageParam[] =
      systemMessage.concat(msgs);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      temperature: 0.3,
      messages: formattedMessages,
      tools: [
        { type: "function", function: filter_rooms_json },
        { type: "function", function: my_homes_json },
        { type: "function", function: favorites_json },
        { type: "function", function: reservations_json },
        { type: "function", function: reservation_json },
        { type: "function", function: cheapest_room_json },
      ],
    });

    let redirectUrl = "";
    let botResponse = "";
    if ("tool_calls" in completion.choices[0].message) {
      const name =
        completion?.choices?.[0]?.message?.tool_calls?.[0]?.function?.name;
      const args = completion?.choices?.[0]?.message?.tool_calls?.[0]?.function
        ?.arguments as string;

      if (!name && !args) throw Error("function calling error!!");
      const args2 = JSON.parse(args);

      if (name == "filter_rooms") {
        redirectUrl = `/?country=${args2.country}&guest=${args2.guest}&room=${args2.room}&bathroom=${args2.bathroom}`;
      } else if (name == "my_homes") {
        redirectUrl = `/my-homes`;
      } else if (name == "favorites") {
        redirectUrl = `/favorites`;
      } else if (name == "reservations") {
        redirectUrl = `/reservations`;
      } else if (name == "cheapest_room") {
        const data = await prisma.home.findFirst({
          orderBy: {
            price: "asc",
          },
          take: 1,
          where: args2 ? { categoryName: args2.categoryName } : undefined,
        });
        redirectUrl = `/home/${data?.id}`;
      } else if (name == "reservation") {
        if (!isHomeUrl(currentUrl)) {
          botResponse =
            "방을 예약하시려면 예약을 원하는 방의 페이지로 이동하여 진행하여 주세요.";
          return { text: botResponse, redirectUrl };
        }
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        const data = await prisma.reservation.create({
          data: {
            userId: user?.id,
            startDate: args2.startDate,
            endDate: args2.endDate,
            homeId: currentUrl.split("/").pop(),
          },
        });

        revalidatePath(currentUrl);
      }
    }

    if (!botResponse) {
      botResponse =
        completion.choices[0]?.message?.content ||
        "요청하신 정보를 처리하였습니다. 추가로 원하시는 작업이 있다면 말씀해주세요.";
    }

    return { text: botResponse, redirectUrl };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);

    return {
      text: "에러 발생: " + error.message,
      status: 500,
    };
  }
}

function isHomeUrl(url: string): boolean {
  const pattern =
    /\/home\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const a = pattern.test(url);
  return a;
}
