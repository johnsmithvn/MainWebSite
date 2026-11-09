// 📁 src/components/common/BrowseLayout.jsx
// 🧭 Khung trang duyệt thư mục dùng chung cho Manga / Movie / Music (docs/CARD-REDESIGN-PROPOSAL.md, P6c):
//  - Thanh công cụ dính dưới header: Về/Trang chủ, breadcrumb (cuộn ngang, tự cuộn tới thư mục hiện tại),
//    lọc + số mục/trang + sắp xếp (máy tính), lưới/danh sách, ⋯ (điện thoại: số mục/trang, sắp xếp).
//  - Tiêu đề mục kèm số mục (thay cho các ô thống kê), ô lọc trên điện thoại.
//  - Lưới / danh sách / skeleton / trống / lỗi, phân trang 40px và hộp "Chuyển tới trang".
// Dùng cùng hook useFolderBrowser (truyền vào qua prop `browser`).

import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiHome, FiGrid, FiList, FiMoreHorizontal, FiCheck, FiSearch, FiRefreshCw, FiInbox } from 'react-icons/fi';
import Breadcrumb from '@/components/common/Breadcrumb';
import CardActionSheet from '@/components/common/CardActionSheet';
import PageNav from '@/components/common/PageNav';
import { CardGridSkeleton, CardListSkeleton } from '@/components/common/CardSkeleton';
import { CARD_GRIDS } from '@/constants';
import { getContentType } from '@/config/contentTypes';

const ICON_BTN =
  'flex-none inline-grid place-items-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-300 ' +
  'hover:bg-gray-200/70 dark:hover:bg-gray-800 transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

const INPUT =
  'w-full pl-9 pr-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
  'text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const SELECT =
  'flex-none h-9 px-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
  'text-sm text-gray-900 dark:text-white';

// Ô trống cùng cỡ biểu tượng, để các dòng trong bảng chọn thẳng hàng với dòng có dấu ✓
const BlankIcon = ({ className = '' }) => <span className={className} aria-hidden="true" />;

const formatCount = (n) => Number(n || 0).toLocaleString('vi-VN');

/**
 * @param {object} props
 * @param {'manga'|'movie'|'music'} props.type
 * @param {string} props.currentPath
 * @param {(path: string) => void} props.onNavigatePath - Mở một thư mục (breadcrumb)
 * @param {() => void} props.onBack - Nút Về (thư mục cha) / Trang chủ
 * @param {string} props.searchTerm
 * @param {(value: string) => void} props.onSearchChange
 * @param {object} props.browser - Kết quả của useFolderBrowser
 * @param {boolean} [props.loading]
 * @param {string} [props.error]
 * @param {() => void} [props.onRetry]
 * @param {React.ReactNode} [props.topSlot] - Nằm trên thanh công cụ (ví dụ các hàng slider)
 * @param {React.ReactNode} [props.headerSlot] - Nằm giữa thanh công cụ và tiêu đề mục (ví dụ đầu trang bộ truyện)
 * @param {string} [props.heading]
 * @param {(item, viewMode: 'grid'|'list') => React.ReactNode} props.renderItem
 * @param {string} [props.emptyTitle]
 * @param {string} [props.emptyText]
 * @param {React.ReactNode} [props.children] - Modal của trang (xoá, ...)
 */
