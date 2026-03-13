import api from '@/shared/api/api';

export const usersService = {
  changePassword: async (passwordData: { oldPassword: string, newPassword: string }) => {
    const response = await api.patch('/users/change-password', passwordData);
    return response.data;
  },
};
