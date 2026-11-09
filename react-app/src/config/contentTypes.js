// 📁 src/config/contentTypes.js
// 🧩 Khai báo theo từng loại nội dung, dùng chung cho ItemCard, khung trang (BrowseLayout) và useFolderBrowser.
// Thêm/chỉnh một loại ở đây thay vì sửa rải rác trong từng trang (docs/CARD-REDESIGN-PROPOSAL.md, P6c).

import { PAGINATION } from '@/constants';

const PER_PAGE_BASE = [12, 24, 30, 48, 60, 96];
const withDefault = (n) => Array.from(new Set([n, ...PER_PAGE_BASE])).sort((a, b) => a - b);

export const CONTENT_TYPES = {
  manga: {
    label: 'Manga',
    route: '/manga',
    ratio: 'aspect-[5/7]',
    objectPosition: 'object-top', // giữ phần đầu bìa (thường có tên truyện)
    thumbKind: 'manga',
    listThumbWidth: 'w-12 sm:w-16',
    grid: 'manga',
    defaultPerPage: 30,
    perPageOptions: PER_PAGE_BASE,
    filterPlaceholder: 'Lọc trong thư mục này…',
    foldersFirst: false,
  },
  movie: {
    label: 'Phim',
    route: '/movie',
    ratio: 'aspect-video',
    objectPosition: '',
    thumbKind: 'movie',
    listThumbWidth: 'w-24 sm:w-32',
    grid: 'movie',
    defaultPerPage: PAGINATION.MOVIES_PER_PAGE,
    perPageOptions: withDefault(PAGINATION.MOVIES_PER_PAGE),
    filterPlaceholder: 'Lọc phim trong thư mục này…',
    foldersFirst: true,
  },
  music: {
    label: 'Nhạc',
    route: '/music',
    ratio: 'aspect-square',
    objectPosition: '',
    thumbKind: 'music',
    listThumbWidth: 'w-12 sm:w-16',
    grid: 'music',
    defaultPerPage: PAGINATION.MUSIC_PER_PAGE,
    perPageOptions: withDefault(PAGINATION.MUSIC_PER_PAGE),
    filterPlaceholder: 'Lọc bài hát, ca sĩ, album…',
    foldersFirst: true,
  },
  media: {
    label: 'Ảnh',
    route: '/media',
    ratio: 'aspect-square',
    objectPosition: '',
    thumbKind: 'media',
    listThumbWidth: 'w-12 sm:w-16',
    grid: 'mediaFolders',
    defaultPerPage: 100,
    perPageOptions: PER_PAGE_BASE,
    filterPlaceholder: 'Lọc…',
    foldersFirst: true,
  },
};

export const getContentType = (type) => CONTENT_TYPES[type] || CONTENT_TYPES.manga;
