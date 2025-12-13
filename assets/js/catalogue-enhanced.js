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
    currentTab: 'main', // Track which tab is active: main, children, dvd, chinese
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

      // Filter books by current tab
      let books = State.filteredBooks.length > 0 ? State.filteredBooks : State.books;
      books = books.filter(book => book.category === State.currentTab);

      container.innerHTML = books.map(book => this.createBookCard(book)).join('');

      // Lazy load images
      this.lazyLoadImages();
    },

    renderListView() {
      const container = document.querySelector('[data-view="list"]');
      if (!container) return;

      // Filter books by current tab
      let books = State.filteredBooks.length > 0 ? State.filteredBooks : State.books;
      books = books.filter(book => book.category === State.currentTab);

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
  // Tab Management
  // ==========================================
  const TabManager = {
    init() {
      this.attachListeners();
      this.syncInitialTab();
    },

    attachListeners() {
      // Listen to tab button clicks
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Get the tab name from the onclick attribute
          const onclickAttr = btn.getAttribute('onclick');
          if (onclickAttr) {
            // Extract tab name from: openTab(event, 'children')
            const match = onclickAttr.match(/openTab\(event,\s*'([^']+)'\)/);
            if (match) {
              const tabName = match[1];
              this.onTabChange(tabName);
            }
          }
        });
      });
    },

    syncInitialTab() {
      // Find which tab is currently active
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab) {
        const onclickAttr = activeTab.getAttribute('onclick');
        if (onclickAttr) {
          const match = onclickAttr.match(/openTab\(event,\s*'([^']+)'\)/);
          if (match) {
            State.currentTab = match[1];
          }
        }
      }
    },

    onTabChange(tabName) {
      console.log('📑 Tab changed to:', tabName);
      State.currentTab = tabName;

      // Re-render card and list views with filtered books
      if (State.currentView === 'card' || State.currentView === 'list') {
        ViewManager.renderBooks();
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
        console.log('✅ Search input found, attaching listener');
        searchInput.addEventListener('input', this.debounce((e) => {
          console.log('🔍 Search query:', e.target.value);
          this.performSearch(e.target.value);
        }, 300));

        // Also listen for Enter key
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            console.log('🔍 Enter pressed, searching:', e.target.value);
            this.performSearch(e.target.value);
          }
        });
      } else {
        console.error('❌ Search input not found!');
      }
    },

    performSearch(query) {
      console.log('📊 Current view:', State.currentView);
      console.log('📚 Total books in State:', State.books.length);

      // If in table view, use DataTables search on all visible tables
      if (State.currentView === 'table') {
        try {
          // Search all tables
          const tableIds = ['main-table', 'children-table', 'dvd-table', 'chinese-table'];
          tableIds.forEach(tableId => {
            try {
              const table = $(`#${tableId}`).DataTable();
              if (table) {
                table.search(query).draw();
              }
            } catch (e) {
              // Table might not be initialized yet
            }
          });
          console.log('✅ DataTables searched');
        } catch (error) {
          console.error('❌ DataTable error:', error);
        }
        return;
      }

      // For card/list views, filter State.filteredBooks
      if (!query.trim()) {
        State.filteredBooks = [];
        ViewManager.renderBooks();
        // Clear all DataTable searches too
        const tableIds = ['main-table', 'children-table', 'dvd-table', 'chinese-table'];
        tableIds.forEach(tableId => {
          try {
            const table = $(`#${tableId}`).DataTable();
            if (table) {
              table.search('').draw();
            }
          } catch (error) {
            // Table might not be initialized yet
          }
        });
        return;
      }

      const lowerQuery = query.toLowerCase();
      State.filteredBooks = State.books.filter(book => {
        return book.title.toLowerCase().includes(lowerQuery) ||
               book.author.toLowerCase().includes(lowerQuery) ||
               (book.callNumber && book.callNumber.toLowerCase().includes(lowerQuery)) ||
               (book.year && book.year.toString().includes(query));
      });

      console.log('🔍 Filtered books:', State.filteredBooks.length);
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
      // Extract book data from all DataTables (main, children, dvd, chinese)
      const tableIds = ['main-table', 'children-table', 'dvd-table', 'chinese-table'];
      State.books = [];

      tableIds.forEach(tableId => {
        try {
          const table = $(`#${tableId}`).DataTable();
          if (!table) {
            console.warn(`⚠️ Table ${tableId} not found`);
            return;
          }

          const data = table.rows().data();
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            State.books.push({
              author: row[0],
              title: row[1],
              id: row[2],
              callNumber: row[3],
              year: row[4],
              copy: row[5],
              isbn: this.extractISBN(row),
              category: tableId.replace('-table', '') // main, children, dvd, chinese
            });
          }
          console.log(`✅ Loaded ${data.length} books from ${tableId}`);
        } catch (error) {
          console.error(`❌ Error loading ${tableId}:`, error);
        }
      });

      console.log(`📚 Total loaded: ${State.books.length} books`);

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
      const toggle = document.querySelector('#filters-toggle');
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
  // Sprint 3: Book Detail Modal Manager
  // ==========================================
  const BookDetailModal = {
    currentBook: null,

    init() {
      this.attachClickListeners();
    },

    attachClickListeners() {
      // Make book cards and list items clickable
      document.addEventListener('click', (e) => {
        const card = e.target.closest('[data-book-id]');
        if (card && !e.target.closest('.remove-filter')) {
          const bookId = card.dataset.bookId;
          this.showBookDetail(bookId);
        }
      });

      // Close modal listeners
      const modal = document.querySelector('.book-detail-modal');
      if (modal) {
        const closeBtn = modal.querySelector('.book-detail-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.closeModal());
        }

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal();
          }
        });
      }

      // Tab switching
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('book-tab')) {
          this.switchTab(e.target.dataset.tab);
        }
      });
    },

    showBookDetail(bookId) {
      const book = State.books.find(b => b.id === bookId);
      if (!book) return;

      this.currentBook = book;
      this.renderBookDetail(book);

      const modal = document.querySelector('.book-detail-modal');
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    },

    renderBookDetail(book) {
      const modal = document.querySelector('.book-detail-modal');
      if (!modal) return;

      const coverUrl = CoverManager.getCoverUrl(book);
      const authorBio = this.getAuthorBio(book.author);
      const ebookLinks = this.getEbookLinks(book);
      const relatedBooks = this.getRelatedBooks(book);

      const detailHTML = `
        <div class="book-detail-content">
          <div class="book-detail-header">
            <h2 style="margin:0;">Book Details</h2>
            <button class="book-detail-close" aria-label="Close">&times;</button>
          </div>

          <div class="book-detail-body">
            <div class="book-detail-main">
              <div class="book-detail-cover">
                ${coverUrl
                  ? `<img src="${coverUrl}" alt="${book.title} cover">`
                  : `<div class="book-detail-cover-placeholder">
                       <div>📚</div>
                       <div style="font-size: 0.9rem; margin-top: 1rem; padding: 1rem; text-align: center;">${book.title}</div>
                     </div>`
                }
              </div>

              <div class="book-detail-info">
                <h1>${book.title}</h1>
                <div class="book-detail-author">${book.author}</div>

                <div class="book-meta-grid">
                  ${book.year ? `
                    <div class="book-meta-item">
                      <div class="book-meta-label">Publication Year</div>
                      <div class="book-meta-value">${book.year}</div>
                    </div>
                  ` : ''}

                  ${book.callNumber ? `
                    <div class="book-meta-item">
                      <div class="book-meta-label">Call Number</div>
                      <div class="book-meta-value">${book.callNumber}</div>
                    </div>
                  ` : ''}

                  ${book.isbn ? `
                    <div class="book-meta-item">
                      <div class="book-meta-label">ISBN</div>
                      <div class="book-meta-value">${book.isbn}</div>
                    </div>
                  ` : ''}

                  ${book.publisher ? `
                    <div class="book-meta-item">
                      <div class="book-meta-label">Publisher</div>
                      <div class="book-meta-value">${book.publisher}</div>
                    </div>
                  ` : ''}

                  <div class="book-meta-item">
                    <div class="book-meta-label">Copy</div>
                    <div class="book-meta-value">${book.copy || 'N/A'}</div>
                  </div>

                  <div class="book-meta-item">
                    <div class="book-meta-label">Book ID</div>
                    <div class="book-meta-value">${book.id}</div>
                  </div>
                </div>

                <div class="book-actions">
                  <button class="book-action-btn" data-action="favorite">
                    <span>❤️</span> Add to Favorites
                  </button>
                  <button class="book-action-btn" data-action="reading-list">
                    <span>📚</span> Reading List
                  </button>
                  <button class="book-action-btn" data-action="share">
                    <span>🔗</span> Share
                  </button>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="book-tabs">
              <button class="book-tab active" data-tab="overview">Overview</button>
              <button class="book-tab" data-tab="author">Author</button>
              ${ebookLinks.length > 0 ? '<button class="book-tab" data-tab="ebooks">E-books</button>' : ''}
              ${relatedBooks.length > 0 ? '<button class="book-tab" data-tab="related">Related Books</button>' : ''}
            </div>

            <!-- Tab: Overview -->
            <div class="book-tab-content active" data-tab-content="overview">
              <div class="book-description">
                <p>This book is part of the PCC Library collection. ${book.callNumber ? `It can be found in the ${this.getCategoryName(book.callNumber)} section.` : ''}</p>
                ${book.year ? `<p>Published in ${book.year}${book.publisher ? ` by ${book.publisher}` : ''}, this work is ${this.getBookAge(book.year)}.</p>` : ''}
              </div>
            </div>

            <!-- Tab: Author -->
            <div class="book-tab-content" data-tab-content="author">
              ${authorBio ? `
                <div class="author-bio-section">
                  <h3><span>✍️</span> About ${book.author}</h3>
                  ${authorBio.dates ? `<div class="author-bio-dates">${authorBio.dates}</div>` : ''}
                  <div class="author-bio-text">${authorBio.bio}</div>
                  ${authorBio.sources ? `
                    <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                      <strong>Sources:</strong> ${authorBio.sources.map(s => `<a href="${s}" target="_blank" style="color: var(--primary-color);">[${new URL(s).hostname}]</a>`).join(' ')}
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div class="author-bio-section">
                  <h3>About ${book.author}</h3>
                  <p style="color: var(--text-secondary);">Author biography not yet available in our database.</p>
                </div>
              `}

              <!-- Other books by this author -->
              ${this.getBooksByAuthor(book.author, book.id).length > 0 ? `
                <div class="related-books-section">
                  <h3>Other Books by ${book.author}</h3>
                  <div class="related-books-grid">
                    ${this.renderRelatedBooks(this.getBooksByAuthor(book.author, book.id))}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Tab: E-books -->
            ${ebookLinks.length > 0 ? `
              <div class="book-tab-content" data-tab-content="ebooks">
                <div class="ebook-links-section">
                  <h3>📖 Free E-book Sources</h3>
                  ${ebookLinks.map(link => `
                    <div class="ebook-link-item">
                      <div>
                        <div class="ebook-link-source">${link.source}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${link.format || 'Multiple formats'}</div>
                      </div>
                      <a href="${link.url}" target="_blank" class="ebook-link-btn">Read Now →</a>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Tab: Related Books -->
            ${relatedBooks.length > 0 ? `
              <div class="book-tab-content" data-tab-content="related">
                <div class="related-books-section">
                  <h3>Related Books</h3>
                  <div class="related-books-grid">
                    ${this.renderRelatedBooks(relatedBooks)}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      modal.innerHTML = detailHTML;

      // Attach action button listeners
      modal.querySelectorAll('.book-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          this.handleAction(action, book);
        });
      });
    },

    getAuthorBio(authorName) {
      if (!window.authorBiographies) return null;

      // Normalize author name for matching
      const normalizedName = authorName.toLowerCase().trim();

      for (const [bioAuthor, bioData] of Object.entries(window.authorBiographies)) {
        if (bioAuthor.toLowerCase().trim() === normalizedName) {
          return bioData;
        }
      }

      return null;
    },

    getEbookLinks(book) {
      const links = [];
      const bookKey = `${book.author} - ${book.title}`;

      if (window.ebookLinks && window.ebookLinks[bookKey]) {
        const ebookData = window.ebookLinks[bookKey];
        if (Array.isArray(ebookData)) {
          return ebookData;
        } else {
          // Single link
          links.push(ebookData);
        }
      }

      return links;
    },

    getRelatedBooks(book) {
      // Find books by same author or in same category
      const related = [];

      // Same author (limit 6)
      const sameAuthor = State.books
        .filter(b => b.author === book.author && b.id !== book.id)
        .slice(0, 6);

      related.push(...sameAuthor);

      // If not enough, add books from same category
      if (related.length < 6 && book.callNumber) {
        const category = book.callNumber.match(/^([A-Z]+)/)?.[1];
        if (category) {
          const sameCategory = State.books
            .filter(b => b.callNumber?.startsWith(category) && b.id !== book.id && !related.includes(b))
            .slice(0, 6 - related.length);

          related.push(...sameCategory);
        }
      }

      return related;
    },

    getBooksByAuthor(author, excludeId) {
      return State.books.filter(b => b.author === author && b.id !== excludeId).slice(0, 8);
    },

    renderRelatedBooks(books) {
      return books.map(b => {
        const coverUrl = CoverManager.getCoverUrl(b);
        return `
          <div class="related-book-card" data-book-id="${b.id}">
            <div class="related-book-cover">
              ${coverUrl
                ? `<img src="${coverUrl}" alt="${b.title}">`
                : `<div style="font-size: 2rem;">📚</div>`
              }
            </div>
            <div class="related-book-title">${b.title}</div>
          </div>
        `;
      }).join('');
    },

    getCategoryName(callNumber) {
      const match = callNumber.match(/^([A-Z]+)/);
      if (!match) return 'general';

      const category = match[1];
      const categories = {
        'BT': 'Systematic Theology',
        'BS': 'Bible',
        'BR': 'Church History',
        'BV': 'Practical Theology',
        'BX': 'Denominational History',
        'E': 'History (General)',
        'F': 'History (Americas)',
        'P': 'Literature',
        'Q': 'Science',
        'R': 'Medicine'
      };

      return categories[category] || category;
    },

    getBookAge(year) {
      const age = new Date().getFullYear() - parseInt(year);
      if (age === 0) return 'published this year';
      if (age === 1) return '1 year old';
      if (age < 10) return `${age} years old`;
      if (age < 50) return `${Math.floor(age / 10) * 10}+ years old`;
      if (age < 100) return `almost ${Math.round(age / 10) * 10} years old`;
      if (age < 200) return `over ${Math.floor(age / 100)} century old`;
      return `over ${Math.floor(age / 100)} centuries old`;
    },

    switchTab(tabName) {
      // Hide all tabs
      document.querySelectorAll('.book-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.book-tab-content').forEach(c => c.classList.remove('active'));

      // Show selected tab
      const tab = document.querySelector(`.book-tab[data-tab="${tabName}"]`);
      const content = document.querySelector(`.book-tab-content[data-tab-content="${tabName}"]`);

      if (tab) tab.classList.add('active');
      if (content) content.classList.add('active');
    },

    handleAction(action, book) {
      switch(action) {
        case 'favorite':
          FavoritesManager.toggleFavorite(book);
          break;
        case 'reading-list':
          ReadingListManager.addToList(book);
          break;
        case 'share':
          this.shareBook(book);
          break;
      }
    },

    shareBook(book) {
      const shareText = `Check out "${book.title}" by ${book.author} from PCC Library`;
      const shareUrl = window.location.href;

      if (navigator.share) {
        navigator.share({
          title: book.title,
          text: shareText,
          url: shareUrl
        }).catch(err => console.log('Share cancelled'));
      } else {
        // Fallback: copy to clipboard
        const textToCopy = `${shareText}\n${shareUrl}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          alert('Link copied to clipboard!');
        });
      }
    },

    closeModal() {
      const modal = document.querySelector('.book-detail-modal');
      if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    }
  };

  // ==========================================
  // Sprint 4: Favorites Manager
  // ==========================================
  const FavoritesManager = {
    STORAGE_KEY: 'pcc_favorites',

    init() {
      this.loadFavorites();
    },

    loadFavorites() {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      State.favorites = saved ? JSON.parse(saved) : [];
    },

    isFavorite(bookId) {
      return State.favorites.some(f => f.id === bookId);
    },

    toggleFavorite(book) {
      const isFav = this.isFavorite(book.id);

      if (isFav) {
        // Remove from favorites
        State.favorites = State.favorites.filter(f => f.id !== book.id);
        this.showNotification(`Removed "${book.title}" from favorites`);
      } else {
        // Add to favorites
        State.favorites.push({
          ...book,
          addedAt: new Date().toISOString()
        });
        this.showNotification(`Added "${book.title}" to favorites ❤️`);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.favorites));
      this.updateFavoriteButtons();
      this.renderFavoritesList();
    },

    updateFavoriteButtons() {
      // Update all favorite buttons in modals
      document.querySelectorAll('[data-action="favorite"]').forEach(btn => {
        const modal = btn.closest('.book-detail-modal');
        if (!modal || !BookDetailModal.currentBook) return;

        const isFav = this.isFavorite(BookDetailModal.currentBook.id);
        if (isFav) {
          btn.classList.add('active');
          btn.innerHTML = '<span>❤️</span> Favorited';
        } else {
          btn.classList.remove('active');
          btn.innerHTML = '<span>❤️</span> Add to Favorites';
        }
      });
    },

    renderFavoritesList() {
      const container = document.querySelector('.favorites-list');
      if (!container) return;

      if (State.favorites.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No favorites yet. Click the ❤️ button on any book to add it!</p>';
        return;
      }

      container.innerHTML = `
        <div class="book-grid">
          ${State.favorites.map(book => ViewManager.createBookCard(book)).join('')}
        </div>
      `;
    },

    showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => notification.classList.add('show'), 100);
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  // ==========================================
  // Sprint 4: Reading List Manager
  // ==========================================
  const ReadingListManager = {
    STORAGE_KEY: 'pcc_reading_lists',

    init() {
      this.loadLists();
    },

    loadLists() {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      State.readingLists = saved ? JSON.parse(saved) : [
        { id: 'to-read', name: 'To Read', books: [] },
        { id: 'reading', name: 'Currently Reading', books: [] },
        { id: 'read', name: 'Read', books: [] }
      ];
    },

    addToList(book, listId = 'to-read') {
      const list = State.readingLists.find(l => l.id === listId);
      if (!list) return;

      // Check if already in list
      if (list.books.some(b => b.id === book.id)) {
        FavoritesManager.showNotification(`"${book.title}" is already in ${list.name}`);
        return;
      }

      list.books.push({
        ...book,
        addedAt: new Date().toISOString()
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.readingLists));
      FavoritesManager.showNotification(`Added "${book.title}" to ${list.name} 📚`);
      this.renderReadingLists();
    },

    removeFromList(bookId, listId) {
      const list = State.readingLists.find(l => l.id === listId);
      if (!list) return;

      list.books = list.books.filter(b => b.id !== bookId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.readingLists));
      this.renderReadingLists();
    },

    moveBook(bookId, fromListId, toListId) {
      const fromList = State.readingLists.find(l => l.id === fromListId);
      const toList = State.readingLists.find(l => l.id === toListId);

      if (!fromList || !toList) return;

      const book = fromList.books.find(b => b.id === bookId);
      if (!book) return;

      this.removeFromList(bookId, fromListId);
      this.addToList(book, toListId);
    },

    createList(name) {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      State.readingLists.push({
        id,
        name,
        books: [],
        createdAt: new Date().toISOString()
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.readingLists));
      this.renderReadingLists();
    },

    renderReadingLists() {
      const container = document.querySelector('.reading-lists-container');
      if (!container) return;

      container.innerHTML = State.readingLists.map(list => `
        <div class="reading-list-section">
          <h3>${list.name} (${list.books.length})</h3>
          ${list.books.length === 0
            ? `<p style="color: var(--text-secondary); font-size: 0.9rem;">No books in this list yet.</p>`
            : `<div class="book-grid">
                ${list.books.map(book => ViewManager.createBookCard(book)).join('')}
              </div>`
          }
        </div>
      `).join('');
    }
  };

  // ==========================================
  // Sprint 4: Notes Manager
  // ==========================================
  const NotesManager = {
    STORAGE_KEY: 'pcc_book_notes',

    init() {
      this.loadNotes();
    },

    loadNotes() {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      State.bookNotes = saved ? JSON.parse(saved) : {};
    },

    getNote(bookId) {
      return State.bookNotes[bookId] || null;
    },

    saveNote(bookId, note) {
      State.bookNotes[bookId] = {
        note,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.bookNotes));
      FavoritesManager.showNotification('Note saved! 📝');
    },

    deleteNote(bookId) {
      delete State.bookNotes[bookId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(State.bookNotes));
      FavoritesManager.showNotification('Note deleted');
    },

    showNoteEditor(book) {
      const existingNote = this.getNote(book.id);

      const modal = document.createElement('div');
      modal.className = 'note-editor-modal show';
      modal.innerHTML = `
        <div class="note-editor-content" style="background: var(--bg-primary); padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%;">
          <h2 style="margin: 0 0 1rem 0;">Notes for "${book.title}"</h2>
          <textarea
            class="note-textarea"
            placeholder="Write your notes here..."
            style="width: 100%; min-height: 200px; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 1rem; resize: vertical;"
          >${existingNote ? existingNote.note : ''}</textarea>
          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button class="btn-primary save-note-btn" style="flex: 1;">Save Note</button>
            ${existingNote ? '<button class="btn-secondary delete-note-btn" style="flex: 1;">Delete Note</button>' : ''}
            <button class="btn-secondary close-note-btn" style="flex: 1;">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.save-note-btn').addEventListener('click', () => {
        const noteText = modal.querySelector('.note-textarea').value.trim();
        if (noteText) {
          this.saveNote(book.id, noteText);
        }
        modal.remove();
      });

      modal.querySelector('.close-note-btn').addEventListener('click', () => {
        modal.remove();
      });

      if (existingNote) {
        modal.querySelector('.delete-note-btn').addEventListener('click', () => {
          if (confirm('Delete this note?')) {
            this.deleteNote(book.id);
            modal.remove();
          }
        });
      }

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
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
      // Wait longer for DataTable to fully initialize (increased from 1000ms to 2500ms)
      setTimeout(() => {
        console.log('⏰ Starting data load...');
        DataLoader.loadFromDataTable();
        ViewManager.init();
        TabManager.init();
        SearchManager.init();

        // Sprint 2 features
        FiltersManager.init();
        AutocompleteManager.init();
        SavedSearchesManager.init();
        AdvancedSearchModal.init();

        // Sprint 3 features
        BookDetailModal.init();

        // Sprint 4 features
        FavoritesManager.init();
        ReadingListManager.init();
        NotesManager.init();

        console.log('✅ Enhanced features loaded successfully!');
        console.log('✅ Sprint 2: Search & Discovery features loaded!');
        console.log('✅ Sprint 3: Rich Book Details & Metadata loaded!');
        console.log('✅ Sprint 4: User Features (Favorites, Lists, Notes) loaded!');
      }, 2500); // Increased delay to ensure DataTables are fully loaded
    });
  }

  // Start initialization
  init();

  // Expose State for debugging
  window.PCC = {
    State,
    ThemeManager,
    ViewManager,
    TabManager,
    CoverManager,
    FiltersManager,
    AutocompleteManager,
    SavedSearchesManager,
    BookDetailModal,
    FavoritesManager,
    ReadingListManager,
    NotesManager
  };

})();
