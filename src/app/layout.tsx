import "globals.css";
import { TopNavBar } from "components/TopNavBar";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "ChatFolio - Free Open-source AI Resume Builder and Parser",
  description:
    "ChatFolio is a free, open-source, and powerful AI resume builder that allows anyone to create a modern professional resume in 3 simple steps. For those who have an existing resume, ChatFolio also provides a resume parser to help test and confirm its ATS readability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body className="bg-card text-primary-fg">
        <TopNavBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
