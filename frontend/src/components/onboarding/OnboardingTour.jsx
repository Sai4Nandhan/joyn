import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PlusCircle, User, ShieldCheck, Compass, Check, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const TOUR_STEPS = [
  {
    id: 'create-activity',
    targetSelector: '[data-tour="create-activity"]',
    title: 'Create your first activity',
    description: 'Create your first activity here. Choose what you want to do, where, and when — then invite people nearby to join.',
    icon: PlusCircle,
    preferredPlacement: 'right',
  },
  {
    id: 'trust-score',
    targetSelector: '[data-tour="trust-score"]',
    title: 'Build your Trust Score & Profile',
    description: "Your profile and Trust Score help other people understand who they're joining. Build your reputation through good participation and hosting.",
    tip: '🛡️ Upload photos & verify your identity to boost your Trust Score!',
    icon: ShieldCheck,
    preferredPlacement: 'right',
  },
  {
    id: 'discover',
    targetSelector: '[data-tour="discover"]',
    title: 'Discover Nearby Activities',
    description: 'Discover real activities created by people nearby. Your selected location controls which activities you see.',
    icon: Compass,
    preferredPlacement: 'right',
  },
];

function calculateTooltipPlacement(targetRect, isMobile) {
  if (isMobile || !targetRect) return { style: undefined, arrowSide: 'left' };

  const cardWidth = 360;
  const cardHeight = 260;
  const padding = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = targetRect.right + 20;
  let top = targetRect.top - 10;
  let arrowSide = 'left';

  // Check right boundary collision
  if (left + cardWidth > vw - padding) {
    if (targetRect.left - cardWidth - 20 >= padding) {
      left = targetRect.left - cardWidth - 20;
      arrowSide = 'right';
    } else {
      left = Math.max(padding, vw - cardWidth - padding);
      if (targetRect.bottom + cardHeight + 16 <= vh - padding) {
        top = targetRect.bottom + 16;
        arrowSide = 'top';
      } else if (targetRect.top - cardHeight - 16 >= padding) {
        top = targetRect.top - cardHeight - 16;
        arrowSide = 'bottom';
      }
    }
  }

  // Strict viewport boundary clamping
  left = Math.max(padding, Math.min(vw - cardWidth - padding, left));
  top = Math.max(padding, Math.min(vh - cardHeight - padding, top));

  return {
    style: { top: `${top}px`, left: `${left}px` },
    arrowSide,
  };
}

export function OnboardingTour() {
  const { user, completeOnboarding, isJustRegistered } = useAuth();
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2 = Tour Steps
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const retryTimerRef = useRef(null);

  // Responsive breakpoint listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Target DOM element locator & smooth auto-scroller
  const locateAndScrollTarget = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length) {
      setTargetRect(null);
      return;
    }

    const step = TOUR_STEPS[currentStep];
    let attempts = 0;

    const findTarget = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        // Scroll element into view smoothly if not visible
        const rect = el.getBoundingClientRect();
        const isInViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isInViewport) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }

        // Re-read rect after scroll attempt
        const updatedRect = el.getBoundingClientRect();
        setTargetRect({
          top: updatedRect.top,
          left: updatedRect.left,
          width: updatedRect.width,
          height: updatedRect.height,
          bottom: updatedRect.bottom,
          right: updatedRect.right,
        });
      } else if (attempts < 5) {
        attempts++;
        retryTimerRef.current = setTimeout(findTarget, 100);
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
  }, [currentStep]);

  useEffect(() => {
    if (!user || user.hasCompletedOnboarding || !isJustRegistered) return;

    locateAndScrollTarget();

    const handleUpdate = () => locateAndScrollTarget();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [user, currentStep, isJustRegistered, locateAndScrollTarget]);

  // ESC Key Listener
  useEffect(() => {
    if (!user || user.hasCompletedOnboarding || !isJustRegistered) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, isJustRegistered]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleDismiss = async () => {
    if (completeOnboarding) {
      await completeOnboarding();
    }
  };

  // Render check
  if (!user || user.hasCompletedOnboarding || !isJustRegistered) {
    return null;
  }

  const currentStepData = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const { style: posStyle, arrowSide } = calculateTooltipPlacement(targetRect, isMobile);

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="First-time user onboarding tour"
        className="fixed inset-0 z-50 overflow-hidden font-sans pointer-events-none"
      >
        {/* Dimmed Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-[#0D1026]/75 backdrop-blur-[2px] transition-all pointer-events-auto"
        />

        {/* Target Element Spotlight & Glow Ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              top: `${targetRect.top - 6}px`,
              left: `${targetRect.left - 6}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
            }}
            className="absolute rounded-xl pointer-events-none ring-2 ring-[#7c3aed] ring-offset-2 ring-offset-[#0D1026] shadow-[0_0_30px_rgba(124,58,237,0.7)] bg-white/10 dark:bg-white/5 z-50 transition-all duration-300"
          />
        )}

        {/* Interactive Guided Tour Tooltip Card */}
        {currentStepData && (
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={posStyle}
            className={`fixed z-50 w-full max-w-[340px] sm:max-w-[360px] p-5 rounded-2xl bg-[#0D1026] border border-purple-500/30 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-auto ${
              isMobile
                ? 'bottom-6 left-1/2 -translate-x-1/2'
                : 'left-6 bottom-6 sm:left-auto sm:bottom-auto'
            }`}
          >
            {/* Directional Pointer Arrow (Desktop Only) */}
            {!isMobile && targetRect && (
              <div
                className={`hidden sm:block absolute w-4 h-4 bg-[#0D1026] rotate-45 ${
                  arrowSide === 'right'
                    ? '-right-2 top-6 border-r border-t border-purple-500/30'
                    : arrowSide === 'top'
                    ? '-top-2 left-8 border-t border-l border-purple-500/30'
                    : arrowSide === 'bottom'
                    ? '-bottom-2 left-8 border-b border-r border-purple-500/30'
                    : '-left-2 top-6 border-l border-b border-purple-500/30'
                }`}
              />
            )}

            {/* Header & Step Dots Indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#db2777] text-white shadow-md">
                  <currentStepData.icon className="h-4 w-4" />
                </span>
                <span className="text-2xs font-bold uppercase tracking-wider text-purple-300">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((step, idx) => (
                  <span
                    key={step.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-4 bg-gradient-to-r from-[#7c3aed] to-[#db2777]'
                        : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Close / Skip (ESC) */}
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 ml-1"
                title="Skip Tour (ESC)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <h3 className="text-base font-bold text-white mb-1.5 font-display">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {currentStepData.description}
            </p>

            {currentStepData.tip && (
              <div className="mb-4 rounded-xl bg-purple-950/50 border border-purple-500/30 px-3 py-2 text-2xs font-medium text-purple-200 flex items-center gap-1.5 shadow-inner">
                <span>{currentStepData.tip}</span>
              </div>
            )}

            {/* Navigation Actions (Back / Skip / Next / Finish) */}
            <div className="flex items-center justify-between pt-3 border-t border-purple-900/40">
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-2xs font-semibold text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-2xs font-semibold text-slate-400 hover:text-white transition-colors px-1"
                >
                  Skip
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#db2777] to-[#ea580c] text-xs font-bold text-white shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                {isLastStep ? (
                  <>
                    Finish <Check className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
