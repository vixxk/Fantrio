import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  DollarSign, ShoppingCart, Package, Archive,
  Plus, MoreVertical, X, Loader2, Trash2, Pencil
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import styles from './StorePage.module.css';

const iconMap = { revenue: DollarSign, orders: ShoppingCart, products: Package, inventory: Archive };

// Product category and status options (matching backend Product model)
const PRODUCT_CATEGORIES = ['Merchandise', 'Apparel', 'Digital', 'Experiences', 'Other'];
const PRODUCT_STATUSES = ['active', 'draft', 'out_of_stock'];

const fmtCoins = (n) => `${Number(n || 0).toLocaleString()} coins`;
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const StorePage = () => {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [period, setPeriod] = useState('All Time');
  const [data, setData] = useState({
    storeStats: {},
    products: [],
    topSellingProducts: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', priceCoins: '10', inventory: '', status: 'active', category: 'Merchandise', isDigital: false });
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  // Delete flow — shared confirm dialog state machine
  const {
    target: deleteTarget,
    open: openDelete,
    close: closeDelete,
    confirm: confirmDeleteProduct,
    deleting,
  } = useConfirmDelete({
    onConfirm: (product) => api.delete(`/store/my/products/${product._id}`),
    successMessage: 'Product deleted successfully',
    errorMessage: 'Failed to delete product. Please try again.',
    onSuccess: () => loadStore(),
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  // Open the delete confirmation popup
  const handleDeleteProduct = (product) => {
    setOpenMenuId(null);
    if (!product._id) return;
    openDelete(product);
  };

  const loadStore = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/store/my/overview?period=${encodeURIComponent(period)}`);
      if (res.status === 'success') {
        setData({
          storeStats: res.storeStats || {},
          products: res.products || [],
          topSellingProducts: res.topSellingProducts || [],
          recentOrders: res.recentOrders || []
        });
      }
    } catch (err) {
      console.error('Failed to load store:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadStore());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const storeStats = [
    { id: 'revenue', label: 'Total Revenue', value: fmtCoins(data.storeStats.revenueCoins), change: 'All time', changeType: 'positive', period: '', icon: 'revenue', color: '#e10075' },
    { id: 'orders', label: 'Orders', value: String(data.storeStats.totalOrders || 0), change: 'All time', changeType: 'positive', period: '', icon: 'orders', color: '#8b5cf6' },
    { id: 'products', label: 'Products', value: String(data.storeStats.productsTotal || 0), subtitle: `${data.storeStats.activeProducts || 0} active`, icon: 'products', color: '#10b981' },
    { id: 'inventory', label: 'Inventory Items', value: String(data.storeStats.inventoryItems || 0), subtitle: 'In stock', icon: 'inventory', color: '#06b6d4' }
  ];

  const storeTabs = [
    { id: 'all', label: 'All Products', count: data.products.length },
    { id: 'active', label: 'Active', count: data.storeStats.activeProducts || 0 },
    { id: 'draft', label: 'Draft', count: data.storeStats.draftCount || 0 },
    { id: 'outOfStock', label: 'Out of Stock', count: data.storeStats.outOfStockCount || 0 }
  ];

  const filteredProducts = data.products.filter((product) => {
    if (activeTab === 'active') return product.status === 'active';
    if (activeTab === 'draft') return product.status === 'draft';
    if (activeTab === 'outOfStock') return product.status === 'out_of_stock';
    return true;
  });

  const openAdd = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', priceCoins: '10', inventory: '', status: 'active', category: 'Merchandise', isDigital: false });
    setThumbnailUrl('');
    setFormMsg(null);
    setProductModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      priceCoins: String(product.priceCoins || 0),
      inventory: product.inventory === null || product.inventory === undefined ? '' : String(product.inventory),
      status: product.status || 'active',
      category: product.category || 'Merchandise',
      isDigital: !!product.isDigital
    });
    setThumbnailUrl(product.thumbnailUrl || '');
    setFormMsg(null);
    setProductModalOpen(true);
  };

  const handleThumbnailPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.post('/posts/upload-url', {
        fileName: (file.name || 'product.jpg').replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileType: file.type || 'image/jpeg'
      });
      if (res.status === 'success') {
        const putRes = await fetch(res.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: file
        });
        if (putRes.ok) setThumbnailUrl(res.fileUrl);
      }
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || productForm.priceCoins === '') {
      setFormMsg({ type: 'error', text: 'Name and price are required' });
      return;
    }
    setSaving(true);
    setFormMsg(null);
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description,
        priceCoins: Math.max(0, Number(productForm.priceCoins) || 0),
        inventory: productForm.inventory === '' ? null : Math.max(0, Number(productForm.inventory) || 0),
        status: productForm.status,
        category: productForm.category,
        isDigital: !!productForm.isDigital,
        thumbnailUrl,
        media: thumbnailUrl ? [{ url: thumbnailUrl, type: 'image' }] : []
      };
      if (editingProduct) {
        await api.put(`/store/my/products/${editingProduct._id}`, payload);
        setFormMsg({ type: 'success', text: 'Product updated' });
      } else {
        await api.post('/store/my/products', payload);
        setFormMsg({ type: 'success', text: 'Product created' });
      }
      setTimeout(() => {
        setProductModalOpen(false);
        loadStore();
      }, 600);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to save product' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.mainGrid}>
         {/* Stats Row */}
         {loading ? (
           <div className={styles.statsRow}>
             {Array.from({ length: 4 }).map((_, idx) => (
               <div key={idx} className="skeleton-card" style={{ height: '110px', padding: 0 }}>
                 <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
               </div>
             ))}
           </div>
         ) : (
          <div className={styles.statsRow}>
            {storeStats.map((stat, idx) => {
              const Icon = iconMap[stat.icon];
              return (
                <div key={idx} className={styles.statCard}>
                  <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <span className={styles.statValue}>{stat.value}</span>
                    {stat.change ? (
                      <span className={`${styles.statChange} ${styles.changePositive}`}>
                        {stat.change} {stat.period && <span className={styles.changePeriod}>{stat.period}</span>}
                      </span>
                    ) : (
                      <span className={styles.statSubtitle}>{stat.subtitle}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Left Column - Products Section */}
        <div className={styles.leftColumn}>
          <section className={styles.productsSection}>
            <div className={styles.productsHeader}>
              <div className={styles.productsTitleRow}>
                <h2 className={styles.sectionTitle}>Products</h2>
                <p className={styles.sectionSubtitle}>Manage your store products and inventory.</p>
              </div>
              <div className={styles.productsActions}>
                <button className={styles.addProductBtn} onClick={openAdd}>
                  <Plus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsRow}>
              {storeTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

             {/* Products Table */}
             <div className={styles.tableCard}>
               {loading ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 0' }}>
                   {Array.from({ length: 4 }).map((_, idx) => (
                     <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                       <ShimmerSkeleton variant="avatar" width="40px" height="40px" />
                       <ShimmerSkeleton variant="text" width="35%" height="12px" />
                       <ShimmerSkeleton variant="text" width="50px" height="12px" />
                       <ShimmerSkeleton variant="text" width="40px" height="12px" />
                       <ShimmerSkeleton variant="text" width="45px" height="12px" />
                       <ShimmerSkeleton variant="text" width="55px" height="12px" />
                       <ShimmerSkeleton variant="chip" width="50px" height="20px" />
                       <ShimmerSkeleton variant="circle" width="28px" height="28px" />
                     </div>
                   ))}
                 </div>
               ) : (
                <>
                  {/* Desktop Table */}
                  <div className={`${styles.tableContainer} ${styles.hideMobile}`}>
                    <table className={styles.contentTable}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Product</th>
                          <th className={styles.th}>Price</th>
                          <th className={styles.th}>Inventory</th>
                          <th className={styles.th}>Sold</th>
                          <th className={styles.th}>Revenue</th>
                          <th className={styles.th}>Status</th>
                          <th className={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No products yet — add your first product!</td></tr>
                        )}
                        {filteredProducts.map((product) => (
                          <tr key={product._id} className={styles.tableRow}>
                            <td className={styles.td}>
                              <div className={styles.productInfo}>
                                <img src={product.thumbnailUrl} alt={product.name} className={styles.productThumb} />
                                <div className={styles.productDetails}>
                                  <span className={styles.productName}>{product.name}</span>
                                  <span className={styles.productDesc}>{product.description}</span>
                                </div>
                              </div>
                            </td>
                            <td className={`${styles.td} ${styles.price}`}>{product.priceCoins} coins</td>
                            <td className={styles.td}>
                              {product.inventory !== null && product.inventory !== undefined ? (
                                <>
                                  {product.inventory}<br />
                                  <span className={`${styles.stockStatus} ${product.status === 'out_of_stock' ? styles.outOfStock : styles.inStock}`}>
                                    {product.status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  ∞<br />
                                  <span className={`${styles.stockStatus} ${styles.unlimited}`}>Unlimited</span>
                                </>
                              )}
                            </td>
                            <td className={styles.td}>{product.soldCount || 0}</td>
                            <td className={`${styles.td} ${styles.revenue}`}>{fmtCoins((product.soldCount || 0) * product.priceCoins)}</td>
                            <td className={styles.td}>
                              <span className={`${styles.statusBadge} ${product.status === 'active' ? styles.statusActive : product.status === 'draft' ? styles.statusDraft : styles.statusOutOfStock}`}>
                                {product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className={styles.td}>
                              <div className={styles.actions}>
                                <button className={styles.editBtn} onClick={() => openEdit(product)}>Edit</button>
                                <div className={styles.menuWrap} data-kebab-menu>
                                  <button className={styles.moreBtn} onClick={() => toggleMenu(product._id)}><MoreVertical size={16} /></button>
                                  {openMenuId === product._id && (
                                    <div className={styles.actionMenu}>
                                      <button className={styles.actionMenuItem} onClick={() => { setOpenMenuId(null); openEdit(product); }}><Pencil size={13} /> Edit</button>
                                      <button className={`${styles.actionMenuItem} ${styles.actionMenuDanger}`} onClick={() => handleDeleteProduct(product)}><Trash2 size={13} /> Delete</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className={`${styles.mobileCards} ${styles.showMobile}`}>
                    {filteredProducts.map((product) => (
                      <div key={product._id} className={styles.mobileCard}>
                        <div className={styles.mobileCardTop}>
                          <img src={product.thumbnailUrl} alt={product.name} className={styles.mobileCardThumb} />
                          <div className={styles.mobileCardContent}>
                            <div className={styles.mobileCardTitleRow}>
                              <span className={styles.mobileCardName}>{product.name}</span>
                              <span className={`${styles.statusBadge} ${product.status === 'active' ? styles.statusActive : product.status === 'draft' ? styles.statusDraft : styles.statusOutOfStock}`}>
                                {product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Out of Stock'}
                              </span>
                            </div>
                            <span className={styles.mobileCardDesc}>{product.description}</span>
                            <div className={styles.mobileCardStats}>
                              <span className={styles.mobileStatItem}>{product.priceCoins} coins</span>
                              <span className={styles.mobileStatDivider}>•</span>
                              <span className={styles.mobileStatItem}>{product.soldCount || 0} sold</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.mobileCardActions}>
                          <button className={styles.editBtn} onClick={() => openEdit(product)}>Edit</button>
                          <div className={styles.menuWrap} data-kebab-menu>
                            <button className={styles.moreBtn} onClick={() => toggleMenu(product._id)}><MoreVertical size={14} /></button>
                            {openMenuId === product._id && (
                              <div className={styles.actionMenu}>
                                <button className={styles.actionMenuItem} onClick={() => { setOpenMenuId(null); openEdit(product); }}><Pencil size={12} /> Edit</button>
                                <button className={`${styles.actionMenuItem} ${styles.actionMenuDanger}`} onClick={() => handleDeleteProduct(product)}><Trash2 size={12} /> Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Store Overview */}
          <div className={`${styles.sidebarCard} ${styles.storeOverviewCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Store Overview</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.overviewList}>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Total Revenue</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{fmtCoins(data.storeStats.revenueCoins)}</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Total Orders</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{data.storeStats.totalOrders || 0}</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Avg. Order Value</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>
                    {data.storeStats.totalOrders ? Math.round(data.storeStats.revenueCoins / data.storeStats.totalOrders) : 0} coins
                  </span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Items Sold</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{data.storeStats.totalSold || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className={`${styles.sidebarCard} ${styles.recentOrdersCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Recent Orders</h3>
            </div>
            <div className={styles.ordersList}>
              {data.recentOrders.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', padding: '0.5rem 0' }}>No orders yet.</p>}
              {data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className={styles.orderItem}>
                  <img src={order.avatar} alt={order.customer} className={styles.orderAvatar} />
                  <div className={styles.orderInfo}>
                    <span className={styles.orderCustomer}>{order.customer}</span>
                    <span className={styles.orderDate}>{order.productName} • {fmtDate(order.date)}</span>
                  </div>
                  <span className={styles.orderAmount}>{order.amountCoins} coins</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className={`${styles.sidebarCard} ${styles.topProductsCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Top Selling Products</h3>
            </div>
            <div className={styles.topProductsList}>
              {data.topSellingProducts.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', padding: '0.5rem 0' }}>No sales yet.</p>}
              {data.topSellingProducts.map((product) => (
                <div key={product.id} className={styles.topProductItem}>
                  <div className={styles.rankBadge} data-rank={product.rank}>{product.rank}</div>
                  <img src={product.thumbnail} alt={product.name} className={styles.topProductThumb} />
                  <div className={styles.topProductInfo}>
                    <span className={styles.topProductName}>{product.name}</span>
                    <span className={styles.topProductSold}>{product.sold} sold</span>
                  </div>
                  <span className={styles.topProductRevenue}>{product.revenue} coins</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`${styles.sidebarCard} ${styles.quickStatsCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Quick Stats</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.quickStatsGrid}>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Revenue</span>
                <span className={styles.quickStatValue}>{fmtCoins(data.storeStats.revenueCoins)}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Orders</span>
                <span className={styles.quickStatValue}>{data.storeStats.totalOrders || 0}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Items Sold</span>
                <span className={styles.quickStatValue}>{data.storeStats.totalSold || 0}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Active Products</span>
                <span className={styles.quickStatValue}>{data.storeStats.activeProducts || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {productModalOpen && (
        <div className={styles.productModalBackdrop} onClick={() => setProductModalOpen(false)}>
          <div className={styles.productModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.productModalHeader}>
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className={styles.productModalClose} onClick={() => setProductModalOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.productModalBody}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleThumbnailPick}
              />
              <button className={styles.productThumbPick} onClick={() => fileInputRef.current?.click()}>
                {thumbnailUrl ? <img src={thumbnailUrl} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : 'Choose thumbnail'}
              </button>
              <input
                type="text"
                placeholder="Product name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className={styles.productInput}
              />
              <input
                type="text"
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className={styles.productInput}
              />
              <div className={styles.productModalRow}>
                <input
                  type="number"
                  min="0"
                  placeholder="Price (coins)"
                  value={productForm.priceCoins}
                  onChange={(e) => setProductForm({ ...productForm, priceCoins: e.target.value })}
                  className={styles.productInput}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Inventory (blank = unlimited)"
                  value={productForm.inventory}
                  onChange={(e) => setProductForm({ ...productForm, inventory: e.target.value })}
                  className={styles.productInput}
                />
              </div>
              <div className={styles.productModalRow}>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className={styles.productInput}
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  className={styles.productInput}
                >
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <label className={styles.productCheckboxRow}>
                <input
                  type="checkbox"
                  checked={productForm.isDigital}
                  onChange={(e) => setProductForm({ ...productForm, isDigital: e.target.checked })}
                />
                Digital product (unlimited inventory)
              </label>
              {formMsg && <p style={{ color: formMsg.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.8rem' }}>{formMsg.text}</p>}
            </div>
            <div className={styles.productModalFooter}>
              <button className={styles.productCancelBtn} onClick={() => setProductModalOpen(false)}>Cancel</button>
              <button className={styles.productSaveBtn} onClick={handleSaveProduct} disabled={saving}>
                {saving ? <span><Loader2 size={14} className={styles.productSpin} /> Saving…</span> : editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget ? deleteTarget.name : ''}
        title="Delete Product?"
        confirmLabel="Delete Product"
        deleting={deleting}
        darkMode={darkMode}
        onCancel={closeDelete}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
};
