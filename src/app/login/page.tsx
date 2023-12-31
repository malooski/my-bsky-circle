import Image from "next/image";
import styles from "./page.module.scss";
import { cookies } from "next/headers";

import { BskyAgent } from "@atproto/api";
import { redirect } from "next/navigation";

export default async function Login() {
  const username = cookies().get("bsky-username")?.value;
  const password = cookies().get("bsky-password")?.value;

  return (
    <main className={styles.main}>
      <h1>Circle Generator</h1>

      <form className={styles.loginForm} action={login}>
        <label htmlFor="Username">Username</label>
        <input
          placeholder="username.bsky.social"
          defaultValue={username}
          type="text"
          name="Username"
        />

        <label htmlFor="Password">Password</label>
        <input
          placeholder="password"
          defaultValue={password}
          type="password"
          name="Password"
        />

        <button type="submit">Login</button>
      </form>

      <p className={styles.note}>
        Note: Use{" "}
        <a
          href="https://bsky.app/settings/app-passwords"
          target="_blank"
          rel="noreferrer"
        >
          App Passwords
        </a>{" "}
        for 3rd party services!
        <br />
        <br />
        Credentials are stored in cookies in your browser.
        <br />
        Not on our servers.
      </p>
    </main>
  );
}

async function login(formData: FormData) {
  "use server";
  cookies().set("bsky-username", "");
  cookies().set("bsky-password", "");

  const username = formData.get("Username")?.toString();
  const password = formData.get("Password")?.toString();

  if (!username || !password) {
    return;
  }

  const agent = new BskyAgent({ service: "https://bsky.social" });

  try {
    await agent.login({
      identifier: username,
      password: password,
    });
  } catch (e) {
    console.error(e);
    return;
  }

  cookies().set("bsky-username", username);
  cookies().set("bsky-password", password);

  redirect("/");
}
