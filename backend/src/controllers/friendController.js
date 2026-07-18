const friendService = require('../services/friendService');

const sendFriendRequest = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({
        status: 'error',
        message: 'Receiver username is required',
      });
    }

    const request = await friendService.sendFriendRequest(req.userId, username);
    res.status(201).json({
      status: 'success',
      message: 'Friend request sent successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({
        status: 'error',
        message: 'Request ID is required',
      });
    }

    await friendService.acceptFriendRequest(req.userId, requestId);
    res.json({
      status: 'success',
      message: 'Friend request accepted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({
        status: 'error',
        message: 'Request ID is required',
      });
    }

    await friendService.rejectFriendRequest(req.userId, requestId);
    res.json({
      status: 'success',
      message: 'Friend request rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({
        status: 'error',
        message: 'Friend ID is required',
      });
    }

    await friendService.removeFriend(req.userId, friendId);
    res.json({
      status: 'success',
      message: 'Friend removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getFriendList = async (req, res, next) => {
  try {
    const list = await friendService.getFriendList(req.userId);
    res.json({
      status: 'success',
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter is required',
      });
    }

    const results = await friendService.searchUsers(req.userId, q);
    res.json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const getFriendsActivity = async (req, res, next) => {
  try {
    const activity = await friendService.getFriendsActivity(req.userId);
    res.json({
      status: 'success',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await friendService.getLeaderboard(req.userId);
    res.json({
      status: 'success',
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendList,
  searchUsers,
  getFriendsActivity,
  getLeaderboard,
};
