document.getElementById('search').addEventListener('click', () => {
    const query = document.getElementById('query').value.trim();
    const resultsDiv = document.getElementById('results');
    const loadMoreBtn = document.getElementById('loadMore');

    resultsDiv.innerHTML = '';
    loadMoreBtn.style.display = 'none';

    if (!query) {
        resultsDiv.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }

    resultsDiv.innerHTML = '<p>Loading...</p>';

    let currentIndex = 0;
    let books = [];

    function renderBooks() {
        let html = '';
        const slice = books.slice(currentIndex, currentIndex + 20);
        slice.forEach(book => {
            const coverUrl = book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : 'https://via.placeholder.com/120x180?text=No+Cover';
            const author = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
            const year = book.first_publish_year || 'Unknown Year';
            const bookUrl = `https://openlibrary.org${book.key}`; // 🔗 Book link

            html += `
              <div class="book">
                <a href="${bookUrl}" target="_blank">
                  <img src="${coverUrl}" alt="${book.title}">
                </a>
                <p><strong><a href="${bookUrl}" target="_blank">${book.title}</a></strong></p>
                <p>${author}</p>
                <p>${year}</p>
              </div>
            `;
        });
        resultsDiv.innerHTML += html;
        currentIndex += slice.length;

        if (currentIndex < books.length) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            if (data.docs.length === 0) {
                resultsDiv.innerHTML = '<p>No results found.</p>';
                return;
            }
            books = data.docs;
            resultsDiv.innerHTML = '';
            renderBooks();
        })
        .catch(err => {
            resultsDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        });

    loadMoreBtn.onclick = () => renderBooks();
});