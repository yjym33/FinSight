'use client';

import { usePathname } from 'next/navigation';
import { RightEdgeBar } from '@/shared/components/layout/RightEdgeBar';
import { ExpandableSidebar } from '@/shared/components/layout/ExpandableSidebar';
import { cn } from '@/shared/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 pr-[60px]">
        {children}
      </div>
      <RightEdgeBar />
      <ExpandableSidebar />
    </div>
  );
}
