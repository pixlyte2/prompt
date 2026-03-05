const cache = new Map();

export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  const now = Date.now();
  if (now > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

export const setCache = (key, data, ttl = 300000) => {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
};

export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

export const clearCacheByPrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

export const addRecentPrompt = (prompt) => {
  const recent = getRecentPrompts();
  const filtered = recent.filter(p => p._id !== prompt._id);
  const updated = [{ ...prompt, accessedAt: Date.now() }, ...filtered].slice(0, 10);
  localStorage.setItem('recentPrompts', JSON.stringify(updated));
};

export const getRecentPrompts = () => {
  const data = localStorage.getItem('recentPrompts');
  return data ? JSON.parse(data) : [];
};

export const clearRecentPrompts = () => {
  localStorage.removeItem('recentPrompts');
};
