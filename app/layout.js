import { Source_Serif_4, Caveat } from 'next/font/google';
import './globals.css';

const serif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--serif' });
const hand = Caveat({ subsets: ['latin'], variable: '--hand' });

export const metadata = {
  title: 'Moving Charges and Magnetism — an interactive book',
  description: 'NCERT Class 12 Physics, Chapter 4, as an interactive open book: predict, lift the flap, play with the figures.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
