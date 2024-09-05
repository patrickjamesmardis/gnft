import { useEffect } from 'react';
import { AppProps } from 'next/app';
import 'react-phone-input-2/lib/style.css';
import '../styles/globals.scss';
import Sketch from '../context/Sketch';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.querySelector('body').classList.add('bg-stone-50');
    document.querySelector('body').classList.add('text-stone-900');
    document.querySelector('body').classList.add('dark:bg-stone-900');
    document.querySelector('body').classList.add('datk:text-stone-50');
  }, []);
  return (
    <Sketch>
      <main>
        <Component {...pageProps} />
      </main>
    </Sketch>
  );
}

export default MyApp;
