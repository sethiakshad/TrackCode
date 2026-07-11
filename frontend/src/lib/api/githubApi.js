import axiosInstance from '../axios';

export const getGithubStats = async (userId) => {
  try {
    const response = await axiosInstance.get(`/github/${userId}/stats`);
    return response.data;
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
