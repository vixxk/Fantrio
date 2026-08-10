const express = require('express');
const storeController = require('../controllers/store.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// ---------------------------------------------------------------------------
// Fan-facing storefront
// ---------------------------------------------------------------------------
router.get('/creators/:creatorId/products', storeController.getCreatorStore);
router.get('/my/purchases', protect, storeController.getMyPurchases);
router.post('/products/:productId/purchase', protect, storeController.purchaseProduct);

// ---------------------------------------------------------------------------
// Creator store management
// ---------------------------------------------------------------------------
router.use(protect);
router.get('/my/products', restrictTo('creator'), storeController.getMyProducts);
router.post('/my/products', restrictTo('creator'), storeController.createProduct);
router.put('/my/products/:productId', restrictTo('creator'), storeController.updateProduct);
router.delete('/my/products/:productId', restrictTo('creator'), storeController.deleteProduct);
router.get('/my/overview', restrictTo('creator'), storeController.getStoreOverview);
router.get('/my/orders', restrictTo('creator'), storeController.getStoreOrders);
router.put('/my/orders/:orderId/status', restrictTo('creator'), storeController.updateOrderStatus);

module.exports = router;
