import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";

export const metadata = {
  title: "Composable AI Mock Interviewer",
  description: "Composable AI mock interview practice with adaptive flow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div>
              <p className="eyebrow">Composable AI Mock Interviewer</p>
              <h1>Adaptive Interview Practice</h1>
              <p className="subhead">
                Build your interview flow from composable blocks: role selection,
                adaptive questions, memory, evaluation, and feedback.
              </p>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
