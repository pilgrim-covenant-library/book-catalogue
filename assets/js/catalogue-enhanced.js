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
  // Sprint 2: Faceted Filters Manager
  // ==========================================
  const FiltersManager = {
    init() {
      this.buildFilters();
      this.attachListeners();
    },

    buildFilters() {
      // Extract unique authors, years, categories from books
      const authors = [...new Set(State.books.map(b => b.author))].sort();
      const years = [...new Set(State.books.map(b => b.year).filter(y => y))].sort((a, b) => b - a);

      // Categorize books by call number patterns
      const categories = this.extractCategories();

      // Count books with e-books and bios
      const hasEbook = State.books.filter(b => window.ebookLinks && window.ebookLinks[`${b.author} - ${b.title}`]).length;
      const hasBio = State.books.filter(b => window.authorBiographies && window.authorBiographies[b.author]).length;

      State.filterOptions = {
        authors,
        years,
        categories,
        hasEbook,
        hasBio
      };

      State.activeFilters = {
        authors: [],
        yearRange: [Math.min(...years), Math.max(...years)],
        categories: [],
        hasEbook: false,
        hasBio: false
      };
    },

    extractCategories() {
      const categories = new Map();

      State.books.forEach(book => {
        if (!book.callNumber) return;

        // Extract category from call number (first letters/numbers)
        const match = book.callNumber.match(/^([A-Z]+)/);
        if (match) {
          const cat = match[1];
          categories.set(cat, (categories.get(cat) || 0) + 1);
        }
      });

      return Array.from(categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },

    attachListeners() {
      // Filters toggle
      const toggle = document.querySelector('.filters-toggle');
      if (toggle) {
        toggle.addEventListener('click', this.toggleFilters.bind(this));
      }

      // Clear filters
      const clearBtn = document.querySelector('.clear-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', this.clearFilters.bind(this));
      }

      // Filter checkboxes
      document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', this.applyFilters.bind(this));
      });
    },

    toggleFilters() {
      const sidebar = document.querySelector('.filters-sidebar');
      const mainContainer = document.querySelector('.main-container');

      if (sidebar) {
        sidebar.classList.toggle('collapsed');
        mainContainer.classList.toggle('filters-collapsed');
        mainContainer.classList.toggle('with-filters');
      }
    },

    applyFilters() {
      // Get selected filters
      const authorChecks = document.querySelectorAll('.filter-authors input:checked');
      const categoryChecks = document.querySelectorAll('.filter-categories input:checked');
      const hasEbookCheck = document.querySelector('.filter-ebook input:checked');
      const hasBioCheck = document.querySelector('.filter-bio input:checked');

      State.activeFilters.authors = Array.from(authorChecks).map(cb => cb.value);
      State.activeFilters.categories = Array.from(categoryChecks).map(cb => cb.value);
      State.activeFilters.hasEbook = !!hasEbookCheck;
      State.activeFilters.hasBio = !!hasBioCheck;

      // Filter books
      State.filteredBooks = State.books.filter(book => {
        // Author filter
        if (State.activeFilters.authors.length > 0 && !State.activeFilters.authors.includes(book.author)) {
          return false;
        }

        // Category filter
        if (State.activeFilters.categories.length > 0) {
          const bookCat = book.callNumber ? book.callNumber.match(/^([A-Z]+)/)?.[1] : null;
          if (!bookCat || !State.activeFilters.categories.includes(bookCat)) {
            return false;
          }
        }

        // E-book filter
        if (State.activeFilters.hasEbook) {
          const hasEbook = window.ebookLinks && window.ebookLinks[`${book.author} - ${book.title}`];
          if (!hasEbook) return false;
        }

        // Bio filter
        if (State.activeFilters.hasBio) {
          const hasBio = window.authorBiographies && window.authorBiographies[book.author];
          if (!hasBio) return false;
        }

        // Year range filter
        if (book.year) {
          if (book.year < State.activeFilters.yearRange[0] || book.year > State.activeFilters.yearRange[1]) {
            return false;
          }
        }

        return true;
      });

      ViewManager.renderBooks();
      this.updateActiveFiltersDisplay();
    },

    clearFilters() {
      State.activeFilters = {
        authors: [],
        yearRange: [Math.min(...State.filterOptions.years), Math.max(...State.filterOptions.years)],
        categories: [],
        hasEbook: false,
        hasBio: false
      };

      // Uncheck all checkboxes
      document.querySelectorAll('.filter-checkbox input').forEach(cb => cb.checked = false);

      State.filteredBooks = [];
      ViewManager.renderBooks();
      this.updateActiveFiltersDisplay();
    },

    updateActiveFiltersDisplay() {
      const container = document.querySelector('.active-filters');
      if (!container) return;

      const filters = [];

      State.activeFilters.authors.forEach(author => {
        filters.push({ type: 'author', value: author, label: `Author: ${author}` });
      });

      State.activeFilters.categories.forEach(cat => {
        filters.push({ type: 'category', value: cat, label: `Category: ${cat}` });
      });

      if (State.activeFilters.hasEbook) {
        filters.push({ type: 'ebook', value: true, label: 'Has E-book' });
      }

      if (State.activeFilters.hasBio) {
        filters.push({ type: 'bio', value: true, label: 'Has Biography' });
      }

      if (filters.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }

      container.style.display = 'flex';
      container.innerHTML = filters.map(f => `
        <div class="active-filter-chip">
          <span>${f.label}</span>
          <button class="remove-filter" data-type="${f.type}" data-value="${f.value}">×</button>
        </div>
      `).join('');

      // Attach remove listeners
      container.querySelectorAll('.remove-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.target.dataset.type;
          const value = e.target.dataset.value;
          this.removeFilter(type, value);
        });
      });
    },

    removeFilter(type, value) {
      switch(type) {
        case 'author':
          State.activeFilters.authors = State.activeFilters.authors.filter(a => a !== value);
          break;
        case 'category':
          State.activeFilters.categories = State.activeFilters.categories.filter(c => c !== value);
          break;
        case 'ebook':
          State.activeFilters.hasEbook = false;
          break;
        case 'bio':
          State.activeFilters.hasBio = false;
          break;
      }

      // Update UI
      const checkbox = document.querySelector(`.filter-checkbox input[value="${value}"]`);
      if (checkbox) checkbox.checked = false;

      this.applyFilters();
    }
  };

  // ==========================================
  // Sprint 2: Autocomplete Manager
  // ==========================================
  const AutocompleteManager = {
    init() {
      const searchInput = document.querySelector('.main-search-input');
      if (!searchInput) return;

      // Create autocomplete dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'autocomplete-dropdown';
      searchInput.parentElement.style.position = 'relative';
      searchInput.parentElement.appendChild(dropdown);

      searchInput.addEventListener('input', this.debounce((e) => {
        this.showSuggestions(e.target.value, dropdown);
      }, 200));

      // Hide on blur (with delay for click to register)
      searchInput.addEventListener('blur', () => {
        setTimeout(() => dropdown.classList.remove('show'), 200);
      });

      // Show on focus if has value
      searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim()) {
          this.showSuggestions(e.target.value, dropdown);
        }
      });
    },

    showSuggestions(query, dropdown) {
      if (!query.trim() || query.length < 2) {
        dropdown.classList.remove('show');
        return;
      }

      const lowerQuery = query.toLowerCase();
      const suggestions = [];

      // Find matching books
      State.books.forEach(book => {
        const titleMatch = book.title.toLowerCase().includes(lowerQuery);
        const authorMatch = book.author.toLowerCase().includes(lowerQuery);

        if (titleMatch || authorMatch) {
          suggestions.push({
            type: 'book',
            book,
            relevance: titleMatch ? 2 : 1 // Title matches are more relevant
          });
        }
      });

      // Sort by relevance and limit
      suggestions.sort((a, b) => b.relevance - a.relevance);
      const topSuggestions = suggestions.slice(0, 8);

      if (topSuggestions.length === 0) {
        dropdown.classList.remove('show');
        return;
      }

      // Render suggestions
      dropdown.innerHTML = topSuggestions.map(s => {
        const book = s.book;
        const titleHighlighted = this.highlightMatch(book.title, query);
        const authorHighlighted = this.highlightMatch(book.author, query);

        return `
          <div class="autocomplete-item" data-book-id="${book.id}">
            <div class="autocomplete-item-title">${titleHighlighted}</div>
            <div class="autocomplete-item-meta">${authorHighlighted} ${book.year ? `• ${book.year}` : ''}</div>
          </div>
        `;
      }).join('');

      dropdown.classList.add('show');

      // Attach click handlers
      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          const bookId = item.dataset.bookId;
          this.selectBook(bookId);
          dropdown.classList.remove('show');
        });
      });
    },

    highlightMatch(text, query) {
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<span class="autocomplete-highlight">$1</span>');
    },

    selectBook(bookId) {
      // Find and highlight the book in current view
      const book = State.books.find(b => b.id === bookId);
      if (!book) return;

      // If in table view, use DataTables search
      if (State.currentView === 'table') {
        const table = $('#catalogue-table').DataTable();
        table.search(book.title).draw();
      } else {
        // Filter to show just this book
        State.filteredBooks = [book];
        ViewManager.renderBooks();
      }
    },

    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  };

  // ==========================================
  // Sprint 2: Saved Searches Manager
  // ==========================================
  const SavedSearchesManager = {
    STORAGE_KEY: 'pcc_saved_searches',

    init() {
      this.loadSavedSearches();
      this.attachListeners();
    },

    loadSavedSearches() {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      State.savedSearches = saved ? JSON.parse(saved) : [];
    },

    saveSearch(name, query, filters) {
      const search = {
        id: Date.now(),
        name,
        query,
        filters,
        createdAt: new Date().toISOString()
      };

      State.savedSearches.push(search);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.savedSearches));
      this.renderSavedSearches();
    },

    deleteSearch(id) {
      State.savedSearches = State.savedSearches.filter(s => s.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.savedSearches));
      this.renderSavedSearches();
    },

    applySavedSearch(id) {
      const search = State.savedSearches.find(s => s.id === id);
      if (!search) return;

      // Apply the saved query and filters
      const searchInput = document.querySelector('.main-search-input');
      if (searchInput) {
        searchInput.value = search.query;
        SearchManager.performSearch(search.query);
      }

      if (search.filters) {
        State.activeFilters = { ...search.filters };
        FiltersManager.applyFilters();
      }
    },

    renderSavedSearches() {
      const container = document.querySelector('.saved-searches');
      if (!container) return;

      if (State.savedSearches.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No saved searches yet</p>';
        return;
      }

      container.innerHTML = State.savedSearches.map(s => `
        <div class="saved-search-item" data-search-id="${s.id}">
          <div>
            <div class="saved-search-name">${s.name}</div>
            <div class="saved-search-query">${s.query || 'All books'}</div>
          </div>
          <button class="delete-saved-search" data-search-id="${s.id}">🗑️</button>
        </div>
      `).join('');

      // Attach listeners
      container.querySelectorAll('.saved-search-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.classList.contains('delete-saved-search')) {
            this.applySavedSearch(parseInt(item.dataset.searchId));
          }
        });
      });

      container.querySelectorAll('.delete-saved-search').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteSearch(parseInt(btn.dataset.searchId));
        });
      });
    },

    attachListeners() {
      // Add save search button functionality (will be in advanced search modal)
      const saveBtn = document.querySelector('.save-search-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const name = prompt('Enter a name for this search:');
          if (name) {
            const query = document.querySelector('.main-search-input').value;
            this.saveSearch(name, query, State.activeFilters);
          }
        });
      }
    }
  };

  // ==========================================
  // Sprint 2: Advanced Search Modal
  // ==========================================
  const AdvancedSearchModal = {
    init() {
      this.attachListeners();
    },

    attachListeners() {
      const openBtn = document.querySelector('.advanced-search-btn');
      const modal = document.querySelector('.advanced-search-modal');
      const closeBtn = document.querySelector('.close-modal');

      if (openBtn && modal) {
        openBtn.addEventListener('click', () => modal.classList.add('show'));
      }

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
      }

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('show');
          }
        });
      }

      // Advanced search form submission
      const searchForm = document.querySelector('.advanced-search-form');
      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.performAdvancedSearch();
        });
      }
    },

    performAdvancedSearch() {
      const titleInput = document.querySelector('.adv-search-title');
      const authorInput = document.querySelector('.adv-search-author');
      const yearFromInput = document.querySelector('.adv-search-year-from');
      const yearToInput = document.querySelector('.adv-search-year-to');

      State.filteredBooks = State.books.filter(book => {
        if (titleInput.value && !book.title.toLowerCase().includes(titleInput.value.toLowerCase())) {
          return false;
        }

        if (authorInput.value && !book.author.toLowerCase().includes(authorInput.value.toLowerCase())) {
          return false;
        }

        if (yearFromInput.value && book.year && book.year < parseInt(yearFromInput.value)) {
          return false;
        }

        if (yearToInput.value && book.year && book.year > parseInt(yearToInput.value)) {
          return false;
        }

        return true;
      });

      ViewManager.renderBooks();
      document.querySelector('.advanced-search-modal').classList.remove('show');
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

        // Sprint 2 features
        FiltersManager.init();
        AutocompleteManager.init();
        SavedSearchesManager.init();
        AdvancedSearchModal.init();

        console.log('✅ Enhanced features loaded successfully!');
        console.log('✅ Sprint 2: Search & Discovery features loaded!');
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
    CoverManager,
    FiltersManager,
    AutocompleteManager,
    SavedSearchesManager
  };

})();
