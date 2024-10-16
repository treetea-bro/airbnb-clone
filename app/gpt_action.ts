"use server";

import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function gpt(content: string) {}

export async function searchCondition(
  country: string,
  guest: number,
  room: number,
  bathroom: number,
) {
  //ISO 3166-1 alpha-2
  //localhost:3000/?country=AW&guest=0&room=0&bathroom=0
  http: return redirect(
    `/?country=${country}&guest=${guest}&room=${room}&bathroom=${bathroom}`,
  );
}

export async function categoryFilter(filter: string) {
  http: return redirect(`/?filter=${filter}`);
}

export async function redirectTo(path: string) {
  // my-homes
  // favorites
  // reservations
  http: return redirect(path);
}

export async function checkReservation(title: string) {
  const home = await prisma.home.findFirst({
    where: { title },
    select: { id: true },
  });

  if (!home) throw new Error("예약 실패");

  const reservations = await prisma.reservation.findMany({
    where: { homeId: home.id },
    select: { startDate: true, endDate: true },
  });

  // console.log(reservations);
  // [
  //   {
  //     startDate: 2024-10-13T15:00:00.000Z,
  //     endDate: 2024-10-15T15:00:00.000Z
  //   }
  // ]

  return reservations;
}

export async function makeReservation(
  title: string,
  startDate: Date,
  endDate: Date,
) {
  // const date = new Date(2023, 9, 15); // 2023년 10월 15일
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const userId = user?.id;

  const home = await prisma.home.findFirst({
    where: { title },
    select: { id: true },
  });

  if (!home) throw new Error("예약 실패");

  // const reservations = await prisma.reservation.findMany({
  //   where: { homeId: home?.id },
  //   select: { startDate: true, endDate: true },
  // });

  const a = await prisma.reservation.create({
    data: { homeId: home.id, userId, startDate, endDate },
  });

  http: return redirect(`/home/${home.id}`);
}