export default function BrowseLayout({
  type,
  currentPath = '',
  onNavigatePath,
  onBack,
  searchTerm = '',
  onSearchChange,
  browser,
  loading = false,
  error,
  onRetry,
  topSlot,
  headerSlot,
  heading,
  renderItem,
  emptyTitle,
  emptyText,
  children,
}) {
  const cfg = getContentType(type);
  const {
    page, totalPages, setPage, size, setSize, perPageOptions,
    sort, setSort, sortOptions, viewMode, setViewMode,
    pageItems, filteredCount, totalCount,
  } = browser;

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState(String(page));
  const crumbRef = useRef(null);
  const headingRef = useRef(null);

  // Breadcrumb dài: cuộn ngang tới cuối để luôn thấy thư mục hiện tại
  useEffect(() => {
    const el = crumbRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [currentPath]);

  const crumbs = [{ label: cfg.label, path: '' }];
  if (currentPath) {
    let acc = '';
    currentPath.split('/').filter(Boolean).forEach((part, i, arr) => {
      acc += (acc ? '/' : '') + part;
      crumbs.push({ label: part, path: acc, isLast: i === arr.length - 1 });
    });
  }

  // Đổi trang: cuộn tới tiêu đề mục (scroll-mt chừa chỗ cho header + thanh công cụ dính)
  const goToPage = (p) => {
    setPage(p);
    setJumpValue(String(p));
    headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openJump = () => {
    setJumpValue(String(page));
    setJumpOpen(true);
  };

  const hasSort = sortOptions.length > 1;
  const optionActions = [
    ...(hasSort
      ? sortOptions.map((o) => ({
          key: `sort-${o.value}`,
          label: `Sắp xếp: ${o.label}`,
          icon: o.value === sort ? FiCheck : BlankIcon,
          onClick: () => setSort(o.value),
        }))
      : []),
    ...perPageOptions.map((n) => ({
      key: `size-${n}`,
      label: `${n} mục mỗi trang`,
      icon: n === size ? FiCheck : BlankIcon,
      onClick: () => setSize(n),
    })),
  ];

  const searchInput = (extra, heightClass) => (
    <div className={`relative ${extra}`}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        placeholder={cfg.filterPlaceholder}
        aria-label={cfg.filterPlaceholder.replace('…', '')}
        value={searchTerm}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className={`${INPUT} ${heightClass}`}
      />
    </div>
  );

  const gridClass = CARD_GRIDS[cfg.grid] || CARD_GRIDS.manga;

  return (
    <div className="min-h-screen">
      {topSlot}

      {/* Thanh công cụ dính ngay dưới header (h-16). z-[15]: dưới lớp phủ sidebar (z-20) và sidebar (z-30). */}
      <div className="sticky top-16 z-[15] -mx-4 px-4 mb-3 sm:mb-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="flex items-center gap-1 sm:gap-2 h-12 sm:h-14">
          <button
            type="button"
            onClick={onBack}
            className={`${ICON_BTN} -ml-2`}
            title={currentPath ? 'Về thư mục cha' : 'Về trang chủ'}
            aria-label={currentPath ? 'Về thư mục cha' : 'Về trang chủ'}
          >
            {currentPath ? <FiArrowLeft className="w-5 h-5" /> : <FiHome className="w-5 h-5" />}
          </button>

          <div ref={crumbRef} className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Breadcrumb items={crumbs} onNavigate={onNavigatePath} className="w-max whitespace-nowrap pr-2" />
          </div>

          {/* Máy tính: lọc, sắp xếp, số mục mỗi trang nằm luôn trên thanh */}
          {searchInput('hidden md:block w-60 lg:w-72 flex-none', 'h-9')}
          {hasSort && (
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp" className={`hidden md:block ${SELECT}`}>
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Số mục mỗi trang" className={`hidden md:block ${SELECT}`}>
            {perPageOptions.map((n) => <option key={n} value={n}>{n} mục/trang</option>)}
          </select>

          {/* Lưới / danh sách (nhớ theo từng thư mục) */}
          <div className="flex-none flex rounded-lg bg-gray-200/70 dark:bg-gray-800 p-0.5" role="group" aria-label="Kiểu hiển thị">
            {[
              { mode: 'grid', Icon: FiGrid, label: 'Dạng lưới' },
              { mode: 'list', Icon: FiList, label: 'Dạng danh sách' },
            ].map(({ mode, Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                title={label}
                aria-label={label}
                className={`inline-grid place-items-center w-9 h-8 sm:h-9 rounded-md transition-colors
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Điện thoại: ⋯ mở bảng chọn sắp xếp / số mục mỗi trang */}
          <button
            type="button"
            onClick={() => setOptionsOpen(true)}
            className={`${ICON_BTN} md:hidden -mr-2`}
            title="Tuỳ chọn hiển thị"
            aria-label="Tuỳ chọn hiển thị"
          >
            <FiMoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {headerSlot}

      {/* Tiêu đề mục + số mục (thay cho các ô thống kê) */}
      <div ref={headingRef} className="scroll-mt-32 flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          {heading || (currentPath ? 'Danh sách' : 'Tất cả')}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 tabular-nums">
            {searchTerm ? `${formatCount(filteredCount)} / ${formatCount(totalCount)} mục` : `${formatCount(totalCount)} mục`}
          </span>
        </h2>
        {totalPages > 1 && (
          <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">Trang {page}/{totalPages}</span>
        )}
      </div>

      {/* Điện thoại: ô lọc nằm dưới tiêu đề (máy tính đã có trên thanh công cụ) */}
      {searchInput('md:hidden mb-4', 'h-10')}

      {error && !loading && (
        <div className="mb-4 flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">Không tải được danh sách: {error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex-none inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <FiRefreshCw className="w-4 h-4" aria-hidden="true" />
              Thử lại
            </button>
          )}
        </div>
      )}

      {loading ? (
        viewMode === 'list'
          ? <CardListSkeleton type={type} count={8} />
          : <CardGridSkeleton type={type} count={Math.min(size, 12)} />
      ) : pageItems.length === 0 ? (
        !error && (
          <div className="text-center py-12">
            <FiInbox className="w-14 h-14 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {searchTerm ? 'Không có mục nào khớp' : emptyTitle || 'Thư mục trống'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Thử từ khoá khác hoặc xoá ô lọc.' : emptyText || 'Thư mục này chưa có gì, hoặc chưa được quét.'}
            </p>
          </div>
        )
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-1">{pageItems.map((item) => renderItem(item, 'list'))}</div>
      ) : (
        <div className={gridClass}>{pageItems.map((item) => renderItem(item, 'grid'))}</div>
      )}

      {!loading && <PageNav page={page} totalPages={totalPages} onChange={goToPage} onJump={openJump} className="mt-6 sm:mt-8" />}

      {/* Điện thoại: bảng chọn sắp xếp / số mục mỗi trang */}
      {optionsOpen && (
        <CardActionSheet title="Tuỳ chọn hiển thị" actions={optionActions} onClose={() => setOptionsOpen(false)} />
      )}

      {/* Hộp "Chuyển tới trang" */}
      {jumpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setJumpOpen(false)}>
          <form
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const num = parseInt(jumpValue, 10);
              if (!Number.isNaN(num)) goToPage(num);
              setJumpOpen(false);
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Chuyển tới trang</h3>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              aria-label="Số trang"
              autoFocus
              className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tổng số trang: {totalPages}</p>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setJumpOpen(false)} className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                Huỷ
              </button>
              <button type="submit" className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white">
                Chuyển
              </button>
            </div>
          </form>
        </div>
      )}

      {children}
    </div>
  );
}
