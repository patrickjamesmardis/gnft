import { AppProps } from 'next/app';
import '../styles/globals.scss';
import Wallet from '../context/Wallet';
import Sketch from '../context/Sketch';
import Shell from '../components/Shell';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Wallet>
      <Sketch>
        <Shell>
          <Component {...pageProps} />
        </Shell>
      </Sketch>
    </Wallet>
  );
}

export default MyApp;
