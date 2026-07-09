const express = require('express');
const chatController = require('../controllers/chat.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/conversations', chatController.getConversations);
router.get('/messages/:receiverId', chatController.getMessages);
router.post('/message', chatController.sendMessage);
router.post('/message/:messageId/unlock', chatController.unlockMessage);
router.post('/mass-message', restrictTo('creator'), chatController.sendMassMessage);
router.delete('/message/:messageId', chatController.deleteMessage);
router.delete('/conversation/:userId', chatController.deleteConversation);

module.exports = router;
