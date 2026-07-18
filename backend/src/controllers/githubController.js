const githubService = require('../services/githubService');

const connectGitHub = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({
        status: 'error',
        message: 'GitHub username is required',
      });
    }

    const profile = await githubService.connectGitHub(req.userId, username);
    res.json({
      status: 'success',
      message: 'GitHub profile connected and synced successfully',
      data: {
        ...profile,
        github_id: profile.github_id.toString(),
      },
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        status: 'error',
        message: 'GitHub user not found',
      });
    }
    next(error);
  }
};

const getGitHubProfile = async (req, res, next) => {
  try {
    const profile = await githubService.getGitHubProfile(req.userId);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'GitHub profile not connected',
      });
    }
    res.json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const syncGitHub = async (req, res, next) => {
  try {
    const profile = await githubService.getGitHubProfile(req.userId);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'GitHub profile not connected',
      });
    }

    await githubService.syncUserRepositories(profile.id, profile.username);
    const updatedProfile = await githubService.getGitHubProfile(req.userId);

    res.json({
      status: 'success',
      message: 'GitHub sync completed successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectGitHub,
  getGitHubProfile,
  syncGitHub,
};
