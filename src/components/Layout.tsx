
import React from "react";
import Navbar from "./Navbar";
import { useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { swipeDirection } = useSwipeNavigation();

  // Enhanced page variants with swipe-aware animations
  const getPageVariants = () => {
    if (!isMobile || !swipeDirection) {
      return {
        initial: { opacity: 0, y: 8 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -8 },
      };
    }

    // Swipe-based animations
    if (swipeDirection === 'right') {
      // Swiped right (going to next page)
      return {
        initial: { opacity: 0, x: '100%' },
        in: { opacity: 1, x: 0 },
        out: { opacity: 0, x: '-100%' },
      };
    } else {
      // Swiped left (going to previous page)
      return {
        initial: { opacity: 0, x: '-100%' },
        in: { opacity: 1, x: 0 },
        out: { opacity: 0, x: '100%' },
      };
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: isMobile && swipeDirection ? 0.25 : 0.3,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 pb-4 pt-[104px] overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={getPageVariants()}
            transition={pageTransition}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
