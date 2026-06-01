import { Outlet } from 'react-router-dom';
import SiteNav from '@/components/SiteNav';

/** Tailwind pt-14 — keep in sync with SiteNav height */
export const SITE_NAV_OFFSET_CLASS = 'pt-14';

export default function AppLayout() {
  return (
    <>
      <SiteNav />
      <main className={SITE_NAV_OFFSET_CLASS}>
        <Outlet />
      </main>
    </>
  );
}
