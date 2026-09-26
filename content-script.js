// Initialize AOS animations
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 500, once: true });
}

// Live Google Sheets Data Sources
const MEDIA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS08jJrOzuXOjKwhtpfvUq55UaYJgYfq8bBmrWh4yjk_7ZoehVhZ_WtEa2eWrwhZ8zqHWR_rD3quKCA/pub?gid=0&single=true&output=csv";
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS08jJrOzuXOjKwhtpfvUq55UaYJgYfq8bBmrWh4yjk_7ZoehVhZ_WtEa2eWrwhZ8zqHWR_rD3quKCA/pub?gid=914624242&single=true&output=csv";

// Helper: Detect mobile device or viewport
function isMobileDevice() {
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Helper: YouTube Thumbnail
function getYoutubeThumbnail(url, fallbackThumb) {
  if (fallbackThumb && fallbackThumb.trim() !== '') return fallbackThumb.trim();
  if (!url) return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
}

// Helper: Category badge class
function getCategoryBadgeClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('race') || c.includes('tds')) return 'badge-races';
  if (c.includes('classic') || c.includes('show') || c.includes('interview')) return 'badge-show';
  if (c.includes('guide')) return 'badge-guide';
  if (c.includes('uma')) return 'badge-umamusume';
  return '';
}

