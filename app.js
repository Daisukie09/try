/* ============================================
   VincentMovie - Main Application
   ============================================ */

// State
let currentPage = 'home';
let heroSlideIndex = 0;
let heroSlideInterval = null;
let heroSlides = [];
let trendingPage = 1;
let trendingLoading = false;
let homeData = null;

// ============================================
// Navigation
// ============================================
function navigateTo(page, params = {}) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');

    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'instant' });

    switch (page) {
        case 'home':
            document.getElementById('page-home').classList.add('active');
            if (!homeData) loadHome();
            break;
        case 'trending':
            document.getElementById('page-trending').classList.add('active');
            if (!document.getElementById('trendingGrid').children.length) {
                trendingPage = 1;
                loadTrending();
            }
            break;
        case 'detail':
            document.getElementById('page-detail').classList.add('active');
            loadDetail(params.subjectId, params.subjectType, params.detailPath, params.subject);
            break;
        case 'player':
            document.getElementById('page-player').classList.add('active');
            loadPlayer(params.subjectId, params.detailPath, params.title, params.se, params.ep, params.subject);
            break;
    }
}

// ============================================
// Search
// ============================================
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('searchOverlay').classList.remove('active');
    }
});

// ============================================
// Home Page
// ============================================
async function loadHome() {
    showLoading();
    homeData = await MovieAPI.getHome();
    hideLoading();

    if (!homeData) return;

    // Render banner
    renderHeroBanner(homeData.operatingList);

    // Render platforms
    renderPlatforms(homeData.platformList);

    // Render content rows from operatingList
    renderContentRows(homeData.operatingList);
}

function renderHeroBanner(operatingList) {
    const bannerData = operatingList.find(op => op.type === 'BANNER');
    if (!bannerData || !bannerData.banner?.items?.length) return;

    heroSlides = bannerData.banner.items.filter(item => item.subject);
    const slider = document.getElementById('heroSlider');
    const dots = document.getElementById('heroDots');

    slider.innerHTML = '';
    dots.innerHTML = '';

    heroSlides.forEach((item, index) => {
        const subject = item.subject;
        const genres = subject.genre ? subject.genre.split(',').slice(0, 3) : [];
        const duration = subject.duration ? formatDuration(subject.duration) : '';
        const year = subject.releaseDate ? subject.releaseDate.split('-')[0] : '';
        const typeLabel = subject.subjectType === 2 ? 'TV Series' : 'Movie';

        const slide = document.createElement('div');
        slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <div class="hero-slide-bg" style="background-image: url('${item.image?.url || subject.cover?.url || ''}')"></div>
            <div class="hero-slide-content">
                <div class="badge"><i class="fas fa-star"></i> ${typeLabel}</div>
                <h1>${escapeHtml(item.title || subject.title)}</h1>
                <div class="hero-meta">
                    ${subject.imdbRatingValue ? `<span class="rating"><i class="fas fa-star"></i> ${subject.imdbRatingValue}</span>` : ''}
                    ${year ? `<span><i class="far fa-calendar"></i> ${year}</span>` : ''}
                    ${duration ? `<span><i class="far fa-clock"></i> ${duration}</span>` : ''}
                    ${subject.countryName ? `<span><i class="fas fa-globe"></i> ${subject.countryName}</span>` : ''}
                </div>
                <div class="hero-meta">
                    ${genres.map(g => `<span class="genre-tag">${g.trim()}</span>`).join('')}
                </div>
                <div class="hero-actions">
                    <button class="btn btn-primary" onclick="openPlayer('${subject.subjectId}', '${subject.detailPath || item.detailPath}', '${escapeAttr(subject.title)}', ${subject.subjectType})">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="btn btn-secondary" onclick="openDetail('${subject.subjectId}', ${subject.subjectType}, '${subject.detailPath || item.detailPath}')">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                </div>
            </div>
        `;
        slider.appendChild(slide);

        // Dot
        const dot = document.createElement('div');
        dot.className = `hero-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToHeroSlide(index);
        dots.appendChild(dot);
    });

    // Auto-slide
    startHeroAutoSlide();
}

