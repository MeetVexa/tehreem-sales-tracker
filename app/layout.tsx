import './globals.css';

export const metadata = {
  title: 'Fieldnote — Tehreem Hussain Sales Tracker',
  description: 'A simple, private sales workspace for tracking leads and verified payments. Entries are saved in this browser and are not connected to a CRM.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
