'use client';

import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function AuthLayout({
  children,
}) {
  const router = useRouter();
  const { token, role, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token || !role || !user) {
      router.push('/signin');
    }
    if(token && role === 'admin'){
      router.push('/admin');
    }else if(token && role === 'doctor'){
      router.push('/doctor');
    }else if(token && role === 'super-admin'){
      router.push('/super-admin');
    }
  }, [token, router]);

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
} 