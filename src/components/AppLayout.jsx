import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

/** Tailwind pt-14 — keep in sync with SiteNav height */
export const SITE_NAV_OFFSET_CLASS = 'pt-14';

export default function AppLayout() {
  const { pathname } = useLocation();
  const showAppFooter = pathname !== '/';

  return (
    <>
      <SiteNav />
      <main className={`${SITE_NAV_OFFSET_CLASS} bg-background min-h-[calc(100vh-3.5rem)] flex flex-col`}>
        <div className="flex-1">
          <Outlet />
        </div>
        {showAppFooter && <SiteFooter />}
      </main>
    </>
  );
}
