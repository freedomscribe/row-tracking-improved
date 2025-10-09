import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppProviders from '@/components/providers/AppProviders';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ROW Tracking - Right-of-Way Management System',
  description: 'Professional right-of-way tracking and management for transmission line projects',
  keywords: ['ROW', 'right-of-way', 'transmission', 'land management', 'GIS'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

