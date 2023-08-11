import type { Metadata } from "next";
import App from "./components/App/App";
import ThemeRegistry from "./components/ThemeRegistry/ThemeRegistry";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://coipond.martek.dev"),
  title: "The CoI Pond | Captain of Industry blueprints",
  description: "Captain of Industry blueprints and other tools.",
  openGraph: {
    title: "The CoI Pond | Captain of Industry blueprints",
    description: "Captain of Industry blueprints and other tools.",
    url: "https://coipond.martek.dev",
    siteName: "The CoI Pond",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "The CoI Pond | Captain of Industry blueprints",
    description: "Captain of Industry blueprints and other tools.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <App>{children}</App>
        </ThemeRegistry>
      </body>
    </html>
  );
}
