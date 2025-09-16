import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from './use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface SwipeConfig {
  minDistance: number;
  maxTime: number;
  preventVerticalScroll: boolean;
}

const defaultConfig: SwipeConfig = {
  minDistance: 50,
  maxTime: 300,
  preventVerticalScroll: true,
};

export const useSwipeNavigation = (config: Partial<SwipeConfig> = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const swipeConfig = { ...defaultConfig, ...config };
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeDirectionRef = useRef<'left' | 'right' | null>(null);

  // Define swipeable routes based on user role
  const getSwipeableRoutes = useCallback(() => {
    const baseRoutes = ['/feed', '/terrain', '/projects'];
    
    // Add financier route if user has appropriate role
    if (user?.user_metadata?.role === 'financier' || user?.user_metadata?.role === 'admin') {
      baseRoutes.push('/financier');
    }
    
    return baseRoutes;
  }, [user]);

  const getCurrentRouteIndex = useCallback(() => {
    const routes = getSwipeableRoutes();
    return routes.indexOf(location.pathname);
  }, [location.pathname, getSwipeableRoutes]);

  const navigateToRoute = useCallback((direction: 'left' | 'right') => {
    const routes = getSwipeableRoutes();
    const currentIndex = getCurrentRouteIndex();
    
    if (currentIndex === -1) return null; // Current route not swipeable
    
    let nextIndex: number;
    if (direction === 'right') {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1;
    }
    
    // Check bounds
    if (nextIndex < 0 || nextIndex >= routes.length) return null;
    
    const nextRoute = routes[nextIndex];
    navigate(nextRoute);
    
    return direction;
  }, [navigate, getCurrentRouteIndex, getSwipeableRoutes]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    swipeDirectionRef.current = null;
  }, [isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Prevent vertical scroll if horizontal swipe is detected
    if (swipeConfig.preventVerticalScroll && Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }, [isMobile, swipeConfig.preventVerticalScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Check if it's a valid swipe
    if (
      Math.abs(deltaX) > swipeConfig.minDistance &&
      Math.abs(deltaX) > deltaY && // More horizontal than vertical
      deltaTime < swipeConfig.maxTime
    ) {
      const direction = deltaX > 0 ? 'left' : 'right';
      const navigatedDirection = navigateToRoute(direction);
      swipeDirectionRef.current = navigatedDirection;
    }
    
    touchStartRef.current = null;
  }, [isMobile, swipeConfig, navigateToRoute]);

  useEffect(() => {
    if (!isMobile) return;
    
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isSwipeable: getCurrentRouteIndex() !== -1,
    swipeDirection: swipeDirectionRef.current,
    canSwipeLeft: getCurrentRouteIndex() > 0,
    canSwipeRight: getCurrentRouteIndex() < getSwipeableRoutes().length - 1,
  };
};