function startHeroAutoSlide() {
    if (heroSlideInterval) clearInterval(heroSlideInterval);
    heroSlideInterval = setInterval(() => slideHero(1), 6000);
}

function slideHero(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;

    slides[heroSlideIndex].classList.remove('active');
    dots[heroSlideIndex]?.classList.remove('active');

    heroSlideIndex = (heroSlideIndex + direction + slides.length) % slides.length;

    slides[heroSlideIndex].classList.add('active');
    dots[heroSlideIndex]?.classList.add('active');

    startHeroAutoSlide();
}

function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;

    slides[heroSlideIndex].classList.remove('active');
    dots[heroSlideIndex]?.classList.remove('active');

    heroSlideIndex = index;

    slides[heroSlideIndex].classList.add('active');
    dots[heroSlideIndex]?.classList.add('active');

    startHeroAutoSlide();
}

function renderPlatforms(platforms) {
    if (!platforms?.length) return;
    const list = document.getElementById('platformsList');
    list.innerHTML = platforms.map(p =>
        `<div class="platform-tag">${escapeHtml(p.name)}</div>`
    ).join('');
}

function renderContentRows(operatingList) {
    const container = document.getElementById('homeContent');
    container.innerHTML = '';

    const rows = operatingList.filter(op => op.type !== 'BANNER' && op.subjects?.length > 0);

    rows.forEach((row, index) => {
        const rowEl = document.createElement('section');
        rowEl.className = 'content-row fade-in';
        rowEl.style.animationDelay = `${index * 0.1}s`;

        const cards = row.subjects.map(subject => createMovieCardHTML(subject)).join('');

        rowEl.innerHTML = `
            <div class="row-header">
                <h2>${escapeHtml(row.title)}</h2>
            </div>
            <div class="movie-scroll">
                ${cards}
            </div>
        `;
        container.appendChild(rowEl);
    });
}

// ============================================
// Trending Page
// ============================================
async function loadTrending(append = false) {
    if (trendingLoading) return;
    trendingLoading = true;

    const btn = document.getElementById('loadMoreTrending');
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    if (!append) showLoading();

    const data = await MovieAPI.getTrending(trendingPage, 20);

    if (!append) hideLoading();

    if (data?.subjectList) {
        const grid = document.getElementById('trendingGrid');
        if (!append) grid.innerHTML = '';

        data.subjectList.forEach(subject => {
            const card = document.createElement('div');
            card.innerHTML = createMovieCardHTML(subject);
            const cardEl = card.firstElementChild;
            cardEl.style.width = '100%';
            grid.appendChild(cardEl);
        });
    }

    if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> Load More';
    trendingLoading = false;
}

function loadMoreTrending() {
    trendingPage++;
    loadTrending(true);
}

