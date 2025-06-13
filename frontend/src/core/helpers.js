export function getPathFromURL(search = window.location.search) {
  const params = new URLSearchParams(search);
  return params.get("path") || "";
}

export function paginate(list, page, perPage) {
  if (!Array.isArray(list)) return [];
  const start = page * perPage;
  return list.slice(start, start + perPage);
}
