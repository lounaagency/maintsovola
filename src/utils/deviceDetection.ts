/**
 * Détecte si l'appareil est un mobile (smartphone ou tablette)
 */
export const isMobile = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/.test(ua);
};

/**
 * Détermine la plateforme actuelle ('ios' | 'android' | 'web')
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const ua = navigator.userAgent.toLowerCase();

  // Vérifie Android
  if (/android/.test(ua)) {
    return 'android';
  }

  // Vérifie iOS (iPhone, iPad, iPod) sans utiliser MSStream
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }

  return 'web';
};

/**
 * Vérifie si l'utilisateur est sur iOS
 */
export const isIOS = (): boolean => getPlatform() === 'ios';

/**
 * Vérifie si l'utilisateur est sur Android
 */
export const isAndroid = (): boolean => getPlatform() === 'android';

/* export const isMobile = (): boolean => { // C'est très obsolète
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/android/i.test(ua)) {
    return 'android';
  }

  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }

  return 'web';
};

export const isIOS = (): boolean => getPlatform() === 'ios';
export const isAndroid = (): boolean => getPlatform() === 'android'; */