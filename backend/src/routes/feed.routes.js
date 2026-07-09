const express = require('express');
const feedController = require('../controllers/feed.controller');
const monetizationController = require('../controllers/monetization.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected routes (requires user session)
router.use(protect);

router.post('/', restrictTo('creator'), feedController.createPost);
router.get('/', feedController.getFeed);
router.get('/hashtags', feedController.getTrendingHashtags);
router.get('/media/:mediaType', feedController.getMediaFeed);
router.get('/:postId/media/:mediaId', feedController.getPostMedia);
router.post('/:postId/unlock', monetizationController.unlockPost);
router.post('/:postId/like', feedController.likePost);
router.post('/:postId/comment', feedController.commentPost);
router.delete('/:postId/comment/:commentId', feedController.deleteComment);
router.post('/:postId/share', feedController.sharePost);
router.post('/:postId/report', feedController.reportPost);
router.post('/upload-url', restrictTo('creator'), feedController.getPresignedUpload);
router.put('/:postId', restrictTo('creator'), feedController.updatePost);
router.delete('/:postId', restrictTo('creator'), feedController.deletePost);

module.exports = router;
