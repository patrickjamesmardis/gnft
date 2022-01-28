import '../styles/globals.scss';
import Wallet from '../context/Wallet';

import Shell from '../components/Shell';
function MyApp({ Component, pageProps }) {
  return (
    <Wallet>
      <Shell>
        <Component {...pageProps} />
      </Shell>
    </Wallet>
  );
}

export default MyApp;
