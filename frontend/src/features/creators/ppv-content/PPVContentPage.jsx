import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  Lock, Eye, EyeOff, DollarSign, Flame, Image, Video,
  MoreVertical, ChevronDown, Plus, Pencil, Trash2, Search, ArrowLeft, ArrowRight, X, Loader2
} from 'lucide-react';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { EditPriceDialog } from './EditPriceDialog';
import { useToast } from '../../../components/Toast/Toast';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import styles from './PPVContentPage.module.css';

const iconMap = { lock: Lock, unlock: Eye, dollar: DollarSign, flame: Flame };
const ppvTabs = ['All Content', 'Images', 'Videos', 'Active', 'Sold', 'Hidden'];
const sortOptions = ['Newest First', 'Oldest First', 'Most Unlocks', 'Highest Price', 'Most Revenue'];
const PAGE_SIZE = 8;

// Explicit table column widths — keeps the header/rows from drifting.
const TABLE_COLS = ['34%', '6%', '11%', '9%', '11%', '13%', '10%', '6%'];

const TableSkeleton = () => (
  <div className={styles.skTable}>
    <div className={styles.skHeadRow}>
      {TABLE_COLS.map((w, i) => (
        <div key={i} className={styles.skHead} />
      ))}
    </div>
    {[...Array(6)].map((_, i) => (
      <div className={styles.skRow} key={i}>
        <div className={styles.skCellContent}>
          <ShimmerSkeleton variant="avatar" width="40px" height="40px" />
          <div className={styles.skCellBars}>
            <ShimmerSkeleton variant="text" width="72%" height="12px" />
            <ShimmerSkeleton variant="text" width="42%" height="10px" />
          </div>
        </div>
        <ShimmerSkeleton variant="chip" width="26px" height="26px" />
        <ShimmerSkeleton variant="text" width="60%" height="12px" />
        <ShimmerSkeleton variant="text" width="45%" height="12px" />
        <ShimmerSkeleton variant="text" width="55%" height="12px" />
        <ShimmerSkeleton variant="text" width="65%" height="12px" />
        <ShimmerSkeleton variant="chip" width="60px" height="22px" />
        <ShimmerSkeleton variant="circle" width="20px" height="20px" />
      </div>
    ))}
  </div>
);

const StatsSkeleton = () => (
  <div className={styles.statsGrid}>
    {[...Array(4)].map((_, i) => (
      <div className={styles.statCard} key={i}>
        <ShimmerSkeleton variant="media" width="42px" height="42px" />
        <div className={styles.statContent}>
          <ShimmerSkeleton variant="text" width="70%" height="10px" />
          <ShimmerSkeleton variant="text" width="55%" height="16px" />
          <ShimmerSkeleton variant="text" width="62%" height="9px" />
        </div>
      </div>
    ))}
  </div>
);

