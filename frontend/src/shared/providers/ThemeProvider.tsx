'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsService, UserSetting } from '@/features/settings/services/settingsService';

interface ThemeContextType {
  settings: UserSetting | undefined;
}

const ThemeContext = createContext<ThemeContextType>({ settings: undefined });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    retry: 1,
  });

  useEffect(() => {
    if (settings?.theme) {
      const root = window.document.documentElement;
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings?.theme]);

  // Default values for components if settings aren't loaded yet
  const defaultSettings: UserSetting = {
    id: '',
    aiAnalysisStyle: 'expert',
    autoReportEnabled: true,
    theme: 'light',
    chartColorStyle: 'kr',
    alertThreshold: 3.0,
    communityAlertEnabled: true,
    aiAlertEnabled: false,
    userId: '',
  };

  return (
    <ThemeContext.Provider value={{ settings: settings || defaultSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}
