
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Providers } from './providers';
import { ToastContainer } from 'react-toastify';
import GlobalLoader from '@/components/common/GlobalLoader';

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <head>  
        <link rel="shortcut icon" type="image/x-icon" href="/fav.png" />
        <link href="https://fonts.googleapis.com/css2?family=Righteous&amp;display=swap" rel="stylesheet"></link>
      </head>
      <body className={`dark:bg-gray-900`}>
        <Providers>
          <ThemeProvider>
            <SidebarProvider>
              <GlobalLoader />
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
