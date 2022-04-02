import { AppProps } from 'next/app';
import 'react-phone-input-2/lib/style.css';
import '../styles/globals.scss';
import Wallet from '../context/Wallet';
import Sketch from '../context/Sketch';
import Shell from '../components/Shell';
import ConnectModal from '../components/ConnectModal';
import TransferModal from '../components/TransferModal';
import ReceiveModal from '../components/ReceiveModal';
import ListItemModal from '../components/ListItemModal';
import PurchaseModal from '../components/PurchaseModal';
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Wallet>
      <Sketch>
        <Shell>
          <Component {...pageProps} />
        </Shell>
        <ConnectModal />
        <TransferModal />
        <ReceiveModal />
        <ListItemModal />
        <PurchaseModal />
      </Sketch>
    </Wallet>
  );
}

export default MyApp;
