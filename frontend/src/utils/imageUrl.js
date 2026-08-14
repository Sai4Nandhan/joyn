export function getFallbackAvatar(fallbackName = 'User') {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(fallbackName || 'User')}`;
}

export function getImageUrl(url, fallbackName = 'User') {
  if (!url || url === 'null' || url === 'undefined' || url === 'none') {
    return getFallbackAvatar(fallbackName);
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function handleImageError(e, fallbackName = 'User') {
  const fallback = getFallbackAvatar(fallbackName);
  if (e.target.src !== fallback) {
    e.target.src = fallback;
  }
}
