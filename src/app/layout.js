import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ARproject Content Factory',
  description: 'AI Autonomous Content Factory Dashboard',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
