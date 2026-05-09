import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "../components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Techbes",
  description: "Advanced Technician Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>

        {process.env.NODE_ENV === "production" && (
          <>
            <Script id="ga-domain-loader" strategy="afterInteractive">
              {`(function(){
  try{
    var mapping = {
      "techbes.co.in": "${process.env.NEXT_PUBLIC_GA_MAIN || ""}",
      "www.techbes.co.in": "${process.env.NEXT_PUBLIC_GA_MAIN || ""}",
      "skills.techbes.co.in": "${process.env.NEXT_PUBLIC_GA_SKILLS || ""}",
      "members.techbes.co.in": "${process.env.NEXT_PUBLIC_GA_MEMBERS || ""}",
      "localhost": "${process.env.NEXT_PUBLIC_GA_MAIN || ""}"
    };
    var host = window.location.hostname;
    var id = mapping[host] || mapping[host.replace(/^www\./,"")] || "${process.env.NEXT_PUBLIC_GA_MAIN || ""}";
    if(!id) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = window.gtag || gtag;
    gtag('js', new Date());
    gtag('config', id, { send_page_view: true });
  }catch(e){console.error('GA init error', e)}
})();`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
