/**
 * Suspended Theme - Main JavaScript
 * Pinterest-style Waterfall Layout
 */

(function() {
  'use strict';

  // ========== Theme Toggle ==========
  const themeToggle = document.getElementById('theme-toggle');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  const html = document.documentElement;

  function getPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    // 默认使用黑色主题
    return 'dark';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  setTheme(getPreferredTheme());

  // Desktop sidebar theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Mobile header theme toggle
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', toggleTheme);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });

  // ========== Mobile Menu ==========
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenuToggle.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });
  }

  // ========== Article Font Size Control (Top Right) ==========
  const fontSizeControls = document.getElementById('font-size-controls');
  const fontSizeDecrease = document.getElementById('font-size-decrease');
  const fontSizeIncrease = document.getElementById('font-size-increase');
  const articleElement = document.querySelector('article.article');
  const articleContent = document.querySelector('.article-content.prose');

  if (fontSizeControls && articleElement) {
    const STORAGE_KEY = 'article-font-size';
    const FONT_SIZES = ['xsmall', 'small', 'medium', 'large', 'xlarge'];

    // 从 localStorage 读取保存的字体大小，默认为 small
    function getSavedFontSize() {
      return localStorage.getItem(STORAGE_KEY) || 'small';
    }

    // 获取当前字体大小的索引
    function getCurrentIndex() {
      const current = articleElement.getAttribute('data-font-size') || 'small';
      return FONT_SIZES.indexOf(current);
    }

    // 设置字体大小
    function setFontSize(size) {
      // 更新整个文章的 data 属性（包括标题和内容）
      articleElement.setAttribute('data-font-size', size);
      // 同时更新内容区域
      if (articleContent) {
        articleContent.setAttribute('data-font-size', size);
      }

      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEY, size);
    }

    // 初始化：应用保存的字体大小
    setFontSize(getSavedFontSize());

    // A- 缩小字体
    fontSizeDecrease.addEventListener('click', () => {
      const currentIndex = getCurrentIndex();
      if (currentIndex > 0) {
        setFontSize(FONT_SIZES[currentIndex - 1]);
      }
    });

    // A+ 放大字体
    fontSizeIncrease.addEventListener('click', () => {
      const currentIndex = getCurrentIndex();
      if (currentIndex < FONT_SIZES.length - 1) {
        setFontSize(FONT_SIZES[currentIndex + 1]);
      }
    });
  }

  // ========== Waterfall Animation ==========
  const waterfallGrid = document.getElementById('waterfall-grid');
  if (waterfallGrid) {
    const items = waterfallGrid.querySelectorAll('.waterfall-item');

    // Staggered animation on load
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.08}s`;
    });

    // Intersection observer for scroll animations
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      items.forEach(item => observer.observe(item));
    }
  }

  // ========== Smooth Scroll ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // ========== Copy Code Button ==========
  document.querySelectorAll('pre code').forEach(block => {
    const pre = block.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.textContent = '复制';
    button.style.cssText = `
      position: absolute; top: 8px; right: 8px;
      padding: 4px 8px; font-size: 12px;
      background: var(--color-primary); color: white;
      border: none; border-radius: 4px; cursor: pointer;
      opacity: 0; transition: opacity 0.2s;
    `;

    pre.style.position = 'relative';
    pre.appendChild(button);

    pre.addEventListener('mouseenter', () => button.style.opacity = '1');
    pre.addEventListener('mouseleave', () => button.style.opacity = '0');

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(block.textContent);
        button.textContent = '已复制!';
        setTimeout(() => button.textContent = '复制', 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });

  // ========== Search Functionality ==========
  let searchIndex = null;

  // PC Search Elements
  const searchBox = document.getElementById('search-box');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  // Mobile Search Elements
  const mobileSearchBox = document.getElementById('mobile-search-box');
  const mobileSearchToggle = document.getElementById('mobile-search-toggle');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchResults = document.getElementById('mobile-search-results');

  // Load search index
  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    try {
      const response = await fetch('/index.json');
      searchIndex = await response.json();
      return searchIndex;
    } catch (err) {
      console.error('Failed to load search index:', err);
      return [];
    }
  }

  // Simple search function
  function performSearch(query, data) {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return data.filter(item => {
      const title = (item.title || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      const section = (item.section || '').toLowerCase();
      const tags = (item.tags || []).join(' ').toLowerCase();
      return title.includes(lowerQuery) ||
             content.includes(lowerQuery) ||
             section.includes(lowerQuery) ||
             tags.includes(lowerQuery);
    }).slice(0, 8); // Limit to 8 results
  }

  // Render search results
  function renderResults(results, container) {
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = '<div class="search-no-results">没有找到相关文章</div>';
      container.classList.add('show');
      return;
    }

    container.innerHTML = results.map(item => `
      <a href="${item.url}" class="search-result-item">
        <div class="search-result-title">${item.title}</div>
        <div class="search-result-meta">
          <span class="search-result-section">${item.section}</span>
          <span>${item.date}</span>
        </div>
      </a>
    `).join('');
    container.classList.add('show');
  }

  // Hide results
  function hideResults(container) {
    if (container) {
      container.classList.remove('show');
    }
  }

  // PC Search - Hover to expand, auto focus
  if (searchBox && searchInput && searchResults) {
    searchBox.addEventListener('mouseenter', async () => {
      searchBox.classList.add('active');
      await loadSearchIndex();
      setTimeout(() => searchInput.focus(), 300);
    });

    searchBox.addEventListener('mouseleave', (e) => {
      // Don't collapse if input has value or results are showing
      if (!searchInput.value && !searchResults.classList.contains('show')) {
        searchBox.classList.remove('active');
      }
    });

    searchInput.addEventListener('input', async () => {
      const query = searchInput.value.trim();
      if (query.length < 2) {
        hideResults(searchResults);
        return;
      }
      const data = await loadSearchIndex();
      const results = performSearch(query, data);
      renderResults(results, searchResults);
    });

    searchInput.addEventListener('focus', () => {
      searchBox.classList.add('active');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!searchBox.contains(e.target)) {
        searchBox.classList.remove('active');
        hideResults(searchResults);
        searchInput.value = '';
      }
    });

    // Close on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchBox.classList.remove('active');
        hideResults(searchResults);
        searchInput.value = '';
        searchInput.blur();
      }
    });
  }

  // Mobile Search
  if (mobileSearchBox && mobileSearchToggle && mobileSearchInput && mobileSearchResults) {
    mobileSearchToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      mobileSearchBox.classList.toggle('active');
      if (mobileSearchBox.classList.contains('active')) {
        await loadSearchIndex();
        setTimeout(() => mobileSearchInput.focus(), 300);
      } else {
        hideResults(mobileSearchResults);
        mobileSearchInput.value = '';
      }
    });

    mobileSearchInput.addEventListener('input', async () => {
      const query = mobileSearchInput.value.trim();
      if (query.length < 2) {
        hideResults(mobileSearchResults);
        return;
      }
      const data = await loadSearchIndex();
      const results = performSearch(query, data);
      renderResults(results, mobileSearchResults);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!mobileSearchBox.contains(e.target)) {
        mobileSearchBox.classList.remove('active');
        hideResults(mobileSearchResults);
        mobileSearchInput.value = '';
      }
    });

    // Close on Escape
    mobileSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        mobileSearchBox.classList.remove('active');
        hideResults(mobileSearchResults);
        mobileSearchInput.value = '';
        mobileSearchInput.blur();
      }
    });
  }

})();

