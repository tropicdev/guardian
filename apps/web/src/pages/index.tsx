import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "@/utils/api";

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Guardian Dashboard</title>
        <meta name="description" content="Dashboard for the guardian discord bot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main >
        <div>
          <h1>
            Guardian Dashboard
          </h1>
          <div>
            <Link
              href="https://github.com/tropicdev/guardian"
              target="_blank"
            >
              <h3>First Steps</h3>
              <div>
                Just the basics - Everything you need to know to set up
              </div>
            </Link>
            <Link
              href="https://github.com/tropicdev/guardian"
              target="_blank"
            >
              <h3>Documentation</h3>
              <div>
                Learn more about Guardian Dashboard, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <div>
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div>
      <p>
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
