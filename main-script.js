// Initialize AOS animations
AOS.init({ duration: 500, once: true });

// ========================================================
// Live Google Sheets Data Sources
// ========================================================
const STANDINGS_JP_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbkE2wbV5LWkVIGXpJGdbSG9LxUopGIXMuOjyt5w0fkb3olKb6ueMyDWH3hFiS6tbdQfQv5VZdMct3/pub?gid=0&single=true&output=csv";
const STANDINGS_EN_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbkE2wbV5LWkVIGXpJGdbSG9LxUopGIXMuOjyt5w0fkb3olKb6ueMyDWH3hFiS6tbdQfQv5VZdMct3/pub?gid=1135525613&single=true&output=csv";
const MEDIA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS08jJrOzuXOjKwhtpfvUq55UaYJgYfq8bBmrWh4yjk_7ZoehVhZ_WtEa2eWrwhZ8zqHWR_rD3quKCA/pub?gid=0&single=true&output=csv";
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS08jJrOzuXOjKwhtpfvUq55UaYJgYfq8bBmrWh4yjk_7ZoehVhZ_WtEa2eWrwhZ8zqHWR_rD3quKCA/pub?gid=914624242&single=true&output=csv";

// Helper: Detect mobile device or viewport
function isMobileDevice() {
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Helper: YouTube Thumbnail
function getYoutubeThumbnail(url, fallbackThumb) {
  if (fallbackThumb && fallbackThumb.trim() !== '') return fallbackThumb.trim();
  if (!url) return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
}

// 1. Fetch & Render Top Leaders in Standings Box
function loadTopLeaders() {
  Papa.parse(STANDINGS_JP_URL, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(res) {
      const rows = (res.data || [])
        .filter(r => r.Trainer && String(r.Trainer).trim() !== "" && r.Division && r.Division.toLowerCase() === 'graded')
        .sort((a,b) => (b.Points || 0) - (a.Points || 0));
      if (rows.length > 0) {
        document.getElementById('topJpName').innerText = rows[0].Trainer;
        document.getElementById('topJpPoints').innerText = (rows[0].Points || 0) + ' pts';
        if (rows[0].Avatar) {
          document.getElementById('topJpAvatar').src = rows[0].Avatar;
        } else {
          document.getElementById('topJpAvatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(rows[0].Trainer)}`;
        }
      }
    }
  });

  Papa.parse(STANDINGS_EN_URL, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(res) {
      const rows = (res.data || [])
        .filter(r => r.Trainer && String(r.Trainer).trim() !== "" && r.Division && r.Division.toLowerCase() === 'graded')
        .sort((a,b) => (b.Points || 0) - (a.Points || 0));
      if (rows.length > 0) {
        document.getElementById('topEnName').innerText = rows[0].Trainer;
        document.getElementById('topEnPoints').innerText = (rows[0].Points || 0) + ' pts';
        if (rows[0].Avatar) {
          document.getElementById('topEnAvatar').src = rows[0].Avatar;
        } else {
          document.getElementById('topEnAvatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(rows[0].Trainer)}`;
        }
      }
    }
  });
}

// 2. Fetch & Render Latest 6 Media Thumbnails (Sorted by Newest Date)
function loadMedia() {
  const grid = document.getElementById('mediaGrid');

  function getCategoryBadge(cat) {
    if (!cat || cat.trim() === '') return '';
    const c = cat.toLowerCase();
    let badgeClass = '';
    if (c.includes('race')) badgeClass = 'badge-races';
    else if (c.includes('classic') || c.includes('show')) badgeClass = 'badge-show';
    else if (c.includes('guide')) badgeClass = 'badge-guide';

    return `<span class="media-category-badge ${badgeClass}">${cat.trim()}</span>`;
  }

  Papa.parse(MEDIA_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(res) {
      const items = (res.data || [])
        .filter(m => m.Title && String(m.Title).trim() !== "")
        .map((m, index) => {
          const parsedTime = m.Date ? new Date(m.Date).getTime() : NaN;
          return {
            ...m,
            timestamp: !isNaN(parsedTime) ? parsedTime : index
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 6);

      if (items.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-3">No media items recorded yet.</div>`;
        return;
      }

      grid.innerHTML = items.map(m => {
        const link = m.YouTube_URL && m.YouTube_URL.trim() !== "" ? m.YouTube_URL : 'media.html';
        const thumb = getYoutubeThumbnail(m.YouTube_URL, m.Thumbnail_URL);
        const catBadge = getCategoryBadge(m.Category);

        return `
          <div class="col-4">
            <a href="${link}" target="_blank" class="media-card d-block">
              ${catBadge}
              <img src="${thumb}" alt="${m.Title}">
              <i class="bi bi-play-circle-fill media-play-icon"></i>
              <div class="media-title-overlay">${m.Title}</div>
            </a>
          </div>
        `;
      }).join('');
    },
    error: function(err) {
      console.error("Failed to load media CSV:", err);
      grid.innerHTML = `<div class="col-12 text-center text-muted py-3">Could not load media feed.</div>`;
    }
  });
}

// 3. Fetch & Render Latest 2-3 News Articles (Mobile Direct Link Support)
function loadNews() {
  const list = document.getElementById('newsList');

  Papa.parse(NEWS_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(res) {
      const items = (res.data || [])
        .filter(n => n.Title && String(n.Title).trim() !== "")
        .map((n, index) => {
          const parsedTime = n.Date ? new Date(n.Date).getTime() : NaN;
          return {
            ...n,
            timestamp: !isNaN(parsedTime) ? parsedTime : index
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);

      if (items.length === 0) {
        list.innerHTML = `<div class="text-center text-muted py-3">No articles published yet.</div>`;
        return;
      }

      list.innerHTML = items.map(n => {
        const hasDoc = n.Doc_URL && n.Doc_URL.trim() !== "";
        const mobile = isMobileDevice();

        // On mobile: link directly to the Google Doc in a new tab. On desktop: open in article.html
        const articleLink = hasDoc
          ? (mobile ? n.Doc_URL.trim() : `article.html?doc=${encodeURIComponent(n.Doc_URL.trim())}`)
          : 'news.html';

        const targetAttr = (hasDoc && mobile) ? 'target="_blank"' : '';
        const thumb = n.Thumbnail_URL && n.Thumbnail_URL.trim() !== "" ? n.Thumbnail_URL : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300';

        return `
          <a href="${articleLink}" ${targetAttr} class="news-card">
            <img src="${thumb}" class="news-thumb" alt="${n.Title}">
            <div>
              <div class="news-title">${n.Title}</div>
              <div class="news-meta">By ${n.Author || 'TDS'} &bull; ${n.Date || ''}</div>
              <div class="news-desc">${n.Synopsis || ''}</div>
            </div>
          </a>
        `;
      }).join('');
    },
    error: function(err) {
      console.error("Failed to load news CSV:", err);
      list.innerHTML = `<div class="text-center text-muted py-3">Could not load news feed.</div>`;
    }
  });
}

// Run feeds on load
loadTopLeaders();
loadMedia();
loadNews();