import '../styles/globals.scss';

import Shell from '../components/Shell';
function MyApp({ Component, pageProps }) {
  return (
    <Shell>
      <Component {...pageProps} />
    </Shell>
  );
}

export default MyApp;