// ========================================================
// CONTROLLER 1: MEDIA GALLERY (media.html)
// ========================================================
const mediaGalleryEl = document.getElementById('mediaGallery');
if (mediaGalleryEl) {
  let allMediaData = [];
  let currentCategory = 'ALL';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 9;

  function loadMedia() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.remove('d-none');

    Papa.parse(MEDIA_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(res) {
        if (loader) loader.classList.add('d-none');
        allMediaData = (res.data || [])
          .filter(item => item.Title && String(item.Title).trim() !== "")
          .map((item, index) => {
            const parsed = item.Date ? new Date(item.Date).getTime() : NaN;
            return {
              Title: String(item.Title).trim(),
              Category: String(item.Category || 'Media').trim(),
              YouTube_URL: String(item.YouTube_URL || '').trim(),
              Thumbnail_URL: item.Thumbnail_URL ? String(item.Thumbnail_URL).trim() : '',
              Date: item.Date ? String(item.Date).trim() : '',
              timestamp: !isNaN(parsed) ? parsed : index
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        renderGallery();
      },
      error: function(err) {
        if (loader) loader.classList.add('d-none');
        mediaGalleryEl.innerHTML = `<div class="col-12 text-center text-muted py-5">Could not load media feed.</div>`;
      }
    });
  }

  function renderGallery() {
    const pagination = document.getElementById('paginationControls');
    const filtered = allMediaData.filter(item => {
      if (currentCategory === 'ALL') return true;
      return item.Category.toLowerCase() === currentCategory.toLowerCase();
    });

    if (filtered.length === 0) {
      mediaGalleryEl.innerHTML = `<div class="col-12 text-center text-muted py-5">No media found under "${currentCategory}".</div>`;
      if (pagination) pagination.classList.add('d-none');
      return;
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    mediaGalleryEl.innerHTML = pageItems.map(m => {
      const thumb = getYoutubeThumbnail(m.YouTube_URL, m.Thumbnail_URL);
      const link = m.YouTube_URL || '#';
      const badgeClass = getCategoryBadgeClass(m.Category);

      return `
        <div class="col-md-6 col-lg-4">
          <a href="${link}" target="_blank" class="media-card">
            <div class="thumbnail-container">
              <span class="category-tag ${badgeClass}">${m.Category}</span>
              <img src="${thumb}" alt="${m.Title}" loading="lazy">
              <i class="bi bi-play-circle-fill media-play-overlay"></i>
            </div>
            <div class="p-3 d-flex flex-column flex-grow-1 justify-content-between">
              <div class="media-item-title">${m.Title}</div>
              <div class="small text-muted mt-2"><i class="bi bi-calendar3"></i> ${m.Date || '2026'}</div>
            </div>
          </a>
        </div>
      `;
    }).join('');

    renderPagination(totalPages, pagination);
  }

  window.filterCategory = function(cat) {
    currentCategory = cat;
    currentPage = 1;
    document.querySelectorAll('#categoryFilters .filter-pill').forEach(btn => {
      btn.classList.toggle('active', cat === 'ALL' ? btn.innerText.includes('All Media') : btn.innerText.toLowerCase().includes(cat.toLowerCase()));
    });
    renderGallery();
  };

  window.goToPage = function(p) {
    currentPage = p;
    renderGallery();
    document.getElementById('categoryFilters').scrollIntoView({ behavior: 'smooth' });
  };

  loadMedia();
}

// ========================================================
// CONTROLLER 2: NEWS DIRECTORY (news.html)
// ========================================================
const newsGridEl = document.getElementById('newsGrid');
if (newsGridEl) {
  let allNewsData = [];
  let currentCategory = 'ALL';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 6;

  function loadNews() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.remove('d-none');

    Papa.parse(NEWS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(res) {
        if (loader) loader.classList.add('d-none');
        allNewsData = (res.data || [])
          .filter(item => item.Title && String(item.Title).trim() !== "")
          .map((item, index) => {
            const parsed = item.Date ? new Date(item.Date).getTime() : NaN;
            return {
              Title: String(item.Title).trim(),
              Category: String(item.Category || 'TDS News').trim(),
              Author: String(item.Author || 'TDS Editorial').trim(),
              Date: item.Date ? String(item.Date).trim() : '',
              Synopsis: item.Synopsis ? String(item.Synopsis).trim() : '',
              Doc_URL: item.Doc_URL ? String(item.Doc_URL).trim() : '',
              Thumbnail_URL: item.Thumbnail_URL ? String(item.Thumbnail_URL).trim() : '',
              timestamp: !isNaN(parsed) ? parsed : index
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        renderGrid();
      },
      error: function(err) {
        if (loader) loader.classList.add('d-none');
        newsGridEl.innerHTML = `<div class="col-12 text-center text-muted py-5">Could not load news feed.</div>`;
      }
    });
  }

  function renderGrid() {
    const pagination = document.getElementById('paginationControls');
    const filtered = allNewsData.filter(item => {
      if (currentCategory === 'ALL') return true;
      return item.Category.toLowerCase() === currentCategory.toLowerCase();
    });

    if (filtered.length === 0) {
      newsGridEl.innerHTML = `<div class="col-12 text-center text-muted py-5">No articles found under "${currentCategory}".</div>`;
      if (pagination) pagination.classList.add('d-none');
      return;
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    newsGridEl.innerHTML = pageItems.map(n => {
      const thumb = n.Thumbnail_URL && n.Thumbnail_URL !== "" ? n.Thumbnail_URL : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
      const hasDoc = n.Doc_URL && n.Doc_URL.trim() !== "";
      const mobile = isMobileDevice();

      // On mobile: directly open doc in new tab. On desktop: open in article.html
      const articleLink = hasDoc
        ? (mobile ? n.Doc_URL.trim() : `article.html?doc=${encodeURIComponent(n.Doc_URL.trim())}`)
        : '#';
      const targetAttr = (hasDoc && mobile) ? 'target="_blank"' : '';
      const badgeClass = getCategoryBadgeClass(n.Category);

      return `
        <div class="col-md-6 col-lg-4">
          <a href="${articleLink}" ${targetAttr} class="article-card-item">
            <div class="article-thumb-wrap">
              <span class="category-tag ${badgeClass}">${n.Category}</span>
              <img src="${thumb}" alt="${n.Title}" loading="lazy">
            </div>
            <div class="article-body">
              <div>
                <div class="article-meta">
                  <span><i class="bi bi-person-fill text-danger"></i> ${n.Author}</span>
                  <span><i class="bi bi-calendar3"></i> ${n.Date || '2026'}</span>
                </div>
                <h3 class="article-title">${n.Title}</h3>
                <p class="article-synopsis">${n.Synopsis || 'Click to read full dispatch report...'}</p>
              </div>
              <div class="article-read-more">
                Read Dispatch <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </a>
        </div>
      `;
    }).join('');

    renderPagination(totalPages, pagination);
  }

  window.filterCategory = function(cat) {
    currentCategory = cat;
    currentPage = 1;
    document.querySelectorAll('#categoryFilters .filter-pill').forEach(btn => {
      btn.classList.toggle('active', cat === 'ALL' ? btn.innerText.includes('All News') : btn.innerText.toLowerCase().includes(cat.toLowerCase()));
    });
    renderGrid();
  };

  window.goToPage = function(p) {
    currentPage = p;
    renderGrid();
    document.getElementById('categoryFilters').scrollIntoView({ behavior: 'smooth' });
  };

  loadNews();
}

// Shared Pagination Builder
function renderPagination(totalPages, container) {
  if (!container) return;
  if (totalPages > 1) {
    container.classList.remove('d-none');
    let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><i class="bi bi-chevron-left"></i> Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next <i class="bi bi-chevron-right"></i></button>`;
    container.innerHTML = html;
  } else {
    container.classList.add('d-none');
  }
}

// ========================================================
// CONTROLLER 3: ARTICLE VIEWER (article.html)
// ========================================================
const docFrameEl = document.getElementById('docFrame');
if (docFrameEl) {
  const urlParams = new URLSearchParams(window.location.search);
  let docUrl = urlParams.get('doc');

  const loader = document.getElementById('loadingIndicator');
  const frameWrap = document.getElementById('frameWrapper');
  const errorBox = document.getElementById('errorState');
  const popout = document.getElementById('popoutLink');

  if (!docUrl || docUrl.trim() === '') {
    if (loader) loader.classList.add('d-none');
    if (errorBox) errorBox.classList.remove('d-none');
    if (popout) popout.classList.add('d-none');
  } else {
    docUrl = decodeURIComponent(docUrl.trim());

    // MOBILE AUTO-REDIRECT: If visiting article.html on phone, redirect directly to Google Doc!
    if (isMobileDevice()) {
      window.location.replace(docUrl);
    } else {
      let embedUrl = docUrl;
      if (!embedUrl.includes('embedded=true')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'embedded=true';
      }

      if (popout) popout.href = docUrl;
      docFrameEl.src = embedUrl;
    }
  }

  window.onFrameLoad = function() {
    if (docFrameEl.src && docFrameEl.src !== 'about:blank') {
      if (loader) loader.classList.add('d-none');
      if (frameWrap) frameWrap.classList.remove('d-none');
    }
  };
}