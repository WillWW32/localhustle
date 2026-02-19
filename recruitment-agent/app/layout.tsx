import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LocalHustle',
  description: 'Get your athlete recruited automatically',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
