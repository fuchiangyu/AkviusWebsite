window.AkviusStats = (() => {
  const apiBase = window.AkviusConfig?.statsApiBase || "";

  const isEnabled = () => Boolean(apiBase);

  const request = async (path, options = {}) => {
    if (!isEnabled()) return null;

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Stats API ${response.status}`);
    }

    return response.json();
  };

  const getStats = () => request("/stats");

  const recordVisit = (payload = {}) =>
    request("/visit", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const recordLike = (payload = {}) =>
    request("/like", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  return {
    getStats,
    isEnabled,
    recordLike,
    recordVisit,
  };
})();
