
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import Script from "next/script";

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
        <link
          href="https://fonts.googleapis.com/css2?family=Righteous&amp;display=swap"
          rel="stylesheet"
        ></link>
        <Script id="lang-config" strategy="beforeInteractive">
          {`
            window.__GOOGLE_TRANSLATION_CONFIG__ = {
              languages: [
                { title: 'English', name: 'en', flag: '🇺🇸' },
                { title: 'Español', name: 'es', flag: '🇪🇸' },
                { title: 'Français', name: 'fr', flag: '🇫🇷' },
                { title: 'Deutsch', name: 'de', flag: '🇩🇪' },
                { title: 'Italiano', name: 'it', flag: '🇮🇹' },
                { title: 'Português', name: 'pt', flag: '🇵🇹' },
                { title: 'Русский', name: 'ru', flag: '🇷🇺' },
                { title: '日本語', name: 'ja', flag: '🇯🇵' },
                { title: '한국어', name: 'ko', flag: '🇰🇷' },
                { title: '中文', name: 'zh', flag: '🇨🇳' },
                { title: 'العربية', name: 'ar', flag: '🇸🇦' },
                { title: 'हिन्दी', name: 'hi', flag: '🇮🇳' },
              ],
              defaultLanguage: 'en',
            };
          `}
        </Script>
        
        {/* Inline Translation Function */}
        <Script id="translation-init" strategy="beforeInteractive">
          {`
            function TranslateInit() {
              if (typeof google === 'undefined' || !google.translate || !window.__GOOGLE_TRANSLATION_CONFIG__) {
                setTimeout(TranslateInit, 500);
                return;
              }
              try {
                new google.translate.TranslateElement(
                  {
                    pageLanguage: window.__GOOGLE_TRANSLATION_CONFIG__.defaultLanguage,
                    includedLanguages: window.__GOOGLE_TRANSLATION_CONFIG__.languages.map(lang => lang.name).join(','),
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                  },
                  'google_translate_element'
                );
              } catch (error) {
                console.error('Error initializing Google Translate:', error);
              }
            }
          `}
        </Script>
        
        {/* Google Translate Script */}
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=TranslateInit"
          strategy="afterInteractive"
        />
      </head>
      <body className={`dark:bg-gray-900`}>
        <Providers>
          <ThemeProvider>
            <SidebarProvider>
              <GlobalLoader />
              <div
                id="google_translate_element"
                style={{ display: "none" }}
              ></div>
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
