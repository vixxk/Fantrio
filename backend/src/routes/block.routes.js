const express = require('express');
const blockController = require('../controllers/block.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', blockController.getBlockedUsers);
router.post('/:userId', blockController.blockUser);
router.delete('/:userId', blockController.unblockUser);

module.exports = router;
