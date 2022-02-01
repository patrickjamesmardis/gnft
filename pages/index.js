import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>GNFT</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed top-0 left-0 w-screen h-screen bg-stone-900 text-stone-50 tokensBG">
        <div className="comingSoonBanner mt-12 ml-12 p-3 flex flex-col items-center justify-center">
          <h1 className="text-3xl mb-3">GNFT</h1>
          <p className="mb-3 text-center">A place to create, mint, and collect generative&nbsp;art&nbsp;NFTs.</p>
          <a
            href="https://gnft.notion.site/GNFT-Wallet-Setup-bd4bd90613394998b7c4cb3446af6f5f"
            target="_blank"
            rel="noreferrer"
            className="gradientBG py-3 px-6 mt-2"
          >
            <p>Setup Guide</p>
          </a>
        </div>
      </div>
    </>
  );
}
