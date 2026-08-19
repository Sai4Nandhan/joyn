import { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { OnboardingTour } from '../onboarding/OnboardingTour.jsx';

export function Layout({ children, rightSidebar, clean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Left Sidebar - Fixed on Desktop, Slide-Over Drawer on Mobile */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Top Navbar */}
      <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* Main Content Area */}
      <div className="lg:ml-sidebar pt-16 flex min-h-[calc(100vh-4rem)]">
        {/* Center Content */}
        <main className="flex-1 min-w-0 px-3 py-4 sm:px-6 sm:py-6 w-full max-w-full overflow-x-hidden">
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