const SidebarSkeleton = () => (
  <>
    <div className={styles.skSideCard}>
      <ShimmerSkeleton variant="text" width="52%" height="14px" />
      <div className={styles.skSideDonut}>
        <ShimmerSkeleton variant="circle" width="90px" height="90px" />
        <div className={styles.skCellBars}>
          <ShimmerSkeleton variant="text" width="70%" height="10px" />
          <ShimmerSkeleton variant="text" width="55%" height="10px" />
          <ShimmerSkeleton variant="text" width="62%" height="10px" />
        </div>
      </div>
    </div>
    <div className={styles.skSideCard}>
      <ShimmerSkeleton variant="text" width="50%" height="14px" />
      <div className={styles.skSideList}>
        {[...Array(3)].map((_, i) => (
          <div className={styles.skTopItem} key={i}>
            <ShimmerSkeleton variant="avatar" width="32px" height="32px" />
            <div className={styles.skCellBars}>
              <ShimmerSkeleton variant="text" width="70%" height="10px" />
              <ShimmerSkeleton variant="text" width="45%" height="10px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const PPVContentPage = () => {
  const { darkMode } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All Content');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({ ppvStats: [], allItems: [] });
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [visibilityTarget, setVisibilityTarget] = useState(null);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const filterRef = useRef(null);

  // Add PPV Upload Modal State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadPrice, setUploadPrice] = useState('50');
  const [uploadIsBlurred, setUploadIsBlurred] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePublishPPV = async (e) => {
    e?.preventDefault();
    if (!uploadFile) {
      toast.error('Please select an image or video file.');
      return;
    }
    const priceNum = Math.floor(Number(uploadPrice));
    if (!uploadPrice || Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid coin price.');
      return;
    }

    setUploading(true);
    try {
      const fileType = uploadFile.type || (uploadFile.name?.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');
      let mediaUrl = '';
      try {
        const res = await api.post('/posts/upload-url', {
          fileName: (uploadFile.name || `ppv-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_'),
          fileType
        });
        if (res.status === 'success' && res.uploadUrl) {
          const putRes = await fetch(res.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': fileType },
            body: uploadFile
          });
          if (putRes.ok) {
            mediaUrl = res.fileUrl;
          }
        }
      } catch (s3Err) {
        console.warn('S3 upload failed, falling back to Data URL:', s3Err);
      }

      if (!mediaUrl) {
        mediaUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });
      }

      const isVideo = fileType.startsWith('video/');
      const payload = {
        content: uploadCaption.trim() || 'Exclusive Locked Content',
        media: [{
          url: mediaUrl,
          type: isVideo ? 'video' : 'image',
          thumbnailUrl: isVideo ? '/video-thumb.png' : mediaUrl,
          isLocked: true,
          isBlurred: uploadIsBlurred
        }],
        postType: 'ppv',
        coinPrice: priceNum
      };

      const res = await api.post('/posts', payload);
      if (res.status === 'success' || res.post) {
        toast.success('PPV content added successfully!');
        setUploadOpen(false);
        setUploadFile(null);
        setUploadCaption('');
        setUploadPrice('50');
        loadPPV();
      } else {
        throw new Error(res.message || 'Failed to publish PPV content');
      }
    } catch (err) {
      console.error('Failed to add PPV content:', err);
      toast.error(err.message || 'Failed to publish PPV content');
    } finally {
      setUploading(false);
    }
  };

  // Delete flow — shared confirm dialog state machine
  const {
    target: deleteTarget,
    open: openDelete,
    close: closeDelete,
    confirm: confirmDelete,
    deleting,
  } = useConfirmDelete({
    onConfirm: (item) => api.delete(`/posts/${item._id || item.id}`),
    successMessage: 'Content deleted successfully',
    errorMessage: 'Failed to delete content. Please try again.',
    onSuccess: () => loadPPV(),
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) setOpenMenuId(null);
      if (filterRef.current && !filterRef.current.contains(e.target)) setSortDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  const handleEditPrice = (item) => {
    setOpenMenuId(null);
    const id = item._id || item.id;
    if (!id) return;
    setEditTarget(item);
  };

  // Save the new price — resolves on success (dialog closes), rejects on failure
  const handleSavePrice = async (price) => {
    const id = editTarget ? editTarget._id || editTarget.id : null;
    if (!id) throw new Error('Content not found');
    const res = await api.put(`/posts/${id}`, { postType: 'ppv', coinPrice: price });
    if (res.status !== 'success') {
      throw new Error(res.message || 'Failed to update price');
    }
    toast.success('Price updated successfully');
    loadPPV();
  };

  // Open the delete confirmation popup
  const handleDelete = (item) => {
    setOpenMenuId(null);
    const id = item._id || item.id;
    if (!id) return;
    openDelete(item);
  };

  // Ask for confirmation before toggling content visibility (Hide / Make Visible)
  const handleRequestToggleHidden = (item) => {
    setOpenMenuId(null);
    const id = item._id || item.id;
    if (!id) return;
    setVisibilityTarget(item);
  };

  const closeVisibilityDialog = () => {
    if (visibilityBusy) return;
    setVisibilityTarget(null);
  };

  // Toggle creator-hide: hidden content is invisible to all users
  const confirmVisibilityToggle = async () => {
    const item = visibilityTarget;
    if (!item) return;
    const id = item._id || item.id;
    const nextHidden = !item.isHidden;
    setVisibilityBusy(true);
    // Optimistic update so the kebab label (Hide/Make Visible) and status badge
    // flip immediately; the reload below reconciles with the server response.
    setData((prev) => ({
      ...prev,
      allItems: (prev.allItems || []).map((it) =>
        (it._id || it.id) === id ? { ...it, isHidden: nextHidden, status: nextHidden ? 'Hidden' : 'Active' } : it
      ),
    }));
    try {
      const res = await api.put(`/posts/${id}`, { isHidden: nextHidden });
      if (res.status !== 'success') {
        throw new Error(res.message || 'Failed to update visibility');
      }
      toast.success(nextHidden ? 'Content hidden from all users' : 'Content is now visible to all users');
      setVisibilityTarget(null);
      loadPPV();
    } catch (err) {
      // Revert the optimistic change on failure
      setData((prev) => ({
        ...prev,
        allItems: (prev.allItems || []).map((it) =>
          (it._id || it.id) === id ? { ...it, isHidden: item.isHidden, status: item.isHidden ? 'Hidden' : 'Active' } : it
        ),
      }));
      console.error('Failed to toggle visibility:', err);
      toast.error(err.message || 'Failed to update visibility');
    } finally {
      setVisibilityBusy(false);
    }
  };

  const loadPPV = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' });
      const res = await api.get(`/creators/panel/ppv?${params.toString()}`);
      if (res.status === 'success') {
        setData({
          ppvStats: res.ppvStats || [],
          allItems: res.recentPPV || [],
        });
      }
    } catch (err) {
      console.error('Failed to load PPV content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadPPV());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allItems = data.allItems || [];

  // Client-side tab filtering (Images / Videos / Sold / Hidden) + search + sort
  const tabFiltered = useMemo(() => {
    const list = allItems;
    if (activeTab === 'Images') return list.filter((i) => i.type === 'Image');
    if (activeTab === 'Videos') return list.filter((i) => i.type === 'Video');
    if (activeTab === 'Sold') return list.filter((i) => (i.unlocks || 0) > 0);
    if (activeTab === 'Hidden') return list.filter((i) => i.isHidden);
    return list;
  }, [allItems, activeTab]);

  const sortedItems = useMemo(() => {
    const sorted = [...tabFiltered];
    switch (selectedSort) {
      case 'Oldest First': sorted.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
      case 'Most Unlocks': sorted.sort((a, b) => (b.unlocks || 0) - (a.unlocks || 0)); break;
      case 'Highest Price': sorted.sort((a, b) => (b.priceCoins || 0) - (a.priceCoins || 0)); break;
      case 'Most Revenue': sorted.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)); break;
      default: sorted.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
    }
    return sorted;
  }, [tabFiltered, selectedSort]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedItems;
    return sortedItems.filter((i) => (i.title || '').toLowerCase().includes(q));
  }, [sortedItems, searchQuery]);

  const displayedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageNums = [];
  for (let p = 1; p <= totalPages && p <= 5; p++) pageNums.push(p);

  // Sidebar: type breakdown donut (based on the full list)
  const breakdown = useMemo(() => {
    const img = allItems.filter((i) => i.type === 'Image').length;
    const vid = allItems.filter((i) => i.type === 'Video').length;
    const total = img + vid;
    const cats = [];
    if (img) cats.push({ label: 'Images', count: img, percentage: Math.round((img / total) * 100), color: '#10b981' });
    if (vid) cats.push({ label: 'Videos', count: vid, percentage: Math.round((vid / total) * 100), color: '#3b82f6' });
    return { total, categories: cats };
  }, [allItems]);

  // Sidebar: top performing by revenue
  const topPerformers = useMemo(
    () => [...allItems].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5),
    [allItems]
  );

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* PPV Stats Cards (top row, like Subscribers) */}
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className={styles.statsGrid}>
              {data.ppvStats.map((stat, idx) => {
                const Icon = iconMap[stat.icon] || Lock;
                return (
                  <div key={idx} className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statLabel}>{stat.label}</span>
                      <span className={styles.statValue}>{stat.value}</span>
                      <span
                        className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : stat.changeType === 'info' ? styles.changeInfo : styles.changeEarnings}`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabsRow}>
            {ppvTabs.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search PPV content..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className={styles.toolbarRight} ref={filterRef}>
              {/* Sort Dropdown */}
              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.dropdownBtn}
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                >
                  {selectedSort} <ChevronDown size={14} />
                </button>
                {sortDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        className={`${styles.dropdownItem} ${selectedSort === opt ? styles.dropdownItemActive : ''}`}
                        onClick={() => { setSelectedSort(opt); setSortDropdownOpen(false); setCurrentPage(1); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button className={styles.addBtn} onClick={() => setUploadOpen(true)}>
                <Plus size={15} />
                <span className={styles.addBtnText}>Add New PPV Content</span>
              </button>
            </div>
          </div>

          {/* Content Table */}
          <div className={styles.tableCard}>
            {loading ? (
              <TableSkeleton />
            ) : (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.contentTable}>
                    <colgroup>
                      {TABLE_COLS.map((w, i) => (
                        <col key={i} style={{ width: w }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={styles.th}>Content</th>
                        <th className={styles.th}>Type</th>
                        <th className={styles.th}>Price</th>
                        <th className={`${styles.th} ${styles.thCenter}`}>Unlocks</th>
                        <th className={styles.th}>Revenue</th>
                        <th className={styles.th}>Date Added</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedItems.length === 0 && (
                        <tr>
                          <td colSpan={8} className={styles.emptyCell}>No PPV content yet.</td>
                        </tr>
                      )}
                      {displayedItems.map((item) => (
                        <tr key={item._id || item.id} className={styles.tableRow}>
                          <td className={styles.td}>
                            <div className={styles.contentInfo}>
                              <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                              <div className={styles.contentDetails}>
                                <span className={styles.contentTitle}>{item.title}</span>
                                <span className={styles.contentMeta}>
                                  {item.type} <span className={styles.lockedBadge}>LOCKED</span>
                                </span>
                                <span className={styles.mobileMetaLine}>
                                  <span className={styles.mobileMetaLabel}>Price: </span>
                                  <span className={styles.mobilePriceValue}>{item.priceCoins} coins</span>
                                </span>
                                <span className={styles.mobileMetaLine}>
                                  <span className={styles.mobileMetaLabel}>Added: </span>
                                  <span className={styles.mobileAddedValue}>{fmtDate(item.date)}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.typeCell}>
                              {item.type === 'Video' ? (
                                <Video size={16} style={{ color: '#3b82f6' }} />
                              ) : (
                                <Image size={16} style={{ color: '#10b981' }} />
                              )}
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.price}`}>{item.priceCoins} coins</td>
                          <td className={`${styles.td} ${styles.unlocksCell}`}>{item.unlocks}</td>
                          <td className={`${styles.td} ${styles.revenue}`}>{item.revenue} coins</td>
                          <td className={`${styles.td} ${styles.dateAdded}`}>{fmtDate(item.date)}</td>
                          <td className={styles.td}>
                            <span className={`${styles.statusBadge} ${item.isHidden ? styles.statusHidden : styles.statusActive}`}>
                              {item.isHidden ? 'HIDDEN' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.actions}>
                              <button
                                className={`${styles.mobileActionBtn} ${styles.mobileEyeBtn} ${item.isHidden ? styles.mobileEyeHidden : ''}`}
                                onClick={() => handleRequestToggleHidden(item)}
                                title={item.isHidden ? 'Make Visible' : 'Hide'}
                                aria-label={item.isHidden ? 'Make content visible' : 'Hide content'}
                              >
                                {item.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button className={`${styles.mobileActionBtn} ${styles.mobileEditBtn}`} onClick={() => handleEditPrice(item)}>
                                <Pencil size={13} /> Edit Price
                              </button>
                              <button className={`${styles.mobileActionBtn} ${styles.mobileDeleteBtn}`} onClick={() => handleDelete(item)}>
                                <Trash2 size={13} /> Delete
                              </button>
                              <div className={styles.menuWrap} data-kebab-menu>
                                <button className={styles.moreBtn} onClick={() => toggleMenu(item._id || item.id)}><MoreVertical size={16} /></button>
                                {openMenuId === (item._id || item.id) && (
                                  <div className={styles.actionMenu}>
                                    <button className={styles.actionMenuItem} onClick={() => handleEditPrice(item)}><Pencil size={13} /> Edit Price</button>
                                    <button className={styles.actionMenuItem} onClick={() => handleRequestToggleHidden(item)}>
                                      {item.isHidden ? <Eye size={13} /> : <EyeOff size={13} />} {item.isHidden ? 'Make Visible' : 'Hide'}
                                    </button>
                                    <button className={`${styles.actionMenuItem} ${styles.actionMenuDanger}`} onClick={() => handleDelete(item)}><Trash2 size={13} /> Delete</button>
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

                {/* Pagination */}
                {filteredItems.length > 0 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    {pageNums.map((page) => (
                      <button
                        key={page}
                        className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    {totalPages > 5 && <span className={styles.pageDots}>...</span>}
                    {totalPages > 5 && (
                      <button
                        className={`${styles.pageBtn} ${currentPage === totalPages ? styles.pageBtnActive : ''}`}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {loading ? <SidebarSkeleton /> : (<>
          {/* PPV Breakdown */}
          <div className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>PPV Breakdown</h3>
            <div className={styles.breakdownBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    {(() => {
                      const circumference = 2 * Math.PI * 40;
                      const cats = breakdown.categories || [];
                      const totalPct = cats.reduce((s, cat) => s + (cat.percentage || 0), 0) || 100;
                      const offsets = cats.reduce((acc, cat) => {
                        const next = acc[acc.length - 1] + (cat.percentage / totalPct) * circumference;
                        return [...acc, next];
                      }, [0]);
                      return cats.map((cat, idx) => {
                        const segmentLength = (cat.percentage / totalPct) * circumference;
                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="12"
                            strokeDasharray={`${segmentLength} ${circumference}`}
                            strokeDashoffset={-offsets[idx]}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        );
                      });
                    })()}
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{breakdown.total}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Posts</text>
                  </svg>
                </div>
              </div>
              <div className={styles.breakdownLegend}>
                {breakdown.categories.length === 0 ? (
                  <div className={styles.legendLabel}>No PPV content yet</div>
                ) : breakdown.categories.map((cat, idx) => (
                  <div key={idx} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: cat.color }} />
                    <div className={styles.legendInfo}>
                      <span className={styles.legendLabel}>{cat.label}</span>
                      <span className={styles.legendValue}>{cat.percentage}% ({cat.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performing PPV */}
          <div className={styles.topCard}>
            <h3 className={styles.topTitle}>Top Performing PPV</h3>
            <div className={styles.topList}>
              {topPerformers.length === 0 ? (
                <div className={styles.topEmpty}>No PPV content yet</div>
              ) : topPerformers.map((item, idx) => (
                <div key={idx} className={styles.topItem}>
                  <span className={styles.topRank}>{idx + 1}</span>
                  <img src={item.thumbnail} alt={item.title} className={styles.topThumb} />
                  <div className={styles.topInfo}>
                    <span className={styles.topItemTitle}>{item.title}</span>
                    <span className={styles.topItemMeta}>{item.type} · {item.unlocks} unlocks</span>
                  </div>
                  <span className={styles.topRevenue}>{item.revenue} coins</span>
                </div>
              ))}
            </div>
          </div>
          </>)}
        </div>
      </div>

      {/* Edit Price Popup */}
      <EditPriceDialog
        item={editTarget}
        darkMode={darkMode}
        onClose={() => setEditTarget(null)}
        onSave={handleSavePrice}
      />

      {/* Delete Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget ? deleteTarget.title : ''}
        deleting={deleting}
        darkMode={darkMode}
        onCancel={closeDelete}
        onConfirm={confirmDelete}
      />

      {/* Visibility Confirmation Popup (Hide / Make Visible) */}
      <ConfirmDeleteDialog
        open={!!visibilityTarget}
        itemName={visibilityTarget ? visibilityTarget.title : ''}
        title={visibilityTarget && visibilityTarget.isHidden ? 'Make Content Visible?' : 'Hide Content?'}
        confirmLabel={visibilityTarget && visibilityTarget.isHidden ? 'Make Visible' : 'Hide'}
        busyLabel={visibilityTarget && visibilityTarget.isHidden ? 'Making visible…' : 'Hiding…'}
        message={
          visibilityTarget && visibilityTarget.isHidden
            ? <>This content is currently hidden from all users. Make it <strong>visible</strong> to everyone again?</>
            : <>Are you sure you want to hide <strong>"{visibilityTarget ? visibilityTarget.title : 'this item'}"</strong>? Users will no longer be able to unlock or view it.</>
        }
        icon={visibilityTarget && visibilityTarget.isHidden ? <Eye size={22} /> : <EyeOff size={22} />}
        variant={visibilityTarget && visibilityTarget.isHidden ? 'success' : 'danger'}
        deleting={visibilityBusy}
        darkMode={darkMode}
        onCancel={closeVisibilityDialog}
        onConfirm={confirmVisibilityToggle}
      />

      {/* Upload PPV Content Modal */}
      {uploadOpen && (
        <div className={styles.modalBackdrop} onClick={() => !uploading && setUploadOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <Lock size={20} className={styles.modalHeaderIcon} />
                <h3>Add New PPV Content</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => !uploading && setUploadOpen(false)}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishPPV} className={styles.modalBody}>
              {/* Media Picker */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Media File (Image or Video) *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadFile(f);
                  }}
                />
                {uploadFile ? (
                  <div className={styles.fileSelectedBox}>
                    {uploadFile.type?.startsWith('video/') ? (
                      <Video size={24} color="#3b82f6" />
                    ) : (
                      <Image size={24} color="#10b981" />
                    )}
                    <div className={styles.fileSelectedInfo}>
                      <span className={styles.fileName}>{uploadFile.name}</span>
                      <span className={styles.fileSize}>
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.changeFileBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    className={styles.dropzone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={28} className={styles.dropzoneIcon} />
                    <span>Click to select Image or Video</span>
                    <span className={styles.dropzoneSub}>PNG, JPG, MP4 up to 100MB</span>
                  </div>
                )}
              </div>

              {/* Title / Description */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Title / Description</label>
                <textarea
                  placeholder="Describe your exclusive content..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className={styles.modalTextarea}
                  disabled={uploading}
                  rows={3}
                />
              </div>

              {/* Coin Price */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Unlock Price (Coins) *</label>
                <div className={styles.priceInputWrap}>
                  <DollarSign size={16} className={styles.priceIcon} />
                  <input
                    type="number"
                    min="1"
                    placeholder="50"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(e.target.value)}
                    className={styles.modalInput}
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Blur Toggle */}
              <div className={styles.blurCheckboxRow}>
                <input
                  type="checkbox"
                  id="blurCheck"
                  checked={uploadIsBlurred}
                  onChange={(e) => setUploadIsBlurred(e.target.checked)}
                  disabled={uploading}
                />
                <label htmlFor="blurCheck">Blur media preview until unlocked by fan</label>
              </div>

              {/* Modal Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={uploading || !uploadFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Publishing…
                    </>
                  ) : (
                    'Publish PPV Content'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
