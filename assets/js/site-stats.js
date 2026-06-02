window.AkviusStats = (() => {
  const apiBase = window.AkviusConfig?.statsApiBase || "";

  const isEnabled = () => Boolean(apiBase);

  const request = async (path, options = {}) => {
    if (!isEnabled()) return null;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      const headers = { ...(options.headers || {}) };
      if (options.body && !headers["content-type"]) {
        headers["content-type"] = "application/json";
      }

      response = await fetch(`${apiBase}${path}`, {
        ...options,
        signal: controller.signal,
        headers,
      });
    } finally {
      window.clearTimeout(timeout);
    }

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
