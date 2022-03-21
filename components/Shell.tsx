
import Link from 'next/link';
import {
  Header,
  HeaderContainer,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SideNav,
  SideNavItems,
  SideNavLink,
  SkipToContent,
} from 'carbon-components-react';
import { ChartBubblePacked16, ColorPalette16, HeatMap16, ShoppingCatalog16 } from '@carbon/icons-react';
import { useContext, useEffect } from 'react';
import { WalletContext, prettyAddress } from '../context/Wallet';
import { wrongNetwork } from '../context/config';

export default function Shell({ children }) {
  const { connect, currentAccount, walletError } = useContext(WalletContext);
  useEffect(() => {
    document.querySelector('body').classList.add('bg-stone-50');
    document.querySelector('body').classList.add('text-stone-900');
    document.querySelector('body').classList.add('dark:bg-stone-900');
    document.querySelector('body').classList.add('datk:text-stone-50');
  }, []);
  return (
    <>
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <>
            <Header aria-label="GNFT">
              <SkipToContent />
              <HeaderMenuButton
                aria-label="Open menu"
                isCollapsible
                onClick={onClickSideNavExpand}
                isActive={isSideNavExpanded}
              />
              <Link href="/" passHref>
                <HeaderName prefix="GNFT"> </HeaderName>
              </Link>
              <HeaderNavigation aria-label="Connect wallet">
                <HeaderMenuItem
                  className="text-gradient"
                  onClick={() => {
                    connect();
                  }}
                >
                  {walletError?.chainId
                    ? wrongNetwork
                    : currentAccount
                      ? `Connected to ${prettyAddress(currentAccount)}`
                      : 'Connect wallet'}
                </HeaderMenuItem>
              </HeaderNavigation>
              <SideNav
                aria-label="Side navigation"
                isRail
                expanded={isSideNavExpanded}
                onOverlayClick={onClickSideNavExpand}
                className="dark:bg-stone-700"
              >
                <SideNavItems>
                  <Link href="/create" passHref>
                    <SideNavLink renderIcon={ColorPalette16}>Create</SideNavLink>
                  </Link>
                  <Link href="/market" passHref>
                    <SideNavLink renderIcon={ShoppingCatalog16}>Market</SideNavLink>
                  </Link>
                  <Link href="/my-gnfts" passHref>
                    <SideNavLink renderIcon={ChartBubblePacked16}>My GNFTs</SideNavLink>
                  </Link>
                  <Link href="/dashboard" passHref>
                    <SideNavLink renderIcon={HeatMap16}>Creator Dashboard</SideNavLink>
                  </Link>
                </SideNavItems>
              </SideNav>
            </Header>
          </>
        )}
      />
      <main className="my-12 ml-12">{children}</main>
    </>
  );
}
