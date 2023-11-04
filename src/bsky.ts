"use server";

import { BskyAgent } from "@atproto/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function verifyBskyLogin(username: string, password: string) {
  const agent = new BskyAgent({ service: "https://bsky.social" });

  await agent.login({
    identifier: username,
    password: password,
  });
}
