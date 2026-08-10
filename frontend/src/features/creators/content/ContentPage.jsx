import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  Search, ChevronDown, Image, Video, FileText, Edit2, MoreVertical,
  Eye, Heart, X, Loader2, Trash2, Lock, ArrowLeft, ArrowRight, CircleDot
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import styles from './ContentPage.module.css';

const contentTabs = ['All Content', 'Open Content', 'Locked Content'];
const contentTypes = ['All Types', 'Image', 'Video', 'Story'];
const sortOptions = ['Newest First', 'Oldest First', 'Most Viewed', 'Most Liked'];
const PAGE_SIZE = 8;

// Explicit table column widths — used by both the <colgroup> and the loading
// skeleton so the shimmer previews the real column layout (header/values never drift).
const TABLE_COLS = ['40%', '5%', '10%', '12%', '8%', '8%', '8%', '9%'];

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
        <ShimmerSkeleton variant="chip" width="60px" height="22px" />
        <ShimmerSkeleton variant="text" width="62%" height="12px" />
        <ShimmerSkeleton variant="text" width="78%" height="12px" />
        <ShimmerSkeleton variant="text" width="50%" height="12px" />
        <ShimmerSkeleton variant="text" width="50%" height="12px" />
        <ShimmerSkeleton variant="text" width="56%" height="12px" />
        <ShimmerSkeleton variant="circle" width="16px" height="16px" />
      </div>
    ))}
  </div>
);

const MobileCardsSkeleton = () => (
  <div className={styles.skMobileWrap}>
    {[...Array(6)].map((_, i) => (
      <div className={styles.skMobileCard} key={i}>
        <ShimmerSkeleton variant="media" width="100%" height="120px" />
        <div className={styles.skMobileBody}>
          <ShimmerSkeleton variant="text" width="70%" height="12px" />
          <ShimmerSkeleton variant="text" width="42%" height="10px" />
          <ShimmerSkeleton variant="text" width="58%" height="10px" />
        </div>
      </div>
    ))}
  </div>
);

