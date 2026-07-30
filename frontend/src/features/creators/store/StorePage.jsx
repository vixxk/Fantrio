import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  DollarSign, ShoppingCart, Package, Archive,
  ExternalLink, Plus, Filter, ChevronDown,
  MoreVertical, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  storeStats, storeTabs, products, storeOverview,
  topSellingProducts, recentOrders, quickStats
} from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './StorePage.module.css';

const iconMap = {
  revenue: DollarSign,
  orders: ShoppingCart,
  products: Package,
  inventory: Archive,
};

export const StorePage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = products.filter(product => {
    if (activeTab === 'active') return product.status === 'Active';
    if (activeTab === 'draft') return product.status === 'Draft';
    if (activeTab === 'outOfStock') return product.status === 'Out of Stock';
    return true;
  });

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.mainGrid}>
        {/* Left Column - Main Content */}
        <div className={styles.leftColumn}>
          {/* Stats Row */}
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
                      <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : ''}`}>
                        ↑ {stat.change} <span className={styles.changePeriod}>{stat.period}</span>
                      </span>
                    ) : (
                      <span className={styles.statSubtitle}>{stat.subtitle}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Products Section */}
          <section className={styles.productsSection}>
            <div className={styles.productsHeader}>
              <div className={styles.productsTitleRow}>
                <h2 className={styles.sectionTitle}>Products</h2>
                <p className={styles.sectionSubtitle}>Manage your store products and inventory.</p>
              </div>
              <div className={styles.productsActions}>
                <button className={styles.viewStoreBtn}>
                  <ExternalLink size={14} /> View Store
                </button>
                <button className={styles.addProductBtn}>
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
              <div className={styles.tabsRight}>
                <button className={styles.filterBtn}>
                  <Filter size={14} /> Filter
                </button>
                <div className={styles.sortDropdown}>
                  <span className={styles.sortLabel}>Sort By:</span>
                  <button className={styles.sortBtn}>
                    Newest <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className={styles.tableCard}>
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
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className={styles.tableRow}>
                        <td className={styles.td}>
                          <div className={styles.productInfo}>
                            <img src={product.thumbnail} alt={product.name} className={styles.productThumb} />
                            <div className={styles.productDetails}>
                              <span className={styles.productName}>{product.name}</span>
                              <span className={styles.productDesc}>{product.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className={`${styles.td} ${styles.price}`}>
                          {product.price}<br /><span className={styles.currency}>{product.currency}</span>
                        </td>
                        <td className={styles.td}>
                          {product.inventory !== null ? (
                            <>
                              {product.inventory}<br />
                              <span className={`${styles.stockStatus} ${product.inventoryStatus === 'Out of Stock' ? styles.outOfStock : styles.inStock}`}>
                                {product.inventoryStatus}
                              </span>
                            </>
                          ) : (
                            <>
                              ∞<br />
                              <span className={`${styles.stockStatus} ${styles.unlimited}`}>{product.inventoryStatus}</span>
                            </>
                          )}
                        </td>
                        <td className={styles.td}>{product.sold}</td>
                        <td className={`${styles.td} ${styles.revenue}`}>{product.revenue}</td>
                        <td className={styles.td}>
                          <span className={`${styles.statusBadge} ${product.status === 'Active' ? styles.statusActive : styles.statusOutOfStock}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.actions}>
                            <button className={styles.editBtn}>Edit</button>
                            <button className={styles.moreBtn}>
                              <MoreVertical size={16} />
                            </button>
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
                  <div key={product.id} className={styles.mobileCard}>
                    <div className={styles.mobileCardTop}>
                      <img src={product.thumbnail} alt={product.name} className={styles.mobileCardThumb} />
                      <div className={styles.mobileCardContent}>
                        <div className={styles.mobileCardTitleRow}>
                          <span className={styles.mobileCardName}>{product.name}</span>
                          <span className={`${styles.statusBadge} ${product.status === 'Active' ? styles.statusActive : styles.statusOutOfStock}`}>
                            {product.status}
                          </span>
                        </div>
                        <span className={styles.mobileCardDesc}>{product.description}</span>
                        <div className={styles.mobileCardStats}>
                          <span className={styles.mobileStatItem}>{product.price}</span>
                          <span className={styles.mobileStatDivider}>•</span>
                          <span className={styles.mobileStatItem}>{product.sold} sold</span>
                          <span className={styles.mobileStatDivider}>•</span>
                          <span className={`${styles.mobileStatItem} ${styles.revenue}`}>{product.revenue}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.mobileCardActions}>
                      <button className={styles.editBtn}>Edit</button>
                      <button className={styles.moreBtn}>
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>Showing 1 to {filteredProducts.length} of {filteredProducts.length} products</span>
                <div className={styles.paginationButtons}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Store Overview */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Store Overview</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.overviewList}>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Total Revenue</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{storeOverview.totalRevenue}</span>
                  <span className={`${styles.overviewChange} ${styles.changePositive}`}>↑ {storeOverview.revenueChange}</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Total Orders</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{storeOverview.totalOrders}</span>
                  <span className={`${styles.overviewChange} ${styles.changePositive}`}>↑ {storeOverview.ordersChange}</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Average Order Value</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{storeOverview.averageOrderValue}</span>
                  <span className={`${styles.overviewChange} ${styles.changePositive}`}>↑ {storeOverview.aovChange}</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Conversion Rate</span>
                <div className={styles.overviewValueRow}>
                  <span className={styles.overviewValue}>{storeOverview.conversionRate}</span>
                  <span className={`${styles.overviewChange} ${styles.changePositive}`}>↑ {storeOverview.conversionChange}</span>
                </div>
              </div>
            </div>
            <button
              className={styles.viewStoreSidebarBtn}
              onClick={() => navigateTo('/creators/store')}
            >
              View Store
            </button>
          </div>

          {/* Top Selling Products */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Top Selling Products</h3>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.topProductsList}>
              {topSellingProducts.map((product) => (
                <div key={product.id} className={styles.topProductItem}>
                  <div className={styles.rankBadge} data-rank={product.rank}>
                    {product.rank}
                  </div>
                  <img src={product.thumbnail} alt={product.name} className={styles.topProductThumb} />
                  <div className={styles.topProductInfo}>
                    <span className={styles.topProductName}>{product.name}</span>
                    <span className={styles.topProductSold}>{product.sold} sold</span>
                  </div>
                  <span className={styles.topProductRevenue}>{product.revenue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Recent Orders</h3>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.ordersList}>
              {recentOrders.map((order) => (
                <div key={order.id} className={styles.orderItem}>
                  <img src={order.avatar} alt={order.customer} className={styles.orderAvatar} />
                  <div className={styles.orderInfo}>
                    <span className={styles.orderCustomer}>{order.customer}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  <span className={styles.orderAmount}>{order.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Quick Stats</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.quickStatsGrid}>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Page Views</span>
                <div className={styles.quickStatValueRow}>
                  <span className={styles.quickStatValue}>{quickStats.pageViews.value}</span>
                  <span className={`${styles.quickStatChange} ${styles.changePositive}`}>↑ {quickStats.pageViews.change}</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Store Visits</span>
                <div className={styles.quickStatValueRow}>
                  <span className={styles.quickStatValue}>{quickStats.storeVisits.value}</span>
                  <span className={`${styles.quickStatChange} ${styles.changePositive}`}>↑ {quickStats.storeVisits.change}</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Add to Cart</span>
                <div className={styles.quickStatValueRow}>
                  <span className={styles.quickStatValue}>{quickStats.addToCart.value}</span>
                  <span className={`${styles.quickStatChange} ${styles.changePositive}`}>↑ {quickStats.addToCart.change}</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Checkout Rate</span>
                <div className={styles.quickStatValueRow}>
                  <span className={styles.quickStatValue}>{quickStats.checkoutRate.value}</span>
                  <span className={`${styles.quickStatChange} ${styles.changePositive}`}>↑ {quickStats.checkoutRate.change}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
