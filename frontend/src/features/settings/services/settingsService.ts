import api from '@/shared/api/api';

export interface UserSetting {
  id: string;
  aiAnalysisStyle: 'summary' | 'expert' | 'friendly';
  autoReportEnabled: boolean;
  theme: 'light' | 'dark';
  chartColorStyle: 'kr' | 'us';
  alertThreshold: number;
  communityAlertEnabled: boolean;
  aiAlertEnabled: boolean;
  userId: string;
}

export const settingsService = {
  getSettings: async () => {
    console.log('[SettingsService] Fetching settings...');
    try {
      const response = await api.get<UserSetting>('/user-settings');
      console.log('[SettingsService] Raw response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[SettingsService] Fetch error:', error);
      throw error;
    }
  },
  updateSettings: async (updateData: Partial<UserSetting>) => {
    console.log('[SettingsService] Updating settings:', updateData);
    const response = await api.patch<UserSetting>('/user-settings', updateData);
    return response.data;
  },
};