// ============================================
// Detail Page
// ============================================
async function loadDetail(subjectId, subjectType, detailPath, cachedSubject) {
    showLoading();
    const data = await MovieAPI.getDetail(subjectId);
    hideLoading();

    const container = document.getElementById('detailContent');

    // Try to find the subject info from the detail response or use cached
    let subject = cachedSubject;

    // If we have detail data, try to extract subject info
    // The detail-rec endpoint returns recommendations, so we use cached subject data
    const recommendations = data?.items || [];

    if (!subject) {
        // Fallback: create minimal subject from what we know
        subject = {
            subjectId,
            subjectType: subjectType || 1,
            title: 'Movie',
            detailPath: detailPath || '',
            genre: '',
            releaseDate: '',
            imdbRatingValue: '',
            cover: { url: '' },
            description: '',
            countryName: '',
            duration: 0,
            staffList: []
        };
    }

    const genres = subject.genre ? subject.genre.split(',') : [];
    const year = subject.releaseDate ? subject.releaseDate.split('-')[0] : '';
    const duration = subject.duration ? formatDuration(subject.duration) : '';
    const typeLabel = subject.subjectType === 2 ? 'TV Series' : 'Movie';
    const coverUrl = subject.cover?.url || '';

    container.innerHTML = `
        <div class="detail-hero">
            <div class="detail-backdrop" style="background-image: url('${coverUrl}')"></div>
            <div class="detail-content">
                <div class="detail-poster slide-up">
                    <img src="${coverUrl}" alt="${escapeAttr(subject.title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text fill=%22%236b6b80%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2216%22>No Image</text></svg>'">
                </div>
                <div class="detail-info slide-up" style="animation-delay: 0.1s">
                    <button class="back-btn" onclick="history.back(); navigateTo('home');">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <h1>${escapeHtml(subject.title)}</h1>
                    <div class="detail-meta">
                        ${subject.imdbRatingValue ? `
                            <div class="rating">
                                <i class="fas fa-star"></i> ${subject.imdbRatingValue}
                                ${subject.imdbRatingCount ? `<span style="color:var(--text-muted);font-weight:400;font-size:0.8rem">(${formatNumber(subject.imdbRatingCount)})</span>` : ''}
                            </div>
                        ` : ''}
                        <span><i class="fas fa-tag"></i> ${typeLabel}</span>
                        ${year ? `<span><i class="far fa-calendar"></i> ${year}</span>` : ''}
                        ${duration ? `<span><i class="far fa-clock"></i> ${duration}</span>` : ''}
                        ${subject.countryName ? `<span><i class="fas fa-globe"></i> ${subject.countryName}</span>` : ''}
                    </div>
                    <div class="detail-genres">
                        ${genres.map(g => `<span class="genre-pill">${g.trim()}</span>`).join('')}
                    </div>
                    ${subject.description ? `<p class="detail-description">${escapeHtml(subject.description)}</p>` : ''}
                    ${subject.staffList?.length ? `
                        <div class="detail-staff">
                            <h3>Cast</h3>
                            <div class="staff-list">
                                ${subject.staffList.map(staff => `
                                    <div class="staff-item">
                                        <img src="${staff.avatarUrl || ''}" alt="${escapeAttr(staff.name)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect fill=%22%231a1a2e%22 width=%2260%22 height=%2260%22/><text fill=%22%236b6b80%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22>?</text></svg>'">
                                        <div class="name">${escapeHtml(staff.name)}</div>
                                        ${staff.character ? `<div class="character">${escapeHtml(staff.character)}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="detail-actions">
                        <button class="btn btn-primary" onclick="openPlayer('${subject.subjectId}', '${subject.detailPath || detailPath}', '${escapeAttr(subject.title)}', ${subject.subjectType})">
                            <i class="fas fa-play"></i> Watch Now
                        </button>
                    </div>
                </div>
            </div>
        </div>

        ${subject.subjectType === 2 && subject.season > 0 ? renderEpisodesSection(subject) : ''}

        ${recommendations.length ? `
            <section class="recommendations-section">
                <div class="container">
                    <h2>You May Also Like</h2>
                    <div class="movie-scroll" style="padding: 16px 0;">
                        ${recommendations.map(rec => createMovieCardHTML(rec)).join('')}
                    </div>
                </div>
            </section>
        ` : ''}
    `;
}

function renderEpisodesSection(subject) {
    const seasons = subject.season || 1;
    let html = `
        <section class="episodes-section">
            <div class="container">
                <h2 style="margin-bottom: 16px;">Episodes</h2>
                <div class="season-selector">
                    ${Array.from({ length: seasons }, (_, i) => `
                        <button class="season-btn ${i === 0 ? 'active' : ''}" onclick="selectSeason(this, ${i + 1}, '${subject.subjectId}', '${subject.detailPath}', '${escapeAttr(subject.title)}')">
                            Season ${i + 1}
                        </button>
                    `).join('')}
                </div>
                <div class="episodes-grid" id="episodesGrid">
                    ${generateEpisodeCards(subject.subjectId, subject.detailPath, subject.title, 1, 10)}
                </div>
            </div>
        </section>
    `;
    return html;
}

function generateEpisodeCards(subjectId, detailPath, title, season, count) {
    let cards = '';
    for (let i = 1; i <= count; i++) {
        cards += `
            <div class="episode-card" onclick="openPlayer('${subjectId}', '${detailPath}', '${escapeAttr(title)} S${season}E${i}', 2, ${season}, ${i})">
                <div class="ep-number">Season ${season} · Episode ${i}</div>
                <div class="ep-title">Episode ${i}</div>
            </div>
        `;
    }
    return cards;
}

function selectSeason(btn, season, subjectId, detailPath, title) {
    document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('episodesGrid').innerHTML = generateEpisodeCards(subjectId, detailPath, title, season, 10);
}

// ============================================
// Player Page
// ============================================
async function loadPlayer(subjectId, detailPath, title, subjectType, se = 1, ep = 1) {
    showLoading();
    const data = await MovieAPI.getPlay(subjectId, detailPath, se, ep);
    hideLoading();

    const container = document.getElementById('playerContent');

    let videoHTML = '';
    let qualityButtons = '';
    let subtitleHTML = '';

    if (data) {
        // Try to find video sources
        const sources = data.sources || data.links || [];
        const subtitles = data.subtitles || data.subs || [];

        if (sources.length > 0) {
            // Use the first available source
            const source = sources[0];
            const videoUrl = source.url || source.link || '';

            if (videoUrl) {
                if (videoUrl.includes('.m3u8')) {
                    videoHTML = `
                        <video id="videoPlayer" controls autoplay crossorigin="anonymous">
                            <source src="${videoUrl}" type="application/x-mpegURL">
                        </video>
                    `;
                } else {
                    videoHTML = `
                        <video id="videoPlayer" controls autoplay crossorigin="anonymous">
                            <source src="${videoUrl}" type="video/mp4">
                        </video>
                    `;
                }
            }

            // Quality buttons
            qualityButtons = sources.map((s, i) => `
                <button class="quality-btn ${i === 0 ? 'active' : ''}" onclick="switchQuality(this, '${s.url || s.link || ''}')">
                    ${s.quality || s.label || `Source ${i + 1}`}
                </button>
            `).join('');
        }

        if (subtitles.length > 0) {
            subtitleHTML = `
                <div class="subtitle-list">
                    <h3>Subtitles Available</h3>
                    <div class="subtitle-tags">
                        ${subtitles.map(sub => `
                            <span class="subtitle-tag">${sub.language || sub.lang || 'Unknown'}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    if (!videoHTML) {
        videoHTML = `
            <div class="video-placeholder">
                <i class="fas fa-play-circle"></i>
                <p>Video source is loading or unavailable</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">The server may be processing your request. Try again in a moment.</p>
            </div>
        `;
    }

    const episodeInfo = subjectType === 2 ? ` · Season ${se}, Episode ${ep}` : '';

    container.innerHTML = `
        <div class="player-wrapper">
            <div class="video-container">
                ${videoHTML}
            </div>
            <div class="player-info">
                <a class="back-link" onclick="openDetail('${subjectId}', ${subjectType || 1}, '${detailPath}')">
                    <i class="fas fa-arrow-left"></i> Back to Details
                </a>
                <h1>${escapeHtml(title)}${episodeInfo}</h1>
                <div class="player-meta">
                    Now Playing${episodeInfo}
                </div>
                ${qualityButtons ? `
                    <div class="quality-selector">
                        ${qualityButtons}
                    </div>
                ` : ''}
                ${subtitleHTML}
            </div>
        </div>
    `;
}

function switchQuality(btn, url) {
    document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const video = document.getElementById('videoPlayer');
    if (video && url) {
        const currentTime = video.currentTime;
        video.src = url;
        video.currentTime = currentTime;
        video.play();
    }
}

// ============================================
// Helper: Open Detail / Player
// ============================================
function openDetail(subjectId, subjectType, detailPath, subject) {
    navigateTo('detail', { subjectId, subjectType, detailPath, subject });
}

function openPlayer(subjectId, detailPath, title, subjectType, se, ep) {
    navigateTo('player', { subjectId, detailPath, title, subjectType, se, ep });
}

// ============================================
// Movie Card HTML Generator
// ============================================
function createMovieCardHTML(subject) {
    const coverUrl = subject.cover?.url || '';
    const year = subject.releaseDate ? subject.releaseDate.split('-')[0] : '';
    const typeLabel = subject.subjectType === 2 ? 'TV' : 'Movie';
    const genres = subject.genre ? subject.genre.split(',')[0].trim() : '';

    // Serialize subject data for passing to detail page
    const subjectJSON = encodeURIComponent(JSON.stringify({
        subjectId: subject.subjectId,
        subjectType: subject.subjectType,
        title: subject.title,
        description: subject.description || '',
        releaseDate: subject.releaseDate,
        duration: subject.duration,
        genre: subject.genre,
        cover: subject.cover,
        countryName: subject.countryName,
        imdbRatingValue: subject.imdbRatingValue,
        imdbRatingCount: subject.imdbRatingCount,
        detailPath: subject.detailPath,
        staffList: subject.staffList || [],
        season: subject.season || 0,
        subtitles: subject.subtitles || ''
    }));

    return `
        <div class="movie-card" onclick="openDetail('${subject.subjectId}', ${subject.subjectType}, '${subject.detailPath || ''}', JSON.parse(decodeURIComponent('${subjectJSON}')))">
            <div class="movie-card-poster">
                <img src="${coverUrl}" alt="${escapeAttr(subject.title)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text fill=%22%236b6b80%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>No Image</text></svg>'">
                <div class="overlay">
                    <div class="play-icon">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                ${subject.imdbRatingValue ? `
                    <div class="rating-badge">
                        <i class="fas fa-star"></i> ${subject.imdbRatingValue}
                    </div>
                ` : ''}
                <div class="type-badge">${typeLabel}</div>
            </div>
            <div class="movie-card-info">
                <h3>${escapeHtml(subject.title)}</h3>
                <div class="meta">
                    ${year ? `<span>${year}</span>` : ''}
                    ${genres ? `<span>${genres}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Utility Functions
// ============================================
function formatDuration(seconds) {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function createSkeletonCards(count = 6) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-poster"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            </div>
        `;
    }
    return html;
}

// ============================================
// Scroll Events
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    // Navbar background on scroll
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Back to top button
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

// ============================================
// Search functionality
// ============================================
let searchTimeout = null;
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim().toLowerCase();

    searchTimeout = setTimeout(() => {
        if (query.length < 2) return;

        // Search through home data content rows
        if (homeData?.operatingList) {
            const allSubjects = [];
            homeData.operatingList.forEach(op => {
                if (op.subjects) {
                    allSubjects.push(...op.subjects);
                }
                if (op.banner?.items) {
                    op.banner.items.forEach(item => {
                        if (item.subject) allSubjects.push(item.subject);
                    });
                }
            });

            const results = allSubjects.filter(s =>
                s.title?.toLowerCase().includes(query) ||
                s.genre?.toLowerCase().includes(query) ||
                s.countryName?.toLowerCase().includes(query)
            );

            if (results.length > 0) {
                // Show results on trending page grid
                const grid = document.getElementById('trendingGrid');
                grid.innerHTML = '';
                results.forEach(subject => {
                    const card = document.createElement('div');
                    card.innerHTML = createMovieCardHTML(subject);
                    const cardEl = card.firstElementChild;
                    cardEl.style.width = '100%';
                    grid.appendChild(cardEl);
                });

                document.getElementById('searchOverlay').classList.remove('active');
                navigateTo('trending');

                // Update header
                const header = document.querySelector('#page-trending .page-header h1');
                if (header) header.innerHTML = `<i class="fas fa-search"></i> Results for "${escapeHtml(query)}"`;
            }
        }
    }, 400);
});

// Enter key for search
document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.target.dispatchEvent(new Event('input'));
    }
});

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('home');
});
