const express = require('express');
const feedController = require('../controllers/feed.controller');
const monetizationController = require('../controllers/monetization.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected routes (requires user session)
router.use(protect);

router.post('/', restrictTo('creator'), feedController.createPost);
router.get('/', feedController.getFeed);
router.get('/media/:mediaType', feedController.getMediaFeed);
router.get('/:postId/media/:mediaId', feedController.getPostMedia);
router.post('/:postId/unlock', monetizationController.unlockPost);
router.post('/:postId/like', feedController.likePost);
router.post('/:postId/comment', feedController.commentPost);
router.post('/:postId/report', feedController.reportPost);
router.post('/upload-url', restrictTo('creator'), feedController.getPresignedUpload);

module.exports = router;
