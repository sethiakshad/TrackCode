const bookmarkService = require('../services/bookmarkService');

const addBookmark = async (req, res, next) => {
  try {
    const { problemId } = req.body;
    if (!problemId) {
      return res.status(400).json({
        status: 'error',
        message: 'problemId is required',
      });
    }

    const data = await bookmarkService.addBookmark(req.userId, problemId);
    res.status(201).json({
      status: 'success',
      message: 'Problem bookmarked successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const removeBookmark = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    await bookmarkService.removeBookmark(req.userId, problemId);
    res.json({
      status: 'success',
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

const listBookmarks = async (req, res, next) => {
  try {
    const data = await bookmarkService.listBookmarks(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const filterBookmarks = async (req, res, next) => {
  try {
    const { platform, difficulty } = req.query;
    const data = await bookmarkService.filterBookmarks(req.userId, { platform, difficulty });
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBookmark,
  removeBookmark,
  listBookmarks,
  filterBookmarks,
};
