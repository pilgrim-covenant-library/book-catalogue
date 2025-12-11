/**
 * PCC Library Catalogue - Enhanced Features
 * Sprint 1: Visual Transformation
 */

(function() {
  'use strict';

  // ==========================================
  // Configuration
  // ==========================================
  const CONFIG = {
    OPEN_LIBRARY_API: 'https://covers.openlibrary.org/b',
    COVER_SIZE: 'M', // S, M, L
    VIEW_MODE_KEY: 'pcc_view_mode',
    THEME_KEY: 'pcc_theme',
    SORT_KEY: 'pcc_sort_preference'
  };

  // ==========================================
  // State Management
  // ==========================================
  const State = {
    currentView: localStorage.getItem(CONFIG.VIEW_MODE_KEY) || 'table',
    currentTheme: localStorage.getItem(CONFIG.THEME_KEY) || 'light',
    currentSort: localStorage.getItem(CONFIG.SORT_KEY) || 'title',
    books: [],
    filteredBooks: []
  };

  // ==========================================
  // Theme Management
  // ==========================================
  const ThemeManager = {
    init() {
      this.apply(State.currentTheme);
      this.attachListeners();
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      State.currentTheme = theme;
      localStorage.setItem(CONFIG.THEME_KEY, theme);
      this.updateToggleIcon();
    },

    toggle() {
      const newTheme = State.currentTheme === 'light' ? 'dark' : 'light';
      this.apply(newTheme);
    },

    updateToggleIcon() {
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) {
        toggle.innerHTML = State.currentTheme === 'light'
          ? '<span>🌙</span><span class="toggle-text">Dark</span>'
          : '<span>☀️</span><span class="toggle-text">Light</span>';
      }
    },

    attachListeners() {
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => this.toggle());
      }
    }
  };

  // ==========================================
  // View Mode Management
  // ==========================================
  const ViewManager = {
    init() {
      this.setView(State.currentView);
      this.attachListeners();
    },

    setView(viewMode) {
      State.currentView = viewMode;
      localStorage.setItem(CONFIG.VIEW_MODE_KEY, viewMode);

      // Hide all views
      document.querySelectorAll('[data-view]').forEach(el => {
        el.classList.add('hidden');
      });

      // Show selected view
      const activeView = document.querySelector(`[data-view="${viewMode}"]`);
      if (activeView) {
        activeView.classList.remove('hidden');
      }

      // Update button states
      document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.querySelector(`[data-view-mode="${viewMode}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }

      this.renderBooks();
    },

    attachListeners() {
      document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const viewMode = e.currentTarget.getAttribute('data-view-mode');
          this.setView(viewMode);
        });
      });
    },

    renderBooks() {
      switch(State.currentView) {
        case 'card':
          this.renderCardView();
          break;
        case 'list':
          this.renderListView();
          break;
        case 'table':
          // Table view handled by DataTables
          break;
      }
    },

    renderCardView() {
      const container = document.querySelector('[data-view="card"]');
      if (!container) return;

      const books = State.filteredBooks.length > 0 ? State.filteredBooks : State.books;

      container.innerHTML = books.map(book => this.createBookCard(book)).join('');

      // Lazy load images
      this.lazyLoadImages();
    },

    renderListView() {
      const container = document.querySelector('[data-view="list"]');
      if (!container) return;

      const books = State.filteredBooks.length > 0 ? State.filteredBooks : State.books;

      container.innerHTML = books.map(book => this.createBookListItem(book)).join('');

      // Lazy load images
      this.lazyLoadImages();
    },

    createBookCard(book) {
      const coverUrl = CoverManager.getCoverUrl(book);
      const badges = this.generateBadges(book);

      return `
        <div class="book-card" data-book-id="${book.id}">
          <div class="book-cover-container">
            ${coverUrl
              ? `<img class="book-cover lazy" data-src="${coverUrl}" alt="${book.title} cover">`
              : `<div class="book-cover-placeholder">
                   <div class="book-cover-icon">📚</div>
                   <div>${book.title.substring(0, 50)}${book.title.length > 50 ? '...' : ''}</div>
                 </div>`
            }
          </div>
          <div class="book-card-content">
            <h3 class="book-title">${book.title}</h3>
            <div class="book-author">${book.author}</div>
            <div class="book-meta">
              ${book.year ? `<span class="book-meta-item">📅 ${book.year}</span>` : ''}
              ${book.callNumber ? `<span class="book-meta-item">📍 ${book.callNumber}</span>` : ''}
            </div>
            ${badges.length > 0 ? `<div class="book-badges">${badges.join('')}</div>` : ''}
          </div>
        </div>
      `;
    },

    createBookListItem(book) {
      const coverUrl = CoverManager.getCoverUrl(book);

      return `
        <div class="book-list-item" data-book-id="${book.id}">
          <div class="book-list-cover">
            ${coverUrl
              ? `<img class="book-cover lazy" data-src="${coverUrl}" alt="${book.title} cover" style="width:100%;height:100%;object-fit:cover;">`
              : `<div style="width:100%;height:100%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📚</div>`
            }
          </div>
          <div class="book-list-info">
            <div class="book-list-title">${book.title}</div>
            <div class="book-list-author">${book.author}</div>
            <div class="book-list-meta">
              ${book.year ? `<span>📅 ${book.year}</span>` : ''}
              ${book.callNumber ? `<span>📍 ${book.callNumber}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    },

    generateBadges(book) {
      const badges = [];

      // Check if book has e-book (from ebook_links data)
      if (window.ebookLinks && window.ebookLinks[`${book.author} - ${book.title}`]) {
        badges.push('<span class="badge badge-ebook">📖 E-book</span>');
      }

      // Check if author has biography
      if (window.authorBiographies && window.authorBiographies[book.author]) {
        badges.push('<span class="badge badge-bio">⭐ Bio</span>');
      }

      // Show year badge if available
      if (book.year) {
        badges.push(`<span class="badge badge-year">📅 ${book.year}</span>`);
      }

      return badges;
    },

    lazyLoadImages() {
      const lazyImages = document.querySelectorAll('.lazy');

      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              img.onload = () => img.style.opacity = '1';
              img.onerror = () => {
                img.parentElement.innerHTML = `
                  <div class="book-cover-placeholder">
                    <div class="book-cover-icon">📚</div>
                  </div>
                `;
              };
              imageObserver.unobserve(img);
            }
          });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(img => {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
        });
      }
    }
  };

  // ==========================================
  // Cover Image Management
  // ==========================================
  const CoverManager = {
    cache: {},

    getCoverUrl(book) {
      // Check cache first
      if (this.cache[book.id]) {
        return this.cache[book.id];
      }

      // Try ISBN first
      if (book.isbn) {
        const url = `${CONFIG.OPEN_LIBRARY_API}/isbn/${book.isbn}-${CONFIG.COVER_SIZE}.jpg`;
        this.cache[book.id] = url;
        return url;
      }

      // Try title + author (less reliable)
      // For now, return null and show placeholder
      return null;
    },

    preloadPopularCovers() {
      // Preload covers for first 20 books
      const booksToPreload = State.books.slice(0, 20);
      booksToPreload.forEach(book => {
        const url = this.getCoverUrl(book);
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  };

  // ==========================================
  // Search Enhancement
  // ==========================================
  const SearchManager = {
    init() {
      const searchInput = document.querySelector('.main-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce((e) => {
          this.performSearch(e.target.value);
        }, 300));
      }
    },

    performSearch(query) {
      if (!query.trim()) {
        State.filteredBooks = [];
        ViewManager.renderBooks();
        return;
      }

      const lowerQuery = query.toLowerCase();
      State.filteredBooks = State.books.filter(book => {
        return book.title.toLowerCase().includes(lowerQuery) ||
               book.author.toLowerCase().includes(lowerQuery) ||
               (book.callNumber && book.callNumber.toLowerCase().includes(lowerQuery)) ||
               (book.year && book.year.toString().includes(query));
      });

      ViewManager.renderBooks();
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // ==========================================
  // Data Loader
  // ==========================================
  const DataLoader = {
    loadFromDataTable() {
      // Extract book data from existing DataTable
      const table = $('#catalogue-table').DataTable();
      if (!table) return;

      const data = table.rows().data();
      State.books = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        State.books.push({
          author: row[0],
          title: row[1],
          id: row[2],
          callNumber: row[3],
          year: row[4],
          copy: row[5],
          isbn: this.extractISBN(row) // Try to extract from publication dates data
        });
      }

      console.log(`Loaded ${State.books.length} books`);

      // Load publication dates if available
      this.enrichWithPublicationDates();

      // Initial render
      ViewManager.renderBooks();
      CoverManager.preloadPopularCovers();
    },

    extractISBN(row) {
      // Check if we have publication dates data with ISBN
      if (window.publicationDates) {
        const bookId = row[2];
        const pubData = window.publicationDates[bookId];
        if (pubData && pubData.isbn) {
          return pubData.isbn.replace(/-/g, ''); // Remove hyphens
        }
      }
      return null;
    },

    enrichWithPublicationDates() {
      if (!window.publicationDates) return;

      State.books = State.books.map(book => {
        const pubData = window.publicationDates[book.id];
        if (pubData) {
          return {
            ...book,
            year: pubData.year || book.year,
            isbn: pubData.isbn || book.isbn,
            publisher: pubData.publisher
          };
        }
        return book;
      });
    }
  };

  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    console.log('🚀 PCC Library Catalogue - Enhanced Version Loading...');

    // Initialize theme first
    ThemeManager.init();

    // Wait for DOM and DataTable to be ready
    $(document).ready(function() {
      // Wait a bit for DataTable to initialize
      setTimeout(() => {
        DataLoader.loadFromDataTable();
        ViewManager.init();
        SearchManager.init();

        console.log('✅ Enhanced features loaded successfully!');
      }, 1000);
    });
  }

  // Start initialization
  init();

  // Expose State for debugging
  window.PCC = {
    State,
    ThemeManager,
    ViewManager,
    CoverManager
  };

})();
