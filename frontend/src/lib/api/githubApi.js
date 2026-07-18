import axiosInstance from '../axios';

export const getGithubStats = async (userId) => {
  try {
    const response = await axiosInstance.get(`/github/profile`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching github stats:', error);
    // Return empty fallback instead of crashing
    return {
      languages: [],
      commitHistory: [],
      repos: [],
      calendar: []
    };
  }
};
