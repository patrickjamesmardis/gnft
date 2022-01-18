import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>GNFT</title>
        <meta
          name="description"
          content="Create, mint, and collect generative art NFTs."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className="text-3xl font-bold px-3 py-3">Hello, world!</h1>
    </>
  );
}
