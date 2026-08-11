const mongoose = require('mongoose');
const Product = require('../models/Product');
const StoreOrder = require('../models/StoreOrder');
const Transaction = require('../models/Transaction');
const CreatorProfile = require('../models/CreatorProfile');
const User = require('../models/User');
const walletService = require('../services/wallet.service');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Collect every media URL a product references (gallery + thumbnail) so it can
// be purged from cloud storage when the product is deleted.
const collectProductMediaUrls = (product) => {
  const urls = [];
  (product.media || []).forEach((m) => {
    if (m.url) urls.push(m.url);
  });
  if (product.thumbnailUrl) urls.push(product.thumbnailUrl);
  return urls;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------------------------------------------------------------------------
// CREATOR: product management
// ---------------------------------------------------------------------------

// List the creator's own products (with search/sort/filter)
exports.getMyProducts = catchAsync(async (req, res, next) => {
  const { search, status, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

  const query = { creatorId: req.user._id };
  if (search && search.trim()) {
    query.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  if (status && ['active', 'draft', 'out_of_stock'].includes(status)) {
    query.status = status;
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  else if (sort === 'price_asc') sortOption = { priceCoins: 1 };
  else if (sort === 'price_desc') sortOption = { priceCoins: -1 };
  else if (sort === 'popular') sortOption = { soldCount: -1 };

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOption).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Create a product
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name, description, priceCoins, inventory, status, category,
    media, thumbnailUrl, isDigital, deliveryNote
  } = req.body;

  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Please provide a product name'));
  }
  if (priceCoins === undefined || Number(priceCoins) < 0) {
    return next(new ApiError(400, 'Please provide a valid coin price'));
  }

  const product = await Product.create({
    creatorId: req.user._id,
    name: name.trim(),
    description: description || '',
    priceCoins: Number(priceCoins),
    inventory: inventory === undefined || inventory === null ? null : Math.max(0, Number(inventory)),
    status: status || 'active',
    category: category || 'Merchandise',
    media: media || [],
    thumbnailUrl: thumbnailUrl || (media && media[0] ? media[0].url : ''),
    isDigital: !!isDigital,
    deliveryNote: deliveryNote || ''
  });

  res.status(201).json({
    status: 'success',
    product
  });
});

// Update a product (owner only)
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({ _id: productId, creatorId: req.user._id });
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  const {
    name, description, priceCoins, inventory, status, category,
    media, thumbnailUrl, isDigital, deliveryNote
  } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (description !== undefined) product.description = description;
  if (priceCoins !== undefined) product.priceCoins = Math.max(0, Number(priceCoins));
  if (inventory !== undefined) {
    product.inventory = inventory === null ? null : Math.max(0, Number(inventory));
  }
  if (status !== undefined && ['active', 'draft', 'out_of_stock'].includes(status)) {
    product.status = status;
  }
  if (category !== undefined) product.category = category;
  if (media !== undefined) product.media = media;
  if (thumbnailUrl !== undefined) product.thumbnailUrl = thumbnailUrl;
  else if (media !== undefined && media[0]) product.thumbnailUrl = media[0].url;
  if (isDigital !== undefined) product.isDigital = !!isDigital;
  if (deliveryNote !== undefined) product.deliveryNote = deliveryNote;

  await product.save();

  res.status(200).json({
    status: 'success',
    product
  });
});

// Delete a product (owner only) — also removes its images from cloud storage.
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({ _id: productId, creatorId: req.user._id });
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  await awsService.deleteS3Media(collectProductMediaUrls(product));
  await Product.findByIdAndDelete(productId);

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully'
  });
});

// ---------------------------------------------------------------------------
// CREATOR: store analytics
// ---------------------------------------------------------------------------

