// 📁 react-app/src/pages/media/MediaHome.jsx
// 📸 Media Gallery Home Page (Google Photos-like)

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@/store';
import { apiService } from '@/utils/api';
import { useModal } from '@/components/common/Modal';
import MediaGrid from '@/components/media/MediaGrid';
import MediaTimeline from '@/components/media/MediaTimeline';
import MediaAlbums from '@/components/media/MediaAlbums';
import MediaToolbar from '@/components/media/MediaToolbar';
import MediaLightbox from '@/components/media/MediaLightbox';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Trash2 } from 'lucide-react';
import { CARD_GRIDS } from '@/constants';
import { CardGridSkeleton } from '@/components/common/CardSkeleton';
import ItemCard from '@/components/common/ItemCard';
import { mediaUrl } from '@/utils/mediaUrl';

// URL thumbnail của folder: DB mới lưu ".thumbnail/<file>", DB quét trước bản sửa chỉ lưu "<file>" (ISSUES B8).
// mediaUrl encode từng đoạn để tên có #, ?, % vẫn đúng.
const buildFolderThumbUrl = (folder) => {
  const thumb = folder.thumbnail.includes('/') ? folder.thumbnail : `.thumbnail/${folder.thumbnail}`;
  return mediaUrl(folder.path, thumb);
};

function MediaHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useUIStore();
  const { setSourceKey } = useAuthStore();
  const { confirmModal, successModal, errorModal, Modal } = useModal();
  
  const [folders, setFolders] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  // Bộ lọc + trang của lần cuối nhận timeline (PF9): chỉ bỏ qua timeline khi CHỈ đổi trang;
  // tải lại cùng trang (sau khi xoá, đổi yêu thích, quét...) thì vẫn tính lại
  const timelineStateRef = useRef({ key: null, page: null });
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const dbkey = searchParams.get('key') || 'MEDIA_PHOTOS';
  const currentPath = searchParams.get('path') || '';
  const view = searchParams.get('view') || 'photos'; // 'photos' | 'timeline' | 'albums' | 'favorites'
  const type = searchParams.get('type'); // 'image' | 'video'
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const albumId = searchParams.get('albumId');
  
  // 🔑 Set sourceKey for authentication context
  useEffect(() => {
    setSourceKey(dbkey);
  }, [dbkey, setSourceKey]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadData();
  }, [dbkey, currentPath, view, type, year, month, albumId, pagination.page]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load albums first for toolbar
      await loadAlbums();
      
      // Always clear folders when không ở photos view để tránh hiển thị dư (favorites hoặc chuyển từ photos sang albums)
      if (view !== 'photos' && folders.length > 0) {
        setFolders([]);
      }

      if (view === 'albums' && !albumId) {
        // Albums list view
        // Albums already loaded above
      } else if (view === 'albums' && albumId) {
        // Album detail view - show items in this album
        await loadMediaItems();
      } else if (view === 'timeline' || view === 'favorites') {
        // Timeline và Favorites dùng API cũ (media-folder)
        await loadMediaItems();
      } else {
        // Photos view dùng folder navigation
        await loadMediaFolders();
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMediaFolders = async () => {
    const response = await apiService.media.getFolders({ key: dbkey, path: currentPath });
    const data = response.data;
    setFolders(data.folders || []);
    setMediaItems(data.items || []);
  };

  const loadMediaItems = async () => {
    const params = {
      key: dbkey,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: 'date_taken',
      order: 'DESC'
    };

    // Timeline view: only load images and videos (filter at backend)
    if (view === 'timeline' && !type) {
      // Default to showing both image and video
      // Backend will handle filtering for timeline data
      // For now, we can't send multiple types, so we skip type filter
      // and let backend return all, then filter client-side
      // TODO: Update backend to support type[]=image&type[]=video
    }

    if (view === 'favorites') params.favorite = 'true';
    if (type) params.type = type;
    if (year) params.year = year;
    if (month) params.month = month;
    if (albumId) params.albumId = albumId;

    // Timeline gom nhóm toàn bộ kết quả lọc, không phụ thuộc trang → chuyển trang với cùng bộ lọc
    // thì không bắt server tính lại (PERFORMANCE-CACHE-REPORT PF9)
    const timelineKey = JSON.stringify([dbkey, view, type, year, month, albumId]);
    const hasTimeline =
      timelineStateRef.current.key === timelineKey && timelineStateRef.current.page !== pagination.page;
    if (hasTimeline) params.timeline = '0';

    const response = await apiService.media.getItems(params);
    const data = response.data;
    
    // Filter out non-viewable files from timeline view
    let filteredItems = data.items;
    if (view === 'timeline' && !type) {
      filteredItems = data.items.filter(item => 
        item.type === 'image' || item.type === 'video'
      );
    }
    
    setMediaItems(filteredItems);
    if (Array.isArray(data.timeline)) {
      setTimeline(data.timeline);
      timelineStateRef.current = { key: timelineKey, page: pagination.page };
    } else if (hasTimeline) {
      timelineStateRef.current = { key: timelineKey, page: pagination.page };
    } else {
      setTimeline([]);
    }
    
    // Fix race condition: chỉ update pagination nếu thực sự có thay đổi
    if (data.pagination) {
      setPagination(prev => {
        const hasChanged = 
          prev.total !== data.pagination.total ||
          prev.totalPages !== data.pagination.totalPages ||
          prev.limit !== data.pagination.limit;
        
        return hasChanged ? { ...prev, ...data.pagination } : prev;
      });
    }
  };

  const loadAlbums = async () => {
    const response = await apiService.media.getAlbums({ key: dbkey });
    setAlbums(response.data.albums);
  };

  const handleFavorite = async (itemId, isFavorite) => {
        // Optimistic update to avoid refetch causing flash/reload
    const previousItems = mediaItems;
    const previousSelected = new Set(selectedItems);

    setMediaItems((prevItems) => {
      if (view === 'favorites' && !isFavorite) {
        return prevItems.filter((item) => item.id !== itemId);
      }
      return prevItems.map((item) =>
        item.id === itemId ? { ...item, isFavorite } : item
      );
    });

    if (view === 'favorites' && !isFavorite && selectedItems.has(itemId)) {
      setSelectedItems((prev) => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }

    try {
      await apiService.media.toggleFavorite({ key: dbkey, id: itemId, isFavorite });
      showToast(isFavorite ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích', 'success');
    } catch (error) {
       // Revert UI state if API fails
      setMediaItems(previousItems);
      setSelectedItems(previousSelected);
      showToast(error.message, 'error');
    }
  };

  const deleteItem = async (path) => {
    setIsDeleting(true);
    try {
      const result = await apiService.media.deleteItem({ key: dbkey, path });
      showToast(result.data.message || 'Đã xóa item', 'success');
      setItemToDelete(null);
      // Refresh data
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateAlbum = async (name, description) => {
    try {
      await apiService.media.createAlbum({ key: dbkey, name, description });
      showToast('Đã tạo album', 'success');
      loadAlbums();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Fix bug: trước đây truyền selectedCount (number) khiến Array.from(number) -> [undefined x N] và không add được.
  const handleAddToAlbum = async (albumId, itemIdsSet) => {
    try {
      if (!itemIdsSet || itemIdsSet.size === 0) {
        showToast('Chưa chọn media để thêm album', 'info');
        return;
      }
      const itemIds = Array.from(itemIdsSet);
      await apiService.media.addItemsToAlbum(albumId, { key: dbkey, itemIds });
      showToast(`Đã thêm ${itemIds.length} mục vào album`, 'success');
      setSelectedItems(new Set());
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen">
      <MediaToolbar
        dbkey={dbkey}
        view={view}
        selectedItems={selectedItems}
        onClearSelection={() => setSelectedItems(new Set())}
        onAddToAlbum={handleAddToAlbum}
        albums={albums}
      />

  {/* NOTE: Removed pt-16 (extra 64px) which caused large gap & made timeline header appear bị đè/che phía trên.
      Toolbar already has fixed height 64px (h-16). Keeping only py-6 gives 24px top padding for breathing space. */}
  {/* Không bọc thêm container px-4: Layout đã có một lớp đệm (docs/CARD-REDESIGN-PROPOSAL.md, P2) */}
  <div className="py-6">
        {loading ? (
          view === 'albums' && !albumId ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            // Lưới ảnh: skeleton đúng ô vuông, cùng lưới với ảnh thật
            <CardGridSkeleton type="media" count={24} />
          )
        ) : (
          <>
            {view === 'albums' && !albumId ? (
              // Albums list view
              <MediaAlbums
                albums={albums}
                onCreateAlbum={handleCreateAlbum}
                onSelectAlbum={(id) => setSearchParams({ key: dbkey, view: 'albums', albumId: id })}
                onDeleteAlbum={async (id) => {
                  try {
                    await apiService.media.deleteAlbum(id, { key: dbkey });
                    showToast('Đã xóa album', 'success');
                    await loadAlbums();
                  } catch (error) {
                    showToast(error.message, 'error');
                  }
                }}
              />
            ) : view === 'albums' && albumId ? (
              // Album detail view - show items in this album
              <>
                <div className="mb-6">
                  <button
                    onClick={() => setSearchParams({ key: dbkey, view: 'albums' })}
                    className="text-blue-600 dark:text-blue-400 hover:underline mb-2"
                  >
                    ← Back to Albums
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {albums.find(a => a.id == albumId)?.name || 'Album'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {mediaItems.length} items
                  </p>
                </div>
                <MediaGrid
                  items={mediaItems}
                  selectedItems={selectedItems}
                  onSelectItem={(id) => {
                    const newSet = new Set(selectedItems);
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                    setSelectedItems(newSet);
                  }}
                  onItemClick={(index) => setLightboxIndex(index)}
                  onFavorite={handleFavorite}
                  onDeleteClick={(item) => setItemToDelete(item)}
                />
              </>
            ) : view === 'timeline' ? (
              <MediaTimeline
                items={mediaItems}
                timeline={timeline}
                selectedItems={selectedItems}
                onSelectItem={(id) => {
                  const newSet = new Set(selectedItems);
                  if (newSet.has(id)) newSet.delete(id);
                  else newSet.add(id);
                  setSelectedItems(newSet);
                }}
                onItemClick={(index) => setLightboxIndex(index)}
                onFavorite={handleFavorite}
              />
            ) : (
              <>
                {/* Breadcrumb Navigation */}
                {currentPath && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <button
                      onClick={() => setSearchParams({ key: dbkey })}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Home
                    </button>
                    {currentPath.split('/').map((segment, i, arr) => {
                      const path = arr.slice(0, i + 1).join('/');
                      return (
                        <React.Fragment key={i}>
                          <span>/</span>
                          <button
                            onClick={() => setSearchParams({ key: dbkey, path })}
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {segment}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* Folders Grid */}
                {view === 'photos' && folders.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                      Thư mục
                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 tabular-nums">{folders.length}</span>
                    </h3>
                    {/* Thư mục dùng chung ItemCard với các loại khác: ảnh vuông, mép xếp chồng, "134 mục", thao tác trong ⋯ */}
                    <div className={CARD_GRIDS.mediaFolders}>
                      {folders.map((folder) => (
                        <ItemCard
                          key={folder.path}
                          type="media"
                          title={folder.name}
                          thumbnail={folder.thumbnail ? buildFolderThumbUrl(folder) : null}
                          isFolder
                          thumbKind="folder"
                          subtitle={folder.itemCount > 0 ? `${Number(folder.itemCount).toLocaleString('vi-VN')} mục` : 'Thư mục'}
                          onOpen={() => setSearchParams({ key: dbkey, path: folder.path })}
                          sheetSubtitle={folder.path}
                          actions={[
                            {
                              key: 'delete',
                              label: 'Xoá khỏi cơ sở dữ liệu',
                              icon: Trash2,
                              danger: true,
                              onClick: () => setItemToDelete({ path: folder.path, name: folder.name, type: 'folder' }),
                            },
                          ]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Items Grid */}
                <MediaGrid
                  items={mediaItems}
                  selectedItems={selectedItems}
                  onSelectItem={(id) => {
                    const newSet = new Set(selectedItems);
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                    setSelectedItems(newSet);
                  }}
                  onItemClick={(index) => setLightboxIndex(index)}
                  onFavorite={handleFavorite}
                  onDeleteClick={(item) => setItemToDelete(item)}
                />
              </>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox
          items={mediaItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onFavorite={handleFavorite}
        />
      )}

      {/* Modal for confirmations */}
      <Modal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteItem(itemToDelete.path);
          }
        }}
        itemName={itemToDelete?.name || ''}
        itemType="media item"
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default MediaHome;
