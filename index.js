const resultsEl = document.getElementById('results');
    const loadMoreBtn = document.getElementById('loadMore');
    const statusEl = document.getElementById('status');
    const inputEl = document.getElementById('query');
    const searchBtn = document.getElementById('search');

    // State
    let currentQuery = '';
    let page = 1;
    const pageSize = 24; // how many per page
    let totalFound = 0;  // from API's numFound
    let shownSoFar = 0;

    // Utilities
    function placeholderCover() {
      return 'https://via.placeholder.com/360x540?text=No+Cover';
    }

    function mkBookCard(book) {
      const coverUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : placeholderCover();
      const title = book.title ?? 'Untitled';
      const year = book.first_publish_year ?? 'Unknown Year';
      const bookUrl = book.key ? `https://openlibrary.org${book.key}` : '#';

      // Build author links if keys exist; else just names
      let authorsHtml = 'Unknown Author';
      if (Array.isArray(book.author_name) && book.author_name.length) {
        if (Array.isArray(book.author_key) && book.author_key.length === book.author_name.length) {
          authorsHtml = book.author_name.map((name, i) => {
            const key = book.author_key[i];
            return `<a href="https://openlibrary.org/authors/${key}" target="_blank" rel="noopener noreferrer">${name}</a>`;
          }).join(', ');
        } else {
          // Fallback: names without links
          authorsHtml = book.author_name.join(', ');
        }
      }

      const div = document.createElement('div');
      div.className = 'book';
      div.innerHTML = `
        <a href="${bookUrl}" target="_blank" rel="noopener noreferrer" class="title">
          <img class="cover" src="${coverUrl}" alt="Cover of ${title}">
        </a>
        <a href="${bookUrl}" target="_blank" rel="noopener noreferrer" class="title">${title}</a>
        <div class="meta">
          <span class="authors">${authorsHtml}</span><br>
          <span>${year}</span>
        </div>
      `;
      return div;
    }

    function setLoading(msg = 'Loading...') {
      statusEl.textContent = msg;
    }

    function clearLoading() {
      statusEl.textContent = '';
    }

    function shouldShowLoadMore() {
      return shownSoFar < totalFound;
    }

    async function fetchPage(q, p) {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&page=${p}&limit=${pageSize}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      // numFound may be missing in some edge cases; default to docs length when absent
      totalFound = typeof data.numFound === 'number' ? data.numFound : (data.docs?.length ?? 0);
      return data.docs ?? [];
    }

    function resetResults() {
      resultsEl.innerHTML = '';
      shownSoFar = 0;
      totalFound = 0;
      loadMoreBtn.style.display = 'none'; // hidden until we actually render first results
    }

    async function runSearch() {
      const q = inputEl.value.trim();
      resetResults();
      if (!q) {
        statusEl.textContent = 'Please enter a search term.';
        return;
      }
      currentQuery = q;
      page = 1;
      setLoading();

      try {
        const docs = await fetchPage(currentQuery, page);
        clearLoading();

        if (docs.length === 0) {
          statusEl.textContent = 'No results found.';
          return;
        }

        // Render first page
        const frag = document.createDocumentFragment();
        docs.forEach(d => frag.appendChild(mkBookCard(d)));
        resultsEl.appendChild(frag);
        shownSoFar += docs.length;

        // Show Load More ONLY after results are rendered and only if more exist
        loadMoreBtn.style.display = shouldShowLoadMore() ? 'block' : 'none';
        if (shouldShowLoadMore()) {
          statusEl.textContent = `Showing ${shownSoFar} of about ${totalFound} results.`;
        } else {
          statusEl.textContent = `Showing all ${shownSoFar} result(s).`;
        }
      } catch (e) {
        clearLoading();
        statusEl.textContent = `Error: ${e.message}`;
      }
    }

    async function loadMore() {
      if (!currentQuery) return;
      page += 1;
      setLoading('Loading more...');

      try {
        const docs = await fetchPage(currentQuery, page);
        clearLoading();

        if (docs.length === 0) {
          loadMoreBtn.style.display = 'none';
          statusEl.textContent = `Showing all ${shownSoFar} result(s).`;
          return;
        }

        const frag = document.createDocumentFragment();
        docs.forEach(d => frag.appendChild(mkBookCard(d)));
        resultsEl.appendChild(frag);
        shownSoFar += docs.length;

        loadMoreBtn.style.display = shouldShowLoadMore() ? 'block' : 'none';
        if (shouldShowLoadMore()) {
          statusEl.textContent = `Showing ${shownSoFar} of about ${totalFound} results.`;
        } else {
          statusEl.textContent = `Showing all ${shownSoFar} result(s).`;
        }
      } catch (e) {
        clearLoading();
        statusEl.textContent = `Error: ${e.message}`;
      }
    }

    // Events
    searchBtn.addEventListener('click', runSearch);
    loadMoreBtn.addEventListener('click', loadMore);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
    });