// Store overview: stats, products, top sellers, recent orders, quick stats
exports.getStoreOverview = catchAsync(async (req, res, next) => {
  const creatorId = req.user._id;
  const { period = 'All Time' } = req.query;
  const { getPeriodStart } = require('../utils/periodRange');
  const periodStart = getPeriodStart(period);

  const productQuery = { creatorId };
  const orderQuery = { creatorId };
  const txQuery = { receiverId: creatorId, type: 'store_purchase', status: { $in: ['completed', 'refunded'] } };
  if (periodStart) {
    orderQuery.createdAt = { $gte: periodStart };
    txQuery.createdAt = { $gte: periodStart };
  }

  const [products, orders] = await Promise.all([
    Product.find(productQuery),
    StoreOrder.find(orderQuery).populate('buyerId', 'username displayName avatarUrl email').sort({ createdAt: -1 })
  ]);

  const orderIds = orders.map((o) => o._id);

  // Revenue = sum of completed store_purchase transactions to this creator
  const revenueAgg = await Transaction.aggregate([
    {
      $match: txQuery
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amountCoins' },
        count: { $sum: 1 }
      }
    }
  ]);

  const grossRevenue = revenueAgg[0] ? revenueAgg[0].total : 0;

  const totalOrders = orders.filter((o) => ['completed', 'fulfilled'].includes(o.status)).length;
  const totalSold = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length;
  const inventoryItems = products.reduce((sum, p) => sum + (p.inventory || 0), 0);

  // Top selling products within the selected period (by quantity ordered)
  const soldByProduct = {};
  orders.forEach((o) => {
    const pid = o.productId ? (o.productId._id ? o.productId._id.toString() : String(o.productId)) : '';
    if (pid) soldByProduct[pid] = (soldByProduct[pid] || 0) + (o.quantity || 1);
  });
  const productById = {};
  products.forEach((p) => { productById[p._id.toString()] = p; });

  // Top selling products by soldCount
  const topSellingProducts = Object.entries(soldByProduct)
    .map(([pid, sold]) => {
      const p = productById[pid];
      return p ? {
        id: p._id,
        name: p.name,
        sold,
        revenue: p.priceCoins * sold,
        thumbnail: p.thumbnailUrl || (p.media && p.media[0] ? p.media[0].url : ''),
        rank: 0,
        priceCoins: p.priceCoins
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const recentOrders = orders.slice(0, 10).map((o) => ({
    id: o._id,
    productName: o.productId ? o.productId.name : 'Product',
    customer: o.buyerId ? (o.buyerId.displayName || o.buyerId.username) : 'User',
    avatar: o.buyerId ? (o.buyerId.avatarUrl || '') : '',
    date: o.createdAt,
    amountCoins: o.amountCoins,
    status: o.status,
    quantity: o.quantity
  }));

  res.status(200).json({
    status: 'success',
    storeStats: {
      revenueCoins: grossRevenue,
      totalOrders,
      totalSold,
      activeProducts,
      productsTotal: products.length,
      draftCount,
      outOfStockCount,
      inventoryItems
    },
    products,
    topSellingProducts,
    recentOrders,
    totalOrdersCount: orders.length
  });
});

// ---------------------------------------------------------------------------
// CREATOR: order management
// ---------------------------------------------------------------------------

// List orders for the creator's store (paginated)
exports.getStoreOrders = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

  const query = { creatorId: req.user._id };
  if (status && ['completed', 'pending', 'fulfilled', 'cancelled', 'refunded'].includes(status)) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    StoreOrder.find(query)
      .populate('productId', 'name priceCoins thumbnailUrl')
      .populate('buyerId', 'username displayName avatarUrl email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    StoreOrder.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    orders: orders.map((o) => ({
      _id: o._id,
      productName: o.productId ? o.productId.name : 'Product',
      productThumb: o.productId ? (o.productId.thumbnailUrl || '') : '',
      buyer: o.buyerId ? {
        _id: o.buyerId._id,
        name: o.buyerId.displayName || o.buyerId.username,
        username: o.buyerId.username,
        avatar: o.buyerId.avatarUrl || '',
        email: o.buyerId.email
      } : null,
      quantity: o.quantity,
      amountCoins: o.amountCoins,
      status: o.status,
      fulfillmentNote: o.fulfillmentNote,
      createdAt: o.createdAt
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Update order status (fulfill / cancel)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await StoreOrder.findOne({ _id: orderId, creatorId: req.user._id });
  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }
  if (!['pending', 'fulfilled', 'cancelled'].includes(status)) {
    return next(new ApiError(400, 'Invalid order status'));
  }

  order.status = status;
  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    order
  });
});

