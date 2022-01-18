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

import {
  ChartBubblePacked16,
  ColorPalette16,
  HeatMap16,
  ShoppingCatalog16,
} from '@carbon/icons-react';

export default function Shell({ children }) {
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
              <HeaderName href="/" prefix="GNFT">
                {' '}
              </HeaderName>
              <HeaderNavigation aria-label="Connect wallet">
                <HeaderMenuItem href="#" className="text-gradient">
                  Connect wallet
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
                  <SideNavLink renderIcon={ColorPalette16} href="#">
                    Create
                  </SideNavLink>
                  <SideNavLink renderIcon={ShoppingCatalog16} href="#">
                    Browse
                  </SideNavLink>
                  <SideNavLink renderIcon={ChartBubblePacked16} href="#">
                    My NFTs
                  </SideNavLink>
                  <SideNavLink renderIcon={HeatMap16} href="#">
                    Creator Dashboard
                  </SideNavLink>
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
