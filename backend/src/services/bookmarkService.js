const prisma = require('../config/prisma');

/**
 * Bookmark a problem for the user.
 */
const addBookmark = async (userId, problemId) => {
  // Verify the problem exists
  const problem = await prisma.problems.findUnique({ where: { id: problemId } });
  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }

  // Upsert to avoid duplicate key errors
  return prisma.bookmarks.upsert({
    where: {
      user_id_problem_id: { user_id: userId, problem_id: problemId },
    },
    update: {},
    create: {
      user_id: userId,
      problem_id: problemId,
    },
    include: { problems: true },
  });
};

/**
 * Remove a bookmark for the user.
 */
const removeBookmark = async (userId, problemId) => {
  const existing = await prisma.bookmarks.findUnique({
    where: {
      user_id_problem_id: { user_id: userId, problem_id: problemId },
    },
  });

  if (!existing) {
    const error = new Error('Bookmark not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.bookmarks.delete({
    where: {
      user_id_problem_id: { user_id: userId, problem_id: problemId },
    },
  });
};

/**
 * List all bookmarks for a user with problem details.
 */
const listBookmarks = async (userId) => {
  const bookmarks = await prisma.bookmarks.findMany({
    where: { user_id: userId },
    include: { problems: true },
    orderBy: { created_at: 'desc' },
  });

  return bookmarks.map(b => ({
    problemId: b.problem_id,
    bookmarkedAt: b.created_at,
    title: b.problems.title,
    platform: b.problems.platform,
    difficulty: b.problems.difficulty,
    slug: b.problems.slug,
    url: b.problems.url,
    acceptance: b.problems.acceptance,
  }));
};

/**
 * List bookmarks filtered by platform and/or difficulty.
 */
const filterBookmarks = async (userId, { platform, difficulty }) => {
  const bookmarks = await prisma.bookmarks.findMany({
    where: {
      user_id: userId,
      problems: {
        ...(platform ? { platform } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
    },
    include: { problems: true },
    orderBy: { created_at: 'desc' },
  });

  return bookmarks.map(b => ({
    problemId: b.problem_id,
    bookmarkedAt: b.created_at,
    title: b.problems.title,
    platform: b.problems.platform,
    difficulty: b.problems.difficulty,
    slug: b.problems.slug,
    url: b.problems.url,
    acceptance: b.problems.acceptance,
  }));
};

module.exports = {
  addBookmark,
  removeBookmark,
  listBookmarks,
  filterBookmarks,
};
