"use server";

import Image from "next/image";
import styles from "./page.module.css";
import { cookies } from "next/headers";

import { BskyAgent } from "@atproto/api";
import { redirect } from "next/navigation";

export default async function Home() {
  const username = cookies().get("bsky-username")?.value;
  const password = cookies().get("bsky-password")?.value;
  const loggedIn = username && password;
  if (!loggedIn) {
    redirect("/login");
  }

  const agent = new BskyAgent({ service: "https://bsky.social" });

  const me = await agent.login({
    identifier: username,
    password: password,
  });

  const myProfile = await agent.getProfile({ actor: me.data.did });

  return (
    <main className={styles.main}>
      <span>Logged in as {me.data.handle}</span>
      <img src={myProfile.data.avatar ?? "#"} />

      <a href="/circle">Create My Circle!</a>

      <a href="/login">Logout</a>
    </main>
  );
}
