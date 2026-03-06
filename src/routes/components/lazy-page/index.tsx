import { Suspense } from 'react';
import { PageFallback } from '../page-fallback';

interface LazyPageProps {
  children: React.ReactNode;
}

export function LazyPage(props: LazyPageProps) {
  return <Suspense fallback={<PageFallback />}>{props.children}</Suspense>;
}
