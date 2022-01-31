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
import { forwardRef, useContext } from 'react';
import Link from 'next/link';
import { WalletContext } from '../context/Wallet';

export default function Shell({ children }) {
  const { connect, currentAccount, prettyAddress, walletError } = useContext(WalletContext);
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
                    ? 'Please connect your wallet to the Polygon Mumbai Testnet'
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
                className="side-nav ui-03"
              >
                <SideNavItems>
                  <Link href="/create" passHref>
                    <SideNavLink renderIcon={ColorPalette16}>Create</SideNavLink>
                  </Link>
                  <Link href="/" passHref>
                    <SideNavLink renderIcon={ShoppingCatalog16}>Browse</SideNavLink>
                  </Link>
                  <Link href="/" passHref>
                    <SideNavLink renderIcon={ChartBubblePacked16}>My NFTs</SideNavLink>
                  </Link>
                  <Link href="/" passHref>
                    <SideNavLink renderIcon={HeatMap16}>Creator Dashboard</SideNavLink>
                  </Link>
                </SideNavItems>
              </SideNav>
            </Header>
          </>
        )}
      />
      <main className="m-12">{children}</main>
    </>
  );
}
