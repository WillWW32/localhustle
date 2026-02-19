import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LocalHustle - Athlete Recruitment',
  description: 'Get your athlete recruited automatically. Connect with coaches across the country.',
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {children}
    </div>
  );
}
