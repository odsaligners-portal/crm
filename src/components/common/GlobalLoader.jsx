'use client';
import { useAppSelector } from '@/store/store';
import Loading from '@/app/loading';

export default function GlobalLoader() {
  const { isLoading } = useAppSelector((state) => state.ui);

  if (!isLoading) return null;

  return <Loading />;
} 