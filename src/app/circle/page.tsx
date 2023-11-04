"use server";

import Image from "next/image";
import styles from "./page.module.scss";
import { cookies } from "next/headers";

import { BskyAgent } from "@atproto/api";
import { redirect } from "next/navigation";
import {
  FeedViewPost,
  PostView,
} from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { groupBy, sortBy } from "lodash";
import { isNotNil } from "@/util";

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

  const likedPosts: FeedViewPost[] = [];
  const repostedPosts: FeedViewPost[] = [];
  const repliedPosts: PostView[] = [];

  await Promise.all([
    // Get all likes
    (async () => {
      let cursor: string | undefined;
      let current = 0;
      let max = 500;
      while (current < max) {
        const likesResp = await agent.getActorLikes({
          actor: me.data.did,
          limit: 100,
          cursor,
        });

        likedPosts.push(...likesResp.data.feed);
        current += likesResp.data.feed.length;
        cursor = likesResp.data.cursor;

        if (likesResp.data.feed.length < 100) break;
      }
    })(),

    // Get all reposts and replies
    (async () => {
      let cursor: string | undefined;
      let current = 0;
      let max = 500;

      while (current < max) {
        const resp = await agent.getAuthorFeed({
          actor: me.data.did,
          filter: "posts_with_replies",
          limit: 100,
        });
        const onlyRts = resp.data.feed.filter(
          (post) => post.post.author.did !== me.data.did
        );
        const onlyReplies = resp.data.feed
          .map((post) => post.reply?.parent)
          .filter(isNotNil)
          .map((p) => p as PostView);

        repostedPosts.push(...onlyRts);
        repliedPosts.push(...onlyReplies);

        current += resp.data.feed.length;
        cursor = resp.data.cursor;

        if (resp.data.feed.length < 100) break;
      }
    })(),
  ]);

  const userScore = new Map<string, number>();

  for (const post of likedPosts) {
    const author = post.post.author.did;
    const score = userScore.get(author) ?? 0;
    userScore.set(author, score + 1);
  }

  for (const post of repostedPosts) {
    const author = post.post.author.did;
    const score = userScore.get(author) ?? 0;
    userScore.set(author, score + 1);
  }

  for (const post of repliedPosts) {
    const author = post.author.did;
    const score = userScore.get(author) ?? 0;
    userScore.set(author, score + 1);
  }

  // Remove self
  userScore.delete(me.data.did);

  const sortedProfileDids = sortBy(
    Array.from(userScore.entries()),
    ([_, score]) => -score
  ).slice(0, 10);

  const profilesResponse = await agent.getProfiles({
    actors: sortedProfileDids.map(([did]) => did),
  });

  const profiles = profilesResponse.data.profiles;

  return (
    <main className={styles.main}>
      <a href="/">&lt; Back</a>

      <h1>{me.data.handle}'s Circle</h1>
      <p>Here are the users you interact with most.</p>
      <div className={styles.users}>
        {profiles.map((user, idx) => (
          <>
            <span className={styles.placement}>{idxToPlacement(idx)}</span>
            <img className={styles.avatar} src={user.avatar ?? "#"} />
            <span>{user.handle}</span>
          </>
        ))}
      </div>
    </main>
  );
}

function idxToPlacement(idx: number) {
  switch (idx) {
    case 0:
      return "🥇";
    case 1:
      return "🥈";
    case 2:
      return "🥉";
    default:
      return `${idx + 1}`;
  }
}