const SidebarSkeleton = () => (
  <>
    <div className={styles.skSideCard}>
      <ShimmerSkeleton variant="text" width="40%" height="14px" />
      <div className={styles.skStatGrid}>
        {[...Array(2)].map((_, i) => (
          <div className={styles.skStat} key={i}>
            <ShimmerSkeleton variant="text" width="60%" height="10px" />
            <ShimmerSkeleton variant="text" width="80%" height="12px" />
          </div>
        ))}
      </div>
    </div>

    <div className={styles.skSideCard}>
      <ShimmerSkeleton variant="text" width="52%" height="14px" />
      <div className={styles.skSideBody}>
        <ShimmerSkeleton variant="circle" width="80px" height="80px" />
        <div className={styles.skLegendList}>
          {[...Array(3)].map((_, i) => (
            <div className={styles.skLegendItem} key={i}>
              <ShimmerSkeleton variant="circle" width="10px" height="10px" />
              <div className={styles.skCellBars}>
                <ShimmerSkeleton variant="text" width="64%" height="10px" />
                <ShimmerSkeleton variant="text" width="44%" height="10px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className={styles.skSideCard}>
      <ShimmerSkeleton variant="text" width="48%" height="14px" />
      <div className={styles.skSideList}>
        {[...Array(4)].map((_, i) => (
          <div className={styles.skTopItem} key={i}>
            <ShimmerSkeleton variant="avatar" width="32px" height="32px" />
            <div className={styles.skCellBars}>
              <ShimmerSkeleton variant="text" width="70%" height="10px" />
              <ShimmerSkeleton variant="text" width="46%" height="10px" />
            </div>
            <ShimmerSkeleton variant="circle" width="16px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  </>
);

export const ContentPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('All Content');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [period, setPeriod] = useState('All Time');
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState({
    contentOverview: { stats: [] },
    contentBreakdown: { total: 0, categories: [] },
    topPerformingContent: [],
    recentContent: [],
    pagination: { totalPages: 1, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('image');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadThumbFile, setUploadThumbFile] = useState(null);
  const [uploadIsBlurred, setUploadIsBlurred] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  // When editing an existing post we keep the original media and expose it
  // as read-only. Store the media url/type so the UI can render the disabled preview.
  const [editingItem, setEditingItem] = useState(null);
  const fileInputRef = useRef(null);
  const thumbFileInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const filterRef = useRef(null);
  // Delete flow — shared confirm dialog state machine
  const {
    target: deleteTarget,
    open: openDelete,
    close: closeDelete,
    confirm: confirmDeleteItem,
    deleting,
  } = useConfirmDelete({
    onConfirm: (item) =>
      item.isStory
        ? api.delete(`/creators/stories/${item._id || item.id}`)
        : api.delete(`/posts/${item._id || item.id}`),
    successMessage: 'Content deleted successfully',
    errorMessage: 'Failed to delete content. Please try again.',
    onSuccess: () => loadContent(),
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) setOpenMenuId(null);
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  const handleEditItem = (item) => {
    setOpenMenuId(null);
    setEditingItem(item);
    setUploadType(item.type === 'Video' || item.mediaType === 'video' ? 'video' : 'image');
    setUploadCaption(item.title || '');
    setUploadPrice(String(item.priceCoins || 0));
    setUploadFile(null);
    setUploadThumbFile(null);
    setUploadIsBlurred(item.isBlurred !== undefined ? item.isBlurred : true);
    setUploadMsg(null);
    setUploadOpen(true);
  };

  // Open the delete confirmation popup
  const handleDeleteItem = (item) => {
    setOpenMenuId(null);
    const id = item._id || item.id;
    if (!id) return;
    openDelete(item);
  };

  const loadContent = async () => {
    const hasData = data.recentContent.length > 0 || data.contentOverview.stats.length > 0;
    if (hasData) {
      setContentLoading(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'All Content') params.append('tab', activeTab);
      if (selectedType !== 'All Types') params.append('type', selectedType);
      if (selectedSort) params.append('sort', selectedSort);
      params.append('page', '1');
      params.append('limit', '50');
      params.append('period', period);

      const res = await api.get(`/creators/panel/content?${params.toString()}`);
      if (res.status === 'success') {
        setData({
          contentOverview: res.contentOverview || { stats: [] },
          contentBreakdown: res.contentBreakdown || { total: 0, categories: [] },
          topPerformingContent: res.topPerformingContent || [],
          recentContent: res.recentContent || [],
          pagination: res.pagination || { totalPages: 1, total: 0 }
        });
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
      setContentLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadContent());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedType, selectedSort, period]);

  const getTypeIcon = (item) => {
    // Locked (PPV) posts report type 'PPV' — use the real media type so
    // video posts show the video icon, matching the filter dropdown.
    if (item.mediaType === 'video') return <Video size={16} />;
    if (item.type === 'Story' || item.mediaType === 'story') return <FileText size={16} />;
    if (item.type === 'Image') return <Image size={16} />;
    return <Image size={16} />;
  };

  const filteredContent = (data.recentContent || []).filter((item) => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const displayedContent = filteredContent.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredContent.length / PAGE_SIZE));
  const pageNums = [];
  for (let p = 1; p <= totalPages && p <= 5; p++) pageNums.push(p);

  const openUpload = (type) => {
    setEditingItem(null);
    setUploadType(type);
    setUploadCaption('');
    setUploadPrice('');
    setUploadFile(null);
    setUploadThumbFile(null);
    setUploadIsBlurred(true);
    setUploadOpen(true);
    setUploadMsg(null);
  };

  // Stories accept both images and videos; the media type is detected from
  // the chosen file at upload time so the backend gets the right value.

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadFile(file || null);
  };

  // While publishing require a file; while editing the original media is kept
  // (immutable) so only the caption/price are submitted. Stories only need the
  // media file — captions/prices don't apply.
  const canPublish = uploadType === 'story'
    ? Boolean(uploadFile)
    : Boolean(uploadCaption.trim() && (editingItem || uploadFile) && uploadPrice !== '');

  const handleUpload = async () => {
    if (!uploadFile && !editingItem) {
      setUploadMsg({ type: 'error', text: 'Please choose a file' });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      const postType = uploadPrice && Number(uploadPrice) > 0 ? 'ppv' : 'free';

      // Editing an existing post: update caption, price and blur toggle
      if (editingItem) {
        const id = editingItem._id || editingItem.id;
        if (!id) throw new Error('Missing post id');
        let updatedMedia = editingItem.media;
        if (Array.isArray(updatedMedia)) {
          updatedMedia = updatedMedia.map((m) => ({
            ...m,
            isBlurred: uploadIsBlurred
          }));
        }
        const payload = {
          content: uploadCaption.trim(),
          postType,
          coinPrice: postType === 'ppv' ? Number(uploadPrice) : 0,
          ...(updatedMedia ? { media: updatedMedia } : {})
        };
        await api.put(`/posts/${id}`, payload);
        setUploadMsg({ type: 'success', text: 'Content updated successfully!' });
        setEditingItem(null);
        setUploadOpen(false);
        loadContent();
        return;
      }

      // For stories the file can be either media type — detect it so the
      // upload + story record use consistent values even without a MIME type.
      const storyMediaType = uploadFile.type && uploadFile.type.startsWith('video') ? 'video' : 'image';
      const fileType = uploadFile.type || (uploadType === 'video' || (uploadType === 'story' && storyMediaType === 'video') ? 'video/mp4' : 'image/jpeg');
      const res = await api.post('/posts/upload-url', {
        fileName: (uploadFile.name || `upload.${uploadType}`).replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileType
      });
      if (res.status !== 'success') {
        setUploadMsg({ type: 'error', text: 'Failed to get upload URL' });
        setUploading(false);
        return;
      }
      const putRes = await fetch(res.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: uploadFile
      });
      if (!putRes.ok) {
        setUploadMsg({ type: 'error', text: 'Upload to storage failed' });
        setUploading(false);
        return;
      }

      // Handle optional custom thumbnail upload for video
      let customThumbUrl = null;
      if (uploadType === 'video' && uploadThumbFile) {
        const thumbFileType = uploadThumbFile.type || 'image/jpeg';
        const thumbRes = await api.post('/posts/upload-url', {
          fileName: (uploadThumbFile.name || 'thumb.jpg').replace(/[^a-zA-Z0-9._-]/g, '_'),
          fileType: thumbFileType
        });
        if (thumbRes.status === 'success') {
          const thumbPut = await fetch(thumbRes.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': thumbFileType },
            body: uploadThumbFile
          });
          if (thumbPut.ok) {
            customThumbUrl = thumbRes.fileUrl;
          }
        }
      }

      // Stories: publish a 24-hour story (expiry is handled server-side).
      if (uploadType === 'story') {
        await api.post('/creators/stories', {
          mediaUrl: res.fileUrl,
          mediaType: storyMediaType
        });
        setUploadMsg({ type: 'success', text: 'Story published! It will disappear in 24 hours.' });
        setUploadFile(null);
        setUploadOpen(false);
        loadContent();
        return;
      }

      const payload = {
        content: uploadCaption.trim(),
        media: [{
          url: res.fileUrl,
          type: uploadType,
          thumbnailUrl: customThumbUrl || (uploadType === 'video' ? '/video-thumb.png' : res.fileUrl),
          isLocked: postType === 'ppv',
          isBlurred: uploadIsBlurred
        }],
        postType,
        coinPrice: postType === 'ppv' ? Number(uploadPrice) : 0
      };
      await api.post('/posts', payload);
      setUploadMsg({ type: 'success', text: 'Content published successfully!' });
      setUploadFile(null);
      setUploadThumbFile(null);
      setUploadCaption('');
      setUploadOpen(false);
      loadContent();
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <div className={styles.filterArea}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search your content..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className={styles.toolbarRight} ref={filterRef}>
                {/* Type Dropdown */}
                <div className={styles.dropdownWrapper}>
                  <button
                    className={styles.dropdownBtn}
                    onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setSortDropdownOpen(false); }}
                  >
                    {selectedType} <ChevronDown size={14} />
                  </button>
                  {typeDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                       {contentTypes.map((type) => {
                         const typeIcon = type === 'Video' ? <Video size={14} /> : type === 'Story' ? <FileText size={14} /> : type === 'Image' ? <Image size={14} /> : null;
                         return (
                           <button
                             key={type}
                             className={`${styles.dropdownItem} ${selectedType === type ? styles.dropdownItemActive : ''}`}
                             onClick={() => { setSelectedType(type); setTypeDropdownOpen(false); }}
                           >
                             {typeIcon && <span style={{ marginRight: '0.4rem', display: 'inline-flex' }}>{typeIcon}</span>}
                             {type}
                           </button>
                         );
                       })}
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className={styles.dropdownWrapper}>
                  <button
                    className={styles.dropdownBtn}
                    onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setTypeDropdownOpen(false); }}
                  >
                    {selectedSort} <ChevronDown size={14} />
                  </button>
                  {sortDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      {sortOptions.map((opt) => (
                        <button
                          key={opt}
                          className={`${styles.dropdownItem} ${selectedSort === opt ? styles.dropdownItemActive : ''}`}
                          onClick={() => { setSelectedSort(opt); setSortDropdownOpen(false); }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className={styles.uploadImageBtn} onClick={() => openUpload('image')}>
                  <Image size={14} /> Upload Image
                </button>
                <button className={styles.uploadVideoBtn} onClick={() => openUpload('video')}>
                  <Video size={14} /> Upload Video
                </button>
                <button className={styles.uploadStoryBtn} onClick={() => openUpload('story')}>
                  <CircleDot size={14} /> New Story
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.tabsRow}>
              {contentTabs.map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content Table */}
          <div className={styles.tableCard}>
            {(loading || contentLoading) ? (
              <>
                <div className={`${styles.hideMobile}`}>
                  <TableSkeleton />
                </div>
                <div className={`${styles.showMobile}`}>
                  <MobileCardsSkeleton />
                </div>
              </>
            ) : (
              <>
                {/* Desktop Table */}
                <div className={`${styles.tableContainer} ${styles.hideMobile}`}>
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
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Date</th>
                        <th className={styles.th}>Views</th>
                        <th className={styles.th}>Likes</th>
                        <th className={styles.th}>Price</th>
                        <th className={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedContent.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No content yet — upload your first post!</td></tr>
                      )}
                      {displayedContent.map((item) => (
                        <tr key={item._id || item.id} className={styles.tableRow}>
                          <td className={styles.td}>
                            <div className={styles.contentInfo}>
                              <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                              <div className={styles.contentDetails}>
                                <span className={styles.contentTitle}>{item.title}</span>
                                <span className={styles.contentMeta}>{item.type}</span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.typeIcon}>{getTypeIcon(item)}</span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.statusCell}>
                              <span className={`${styles.statusBadge} ${item.status === 'Open' ? styles.statusOpen : styles.statusLocked}`}>
                                {item.status.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.dateTime}>{fmtDate(item.date)}</span>
                          </td>
                          <td className={styles.td}>{item.views}</td>
                          <td className={styles.td}>{item.likes}</td>
                          <td className={styles.td}>
                            {item.priceCoins > 0 ? <span className={styles.priceValue}>{item.priceCoins} coins</span> : '—'}
                          </td>
                           <td className={styles.td}>
                             <div className={styles.actions}>
                               <div className={styles.menuWrap} data-kebab-menu>
                                 <button className={styles.actionBtn} onClick={() => toggleMenu(item._id || item.id)}><MoreVertical size={14} /></button>
                                 {openMenuId === (item._id || item.id) && (
                                   <div className={styles.actionMenu}>
                                     {!item.isStory && (
                                       <button className={styles.actionMenuItem} onClick={() => handleEditItem(item)}><Edit2 size={13} /> Edit</button>
                                     )}
                                     <button className={`${styles.actionMenuItem} ${styles.actionMenuDanger}`} onClick={() => handleDeleteItem(item)}><Trash2 size={13} /> Delete</button>
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
                  {displayedContent.map((item) => (
                    <div key={item._id || item.id} className={styles.mobileCard}>
                      <div className={styles.mobileCardTop}>
                        <div className={styles.mobileCardThumbCol}>
                          <img src={item.thumbnail} alt={item.title} className={styles.mobileCardThumb} />
                          <span className={`${styles.statusBadge} ${item.status === 'Open' ? styles.statusOpen : styles.statusLocked}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.mobileCardContent}>
                          <div className={styles.mobileCardTitleRow}>
                            <span className={styles.mobileCardTitle}>{item.title}</span>
                            <div className={styles.mobileCardActions}>
                               {item.priceCoins > 0 && <span className={styles.priceValue}>{item.priceCoins} coins</span>}
                               <div className={styles.menuWrap} data-kebab-menu>
                                 <button className={styles.actionBtn} onClick={() => toggleMenu(item._id || item.id)}><MoreVertical size={13} /></button>
                                 {openMenuId === (item._id || item.id) && (
                                   <div className={styles.actionMenu}>
                                     {!item.isStory && (
                                       <button className={styles.actionMenuItem} onClick={() => handleEditItem(item)}><Edit2 size={12} /> Edit</button>
                                     )}
                                     <button className={`${styles.actionMenuItem} ${styles.actionMenuDanger}`} onClick={() => handleDeleteItem(item)}><Trash2 size={12} /> Delete</button>
                                   </div>
                                 )}
                               </div>
                             </div>
                          </div>
                          <span className={styles.mobileCardMeta}>
                            {getTypeIcon(item)} {item.type}
                          </span>
                          <div className={styles.mobileCardStatsRow}>
                            <div className={styles.mobileStatsRight}>
                              <div className={styles.mobileStatItem}><Eye size={11} /><span>{item.views}</span></div>
                              <div className={styles.mobileStatItem}><Heart size={11} /><span>{item.likes}</span></div>
                              <span className={styles.mobileStatDate}>{fmtDate(item.date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {filteredContent.length > 0 && (
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
          {loading ? (
            <SidebarSkeleton />
          ) : (
            <>
          {/* Content Overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h3 className={styles.overviewTitle}>Content Overview</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.overviewGrid}>
              {data.contentOverview.stats.map((stat, idx) => (
                <div key={idx} className={styles.overviewStat}>
                  <span className={styles.overviewStatLabel}>{stat.label}</span>
                  <div className={styles.overviewStatRow}>
                    <span className={styles.overviewStatValue}>{stat.value}</span>
                    <span className={styles.overviewStatChange}>{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Breakdown */}
          <div className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Content Breakdown</h3>
            <div className={styles.breakdownBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    {(() => {
                      const circumference = 2 * Math.PI * 40;
                      const cats = data.contentBreakdown.categories || [];
                      // Scale by the sum of percentages so the ring is always filled completely
                      const totalPct = cats.reduce((s, cat) => s + (cat.percentage || 0), 0) || 100;
                      const offsets = cats.reduce((acc, cat) => {
                        const next = acc[acc.length - 1] + (cat.percentage / totalPct) * circumference;
                        return [...acc, next];
                      }, [0]);
                      return cats.map((cat, idx) => {
                        const segmentLength = (cat.percentage / totalPct) * circumference;
                        const dashOffset = -offsets[idx];
                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="12"
                            strokeDasharray={`${segmentLength} ${circumference}`}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        );
                      });
                    })()}
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{data.contentBreakdown.total}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Posts</text>
                  </svg>
                </div>
              </div>
              <div className={styles.breakdownLegend}>
                {data.contentBreakdown.categories.map((cat, idx) => (
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

          {/* Top Performing Content */}
          <div className={styles.topCard}>
            <h3 className={styles.topTitle}>Top Performing Content</h3>
            <div className={styles.topList}>
              {data.topPerformingContent.map((item) => (
                <div key={item.id} className={styles.topItem}>
                  <img src={item.thumbnail} alt={item.title} className={styles.topThumb} />
                  <div className={styles.topInfo}>
                    <span className={styles.topItemTitle}>{item.title}</span>
                    <span className={styles.topItemType}>{item.type}</span>
                  </div>
                  <div className={styles.topStats}>
                    <span className={styles.topStat}><Eye size={12} /> {item.views}</span>
                    <span className={styles.topStat}><Heart size={12} /> {item.likes}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.viewAnalyticsBtn} onClick={() => navigateTo('/creators/analytics')}>
              View All Content Analytics
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className={styles.uploadModalBackdrop} onClick={() => setUploadOpen(false)}>
          <div className={styles.uploadModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.uploadModalHeader}>
              <h3>
                {editingItem
                  ? 'Edit Content'
                  : uploadType === 'story'
                    ? 'Create Story'
                    : `Upload ${uploadType === 'video' ? 'Video' : 'Image'}`}
              </h3>
              <button className={styles.uploadModalClose} onClick={() => setUploadOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.uploadModalBody}>
              {editingItem ? (
                <div className={styles.editMediaPreview}>
                  {editingItem.mediaType === 'video' ? (
                    <div className={styles.editMediaVideoWrap}>
                      <video src={editingItem.thumbnail} className={styles.editMediaPreviewVideo} controls disabled />
                    </div>
                  ) : (
                    <img src={editingItem.thumbnail} alt="Current media" className={styles.editMediaPreviewImg} />
                  )}
                  <div className={styles.editMediaLocked}>
                    <Lock size={14} />
                    <span>Media is locked and cannot be changed</span>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={uploadType === 'story' ? 'image/*,video/*' : uploadType === 'video' ? 'video/*' : 'image/*'}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button className={styles.uploadPickBtn} onClick={() => fileInputRef.current?.click()}>
                    {uploadFile
                      ? uploadFile.name
                      : uploadType === 'story'
                        ? 'Choose an image or video (disappears in 24h)'
                        : `Choose ${uploadType === 'video' ? 'video' : 'image'} file`}
                  </button>

                  {uploadType === 'video' && (
                    <div className={styles.uploadField} style={{ marginTop: '0.75rem' }}>
                      <span className={styles.uploadFieldLabel}>Video Thumbnail (Optional):</span>
                      <input
                        ref={thumbFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => setUploadThumbFile(e.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        className={styles.uploadPickBtn}
                        onClick={() => thumbFileInputRef.current?.click()}
                        style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                      >
                        {uploadThumbFile ? uploadThumbFile.name : 'Upload Custom Video Thumbnail (Optional)'}
                      </button>
                    </div>
                  )}
                </>
              )}
              {uploadType !== 'story' && (
                <div className={styles.uploadField}>
                  <span className={styles.uploadFieldLabel}>Title:</span>
                  <input
                    type="text"
                    placeholder="Caption"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    className={styles.uploadInput}
                  />
                </div>
              )}
              {uploadType !== 'story' && (
                <div className={styles.uploadField}>
                  <span className={styles.uploadFieldLabel}>Price:</span>
                  <div className={styles.uploadPriceRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Price in coins (0 = free)"
                      value={uploadPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setUploadPrice(val);
                      }}
                      className={styles.uploadInput}
                    />
                  </div>
                </div>
              )}
              {uploadType !== 'story' && (
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>Blur thumbnail preview for locked content</span>
                    <span className={styles.toggleDesc}>Keep thumbnail blurred until unlocked, or turn off to show clear preview.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={uploadIsBlurred}
                      onChange={(e) => setUploadIsBlurred(e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              )}
              {uploadMsg && (
                <p style={{ color: uploadMsg.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.8rem' }}>{uploadMsg.text}</p>
              )}
            </div>
            <div className={styles.uploadModalFooter}>
              <button className={styles.uploadCancelBtn} onClick={() => setUploadOpen(false)}>Cancel</button>
              <button className={styles.uploadConfirmBtn} onClick={handleUpload} disabled={!canPublish || uploading}>
                {uploading ? <span><Loader2 size={14} className={styles.uploadSpin} /> Saving…</span> : (editingItem ? 'Save Changes' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget ? deleteTarget.title : ''}
        deleting={deleting}
        darkMode={darkMode}
        onCancel={closeDelete}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
};
