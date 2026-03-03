/* ============================================
   VincentMovie - API Module
   ============================================ */

// Use proxy to avoid CORS issues (works on both localhost and Vercel)
const API_BASE = '/api/moviebox';

const MovieAPI = {
    /**
     * Get home feed data (banners, operating lists, platforms)
     */
    async getHome() {
        try {
            const res = await fetch(`${API_BASE}/home`);
            const json = await res.json();
            if (json.status && json.data?.code === 0) {
                return json.data.data;
            }
            throw new Error(json.data?.message || 'Failed to fetch home data');
        } catch (err) {
            console.error('API getHome error:', err);
            return null;
        }
    },

    /**
     * Get trending movies
     * @param {number} page
     * @param {number} perPage
     */
    async getTrending(page = 1, perPage = 20) {
        try {
            const res = await fetch(`${API_BASE}/trending?page=${page}&perPage=${perPage}`);
            const json = await res.json();
            if (json.status && json.data?.code === 0) {
                return json.data.data;
            }
            throw new Error(json.data?.message || 'Failed to fetch trending');
        } catch (err) {
            console.error('API getTrending error:', err);
            return null;
        }
    },

    /**
     * Get subject detail and recommendations
     * @param {string} subjectId
     * @param {number} page
     * @param {number} perPage
     */
    async getDetail(subjectId, page = 1, perPage = 12) {
        try {
            const res = await fetch(`${API_BASE}/detail-rec?subjectId=${subjectId}&page=${page}&perPage=${perPage}`);
            const json = await res.json();
            if (json.status && json.data?.code === 0) {
                return json.data.data;
            }
            throw new Error(json.data?.message || 'Failed to fetch detail');
        } catch (err) {
            console.error('API getDetail error:', err);
            return null;
        }
    },

    /**
     * Get play information for a movie or episode
     * @param {string} subjectId
     * @param {string} detailPath
     * @param {number} se - season number
     * @param {number} ep - episode number
     */
    async getPlay(subjectId, detailPath, se = 1, ep = 1) {
        try {
            const res = await fetch(`${API_BASE}/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detail_path=${detailPath}`);
            const json = await res.json();
            if (json.status && json.data?.code === 0) {
                return json.data.data;
            }
            throw new Error(json.data?.message || 'Failed to fetch play data');
        } catch (err) {
            console.error('API getPlay error:', err);
            return null;
        }
    },

    /**
     * Get tab operating data
     */
    async getTabOperating() {
        try {
            const res = await fetch(`${API_BASE}/tab-operating`);
            const json = await res.json();
            if (json.status && json.data?.code === 0) {
                return json.data.data;
            }
            throw new Error(json.data?.message || 'Failed to fetch tab data');
        } catch (err) {
            console.error('API getTabOperating error:', err);
            return null;
        }
    }
};
