import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Header,
  HeaderContainer,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SkeletonText,
  SkipToContent,
} from 'carbon-components-react';
import { useContext, useEffect } from 'react';
import { prettyAddress, WalletContext } from '../context/Wallet';

export default function Shell({ children }) {
  const { account, logout, magicUserMeta, username } = useContext(WalletContext);
  const router = useRouter();

  useEffect(() => {
    document.querySelector('body').classList.add('bg-stone-50');
    document.querySelector('body').classList.add('text-stone-900');
    document.querySelector('body').classList.add('dark:bg-stone-900');
    document.querySelector('body').classList.add('datk:text-stone-50');
  }, []);

  return (
    <>
      <HeaderContainer
        render={() => (
          <>
            <Header aria-label="GNFT">
              <SkipToContent />
              <Link href="/" passHref>
                <HeaderName prefix="GNFT"> </HeaderName>
              </Link>
              <HeaderNavigation aria-label="GNFT Navigation">
                <Link href="/create" passHref>
                  <HeaderMenuItem>Create</HeaderMenuItem>
                </Link>
                <Link href="/market" passHref>
                  <HeaderMenuItem>Market</HeaderMenuItem>
                </Link>
              </HeaderNavigation>
              <HeaderNavigation aria-label="Connect wallet" className="walletNav">
                <HeaderMenuItem
                  className="text-gradient"
                  onClick={
                    router.pathname === '/wallet' && account
                      ? logout
                      : () => {
                          router.push('/wallet');
                        }
                  }
                >
                  {magicUserMeta === 'LOADING' || username === 'LOADING' ? (
                    <SkeletonText width="48px" className="dark:bg-stone-900" />
                  ) : account ? (
                    router.pathname === '/wallet' ? (
                      'Log out'
                    ) : username && username !== 'LOADING' && username !== 'ERROR' ? (
                      `@${username}`
                    ) : (
                      prettyAddress(account)
                    )
                  ) : (
                    'Wallet'
                  )}
                </HeaderMenuItem>
              </HeaderNavigation>
            </Header>
          </>
        )}
      />
      <main className="my-12">{children}</main>
    </>
  );
}
