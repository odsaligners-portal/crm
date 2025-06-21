import { Outfit } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Providers } from './providers';
import { ToastContainer } from 'react-toastify';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <head>  
        <link rel="shortcut icon" type="image/x-icon" href="/fav.png" />
      </head>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Providers>
          <ThemeProvider>
            <SidebarProvider>
              {children}
              <ToastContainer
                position="bottom-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
