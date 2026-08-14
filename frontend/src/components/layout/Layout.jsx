import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { OnboardingTour } from '../onboarding/OnboardingTour.jsx';

export function Layout({ children, rightSidebar, clean }) {
  if (clean) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-[#090A1A] transition-colors duration-200">
      {/* First-time User Onboarding Tour */}
      <OnboardingTour />

      {/* Left Sidebar - Fixed */}
      <Sidebar />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="ml-sidebar pt-16 flex">
        {/* Center Content */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {children}
        </main>

        {/* Right Sidebar */}
        {rightSidebar && (
          <aside className="hidden xl:block w-right-sidebar flex-shrink-0 px-4 py-6 border-l border-ink-100 dark:border-purple-950/20">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
