const express = require('express');
const callController = require('../controllers/call.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/initiate', callController.initiateCall);
router.post('/accept/:callLogId', callController.acceptCall);
router.post('/reject/:callLogId', callController.rejectCall);
router.post('/end', callController.endCall);
router.post('/heartbeat', callController.heartbeat);

module.exports = router;
