"use server";

import Image from "next/image";
import styles from "./page.module.scss";
import { cookies } from "next/headers";

import { BskyAgent } from "@atproto/api";
import { redirect } from "next/navigation";
import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { ProfileViewBasic } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { sortBy } from "lodash";

export default async function Circle() {
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

  const authors = new Map<string, ProfileViewBasic>();
  const myProfile = await agent.getProfile({ actor: me.data.did });

  const commonProfiles = new Map<string, FeedViewPost[]>();
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) {
    const response = await agent.getTimeline({
      limit: 100,
      cursor,
    });

    for (const post of response.data.feed) {
      const entry = commonProfiles.get(post.post.author.did) ?? [];
      authors.set(post.post.author.did, post.post.author);

      entry.push(post);

      commonProfiles.set(post.post.author.did, entry);
    }

    if (response.data.feed.length < 100) {
      break;
    }

    cursor = response.data.cursor;
  }

  const mostPopularUsers = sortBy(
    Array.from(commonProfiles.entries()),
    ([did, posts]) => -1 * posts.length
  ).map(([did, posts]) => authors.get(did)!);

  return (
    <main className={styles.main}>
      <h1>Circle</h1>
      <p>Here are the most talkative users on your feed.</p>
      <div className={styles.users}>
        {mostPopularUsers.map((user) => (
          <div key={user.did} className={styles.user}>
            <img width="32px" height="32px" src={user.avatar ?? "#"} />
            <span>{user.handle}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
