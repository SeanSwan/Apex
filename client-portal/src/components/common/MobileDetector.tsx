// client-portal/src/components/common/MobileDetector.tsx
/**
 * Mobile Detection Hook and Component
 * ==================================
 * Utilities for detecting mobile devices and screen properties
 */

import { useState, useEffect } from 'react';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
}

interface MobileDetectionResult {
  device: DeviceInfo;
  screen: ScreenInfo;
  network: NetworkInfo;
}

const getDeviceType = (width: number): DeviceInfo['type'] => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getNetworkInfo = (): NetworkInfo => {
  // Default values for when Network Information API is not available
  const defaultNetwork: NetworkInfo = {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100
  };

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100
    };
  }

  return defaultNetwork;
};

export const useMobileDetection = (): MobileDetectionResult => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const type = getDeviceType(width);
    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop'
    };
  });

  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: typeof window !== 'undefined' 
      ? (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      : 'landscape'
  }));

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => getNetworkInfo());

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const type = getDeviceType(width);
      
      setDeviceInfo({
        type,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop'
      });

      setScreenInfo({
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    const updateNetworkInfo = () => {
      setNetworkInfo(getNetworkInfo());
    };

    // Update on resize
    window.addEventListener('resize', updateDeviceInfo);
    
    // Update network info if connection changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
    }

    // Initial update
    updateDeviceInfo();
    updateNetworkInfo();

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return {
    device: deviceInfo,
    screen: screenInfo,
    network: networkInfo
  };
};

export default useMobileDetection;