// ---------------------------------------------------------------------------
// FAN: browse & purchase
// ---------------------------------------------------------------------------

// Public storefront: active products of a creator
exports.getCreatorStore = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;
  if (!isValidObjectId(creatorId)) {
    return next(new ApiError(400, 'Invalid creator id'));
  }

  const products = await Product.find({ creatorId, status: 'active' }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    products
  });
});

// Fan purchases a product (charged in coins via wallet service)
exports.purchaseProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }
  if (product.status !== 'active') {
    return next(new ApiError(400, 'This product is not available for purchase'));
  }
  if (product.creatorId.toString() === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot purchase your own product'));
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const totalCoins = product.priceCoins * qty;

  // Prevent purchasing from a blocked creator or a creator who blocked you
  if (req.user.blockedUsers.includes(product.creatorId.toString())) {
    return next(new ApiError(400, 'You cannot purchase from a user you have blocked'));
  }
  const blockedByCreator = await User.exists({ _id: product.creatorId, blockedUsers: req.user._id });
  if (blockedByCreator) {
    return next(new ApiError(400, 'You cannot purchase from this creator'));
  }

  // Check inventory (null = unlimited)
  if (product.inventory !== null && product.inventory < qty) {
    return next(new ApiError(400, 'Insufficient inventory for this product'));
  }

  // Charge via atomic wallet transfer (commission-aware)
  const transaction = await walletService.transferCoins(
    req.user._id,
    product.creatorId,
    totalCoins,
    'store_purchase',
    product._id
  );

  // Record the order + update product sold count (atomic to avoid overselling)
  const order = await StoreOrder.create({
    productId: product._id,
    creatorId: product.creatorId,
    buyerId: req.user._id,
    quantity: qty,
    amountCoins: totalCoins,
    status: 'completed',
    transactionId: transaction._id
  });

  await Product.updateOne(
    { _id: product._id, $or: [{ inventory: null }, { inventory: { $gte: qty } }] },
    { $inc: { soldCount: qty, ...(product.inventory !== null ? { inventory: -qty } : {}) } }
  );

  res.status(200).json({
    status: 'success',
    order,
    transaction,
    message: `Purchased ${qty} x ${product.name} for ${totalCoins} coins`
  });
});

// Fan's purchase history
exports.getMyPurchases = catchAsync(async (req, res, next) => {
  const orders = await StoreOrder.find({ buyerId: req.user._id })
    .populate('productId', 'name priceCoins thumbnailUrl')
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    orders: orders.map((o) => ({
      _id: o._id,
      productName: o.productId ? o.productId.name : 'Product',
      productThumb: o.productId ? (o.productId.thumbnailUrl || '') : '',
      priceCoins: o.amountCoins,
      quantity: o.quantity,
      status: o.status,
      creator: o.creatorId ? {
        _id: o.creatorId._id,
        name: o.creatorId.displayName || o.creatorId.username,
        avatar: o.creatorId.avatarUrl || ''
      } : null,
      createdAt: o.createdAt
    }))
  });
});

// ---------------------------------------------------------------------------
// ADMIN: store moderation
// ---------------------------------------------------------------------------

// All products across the platform (with search)
exports.adminGetProducts = catchAsync(async (req, res, next) => {
  const { search, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

  const query = {};
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { category: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
    ];
  }
  if (status && ['active', 'draft', 'out_of_stock'].includes(status)) {
    query.status = status;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('creatorId', 'username displayName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// All orders across the platform (with search)
exports.adminGetOrders = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

  const query = {};
  if (status && ['completed', 'pending', 'fulfilled', 'cancelled', 'refunded'].includes(status)) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    StoreOrder.find(query)
      .populate('productId', 'name priceCoins thumbnailUrl')
      .populate('buyerId', 'username displayName avatarUrl email')
      .populate('creatorId', 'username displayName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    StoreOrder.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Admin delete product
exports.adminDeleteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  await awsService.deleteS3Media(collectProductMediaUrls(product));
  await Product.findByIdAndDelete(productId);

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully'
  });
});
