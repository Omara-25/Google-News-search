// API configuration - Read from config.js
// In a production environment, this would use environment variables
// Check if config exists, if not create a default config object
if (typeof config === 'undefined') {
    console.warn('Config not found, using default configuration');
    window.config = {
        apiKeys: [
            '9e189ebd0bmsh5b2f5ae32f3db59p150ff3jsn325131d694bf', // Fallback primary key
            '4f87a77f12msh615c9318ae3c588p182355jsne45ac9881da5'  // Fallback backup key
        ],
        useAlternativeEndpoints: true,
        resultsPerPage: 9
    };
}

const apiKeys = config.apiKeys || [
    '4f87a77f12msh615c9318ae3c588p182355jsne45ac9881da5', // Fallback primary key
    '4f87a77f12msh615c9318ae3c588p182355jsne45ac9881da5'  // Fallback backup key
];
let currentApiKeyIndex = 0;

// API hosts and endpoints
const apiConfig = {
    googleNews: {
        host: 'google-news22.p.rapidapi.com',
        endpoints: [
            {
                url: (query) => `https://google-news22.p.rapidapi.com/v1/search?q=${encodeURIComponent(query)}&country=us&language=en`,
                name: "Google News v1 search endpoint"
            },
            {
                url: (query) => `https://google-news22.p.rapidapi.com/search?q=${encodeURIComponent(query)}&country=us&language=en`,
                name: "Google News standard search endpoint"
            },
            {
                url: (query) => `https://google-news22.p.rapidapi.com/top-headlines?country=us&language=en`,
                name: "Google News top headlines endpoint"
            }
        ]
    },
    realTimeNews: {
        host: 'real-time-news-data.p.rapidapi.com',
        endpoints: [
            {
                url: (query) => `https://real-time-news-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&country=US&lang=en&limit=100`,
                name: "Real-time News search endpoint"
            },
            {
                url: (query) => `https://real-time-news-data.p.rapidapi.com/topic-news-by-section?topic=${encodeURIComponent(query)}&section=CAQiSkNCQVNNUW9JTDIwdk1EZGpNWFlTQldWdUxVZENHZ0pKVENJT0NBUWFDZ29JTDIwdk1ETnliSFFxQ2hJSUwyMHZNRE55YkhRb0FBKi4IACoqCAoiJENCQVNGUW9JTDIwdk1EZGpNWFlTQldWdUxVZENHZ0pKVENnQVABUAE&limit=500&country=US&lang=en`,
                name: "Real-time News topic endpoint"
            }
        ]
    }
};

// Alternative endpoints if RapidAPI fails
const useAlternativeEndpoints = config.useAlternativeEndpoints || true; // Set to false to use only RapidAPI

// Pagination variables
let currentPage = 1;
let totalResults = 0;
let resultsPerPage = config.resultsPerPage || 9;
let allArticles = [];

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const searchForm = document.getElementById('search-form');
    const queryInput = document.getElementById('query');
    const sourceInput = document.getElementById('source');
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const toggleTipsBtn = document.getElementById('toggle-tips');
    const searchTips = document.getElementById('search-tips');
    const errorContainer = document.getElementById('error-container');
    const resultsContainer = document.getElementById('results-container');
    const resultsCount = document.getElementById('results-count');
    const loadingElement = document.getElementById('loading');
    const newsGrid = document.getElementById('news-grid');
    const paginationElement = document.getElementById('pagination');
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedOptions = document.getElementById('advanced-options');
    const downloadCsvBtn = document.getElementById('download-csv');

    // Event listeners
    searchForm.addEventListener('submit', handleSearch);
    toggleTipsBtn.addEventListener('click', toggleSearchTips);
    advancedToggle.addEventListener('click', toggleAdvancedOptions);
    downloadCsvBtn.addEventListener('click', handleDownloadCsv);

    // Check URL parameters for search
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
        queryInput.value = queryParam;
        if (urlParams.get('source')) sourceInput.value = urlParams.get('source');
        if (urlParams.get('from')) fromDateInput.value = urlParams.get('from');
        if (urlParams.get('to')) toDateInput.value = urlParams.get('to');

        // Auto search if we have parameters
        handleSearch(new Event('submit'));
    }

    function toggleSearchTips() {
        searchTips.classList.toggle('hidden');
        toggleTipsBtn.textContent = searchTips.classList.contains('hidden')
            ? 'Show search tips ▼'
            : 'Hide search tips ▲';
    }

    function toggleAdvancedOptions() {
        advancedOptions.classList.toggle('hidden');
        const toggleText = advancedOptions.classList.contains('hidden')
            ? 'Show more options ▼'
            : 'Hide options ▲';
        advancedToggle.querySelector('.advanced-options-toggle').textContent = toggleText;
    }

    function getApiKey() {
        return apiKeys[currentApiKeyIndex];
    }

    function rotateApiKey() {
        currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
        return getApiKey();
    }

    function handleSearch(e) {
        e.preventDefault();

        const query = queryInput.value.trim();
        const source = sourceInput.value.trim();
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;

        if (!query) {
            showMessage('Please enter a search query', true);
            return;
        }

        // Validate date range if both dates are provided
        if (fromDate && toDate) {
            const fromTimestamp = new Date(fromDate).getTime();
            const toTimestamp = new Date(toDate).getTime();

            if (fromTimestamp > toTimestamp) {
                showMessage('From date cannot be later than To date', true);
                return;
            }
        }

        // Update URL with search parameters
        const url = new URL(window.location);
        url.searchParams.set('q', query);

        if (source) url.searchParams.set('source', source);
        else url.searchParams.delete('source');

        if (fromDate) url.searchParams.set('from', fromDate);
        else url.searchParams.delete('from');

        if (toDate) url.searchParams.set('to', toDate);
        else url.searchParams.delete('to');

        window.history.pushState({}, '', url);

        // Reset pagination
        currentPage = 1;

        // Call fetchNews with query and optional parameters
        fetchNews(query, source, fromDate, toDate);
    }

    // Fallback function to load sample news data
    function loadSampleNewsData() {
        const sampleArticles = [
            {
                title: "Sample Technology Article 1",
                description: "This is a sample article about technology created when the API connection failed.",
                source: "Sample News",
                published_date: new Date().toISOString(),
                link: "https://example.com/article1",
                thumbnail: "https://via.placeholder.com/300x200?text=Technology+News"
            },
            {
                title: "Sample Technology Article 2",
                description: "Another sample article with technology news and developments.",
                source: "Sample Tech News",
                published_date: new Date().toISOString(),
                link: "https://example.com/article2",
                thumbnail: "https://via.placeholder.com/300x200?text=Tech+News"
            },
            {
                title: "API Connection Issues",
                description: "This sample data is shown because there were issues connecting to the Google News API. Please check your API key or try again later.",
                source: "System Message",
                published_date: new Date().toISOString(),
                link: "https://rapidapi.com/bonaipowered/api/google-news22/",
                thumbnail: "https://via.placeholder.com/300x200?text=API+Notice"
            }
        ];

        // Store sample articles
        allArticles = [...sampleArticles];
        totalResults = allArticles.length;

        // Display sample results
        displayResults(allArticles, 1);
        resultsContainer.classList.remove('hidden');
        showMessage('Showing sample news data. The API connection failed, but you can see how the interface works with this sample data.', false);
    }

    function fetchNews(query, source, fromDate, toDate) {
        showLoading(true);
        errorContainer.classList.add('hidden');
        downloadCsvBtn.disabled = true;

        // Create a list of all available endpoints from all APIs
        const allEndpoints = [];

        // Add Real-Time News endpoints first (higher priority)
        apiConfig.realTimeNews.endpoints.forEach(endpoint => {
            allEndpoints.push({
                url: endpoint.url(query),
                name: endpoint.name,
                host: apiConfig.realTimeNews.host
            });
        });

        // Add Google News endpoints next
        apiConfig.googleNews.endpoints.forEach(endpoint => {
            allEndpoints.push({
                url: endpoint.url(query),
                name: endpoint.name,
                host: apiConfig.googleNews.host
            });
        });

        // Add source parameter if provided to Google News endpoints
        if (source) {
            allEndpoints.forEach(endpoint => {
                if (endpoint.host === 'google-news22.p.rapidapi.com') {
                    endpoint.url += `&source=${encodeURIComponent(source)}`;
                }
            });
        }

        // Try each endpoint one after another until one succeeds
        tryNextEndpoint(allEndpoints, 0, 0); // Start with first endpoint and first API key

        function tryNextEndpoint(endpoints, endpointIndex, apiKeyIndex) {
            if (endpointIndex >= endpoints.length) {
                // If we've tried all endpoints with the current API key, try with next key
                if (apiKeyIndex < apiKeys.length - 1) {
                    currentApiKeyIndex = apiKeyIndex + 1;
                    tryNextEndpoint(endpoints, 0, currentApiKeyIndex); // Start over with endpoints using new key
                } else if (useAlternativeEndpoints) {
                    // If all endpoints and keys failed, try the fallback
                    loadSampleNewsData();
                } else {
                    showLoading(false);
                    showMessage("All API endpoints failed. Please check your API key or try again later.", true);
                }
                return;
            }

            const currentEndpoint = endpoints[endpointIndex];

            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': apiKeys[apiKeyIndex],
                    'X-RapidAPI-Host': currentEndpoint.host
                }
            };

            fetch(currentEndpoint.url, options)
                .then(response => {
                    if (!response.ok) {
                        // If unauthorized, possibly bad API key
                        if (response.status === 401 || response.status === 403) {
                            throw new Error(`API key unauthorized`);
                        } else {
                            throw new Error(`API request failed with status ${response.status}`);
                        }
                    }
                    return response.json();
                })
                .then(data => {
                    // Extract articles based on which API we're using
                    let articles = [];
                    if (currentEndpoint.host === 'real-time-news-data.p.rapidapi.com') {
                        articles = extractRealTimeNewsArticles(data);
                    } else {
                        articles = extractGoogleNewsArticles(data);
                    }

                    if (articles.length > 0) {
                        showLoading(false);
                        // Store all articles for filtering and pagination
                        allArticles = [...articles];

                        // Apply date filtering if dates are provided
                        if (fromDate || toDate) {
                            allArticles = filterArticlesByDate(allArticles, fromDate, toDate);
                        }

                        if (allArticles.length > 0) {
                            totalResults = allArticles.length;
                            displayResults(allArticles, currentPage);
                            resultsContainer.classList.remove('hidden');
                        } else {
                            showMessage('No results match your date filters. Try adjusting your search criteria.', false);
                            resultsContainer.classList.add('hidden');
                        }
                    } else {
                        // Try the next endpoint
                        tryNextEndpoint(endpoints, endpointIndex + 1, apiKeyIndex);
                    }
                })
                .catch(error => {
                    // If API key error, try next key
                    if (error.message.includes('API key unauthorized') && apiKeyIndex < apiKeys.length - 1) {
                        tryNextEndpoint(endpoints, endpointIndex, apiKeyIndex + 1);
                    } else {
                        // Otherwise try next endpoint with same key
                        tryNextEndpoint(endpoints, endpointIndex + 1, apiKeyIndex);
                    }
                });
        }

        function extractRealTimeNewsArticles(data) {
            let articles = [];

            // Real-Time News API response structure
            if (data && data.data && Array.isArray(data.data)) {
                articles = data.data.map(item => {
                    return {
                        title: item.title || 'Untitled',
                        description: item.description || item.content || 'No description available',
                        source: item.source || 'Unknown Source',
                        published_date: item.published_date || item.pubDate || new Date().toISOString(),
                        link: item.link || item.url || '#',
                        thumbnail: item.image_url || item.photo_url || item.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image+Available'
                    };
                });
            }

            return articles;
        }

        function extractGoogleNewsArticles(data) {
            // Attempt to extract articles from various possible response formats
            let articles = [];

            if (data && typeof data === 'object') {
                // Check various possible article array locations
                if (data.articles && Array.isArray(data.articles)) {
                    articles = data.articles;
                } else if (data.items && Array.isArray(data.items)) {
                    articles = data.items;
                } else if (data.results && Array.isArray(data.results)) {
                    articles = data.results;
                } else if (data.news && Array.isArray(data.news)) {
                    articles = data.news;
                } else if (data.data && Array.isArray(data.data)) {
                    articles = data.data;
                } else if (Array.isArray(data)) {
                    articles = data;
                }

                // Fallback: try to find any array in the response
                if (articles.length === 0) {
                    for (const key in data) {
                        if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0].title) {
                            articles = data[key];
                            break;
                        }
                    }
                }
            }

            return articles;
        }
    }

    function filterArticlesByDate(articles, fromDate, toDate) {
        if (!fromDate && !toDate) return articles;

        return articles.filter(article => {
            if (!article.published_date) return true;

            const articleDate = new Date(article.published_date).getTime();

            if (fromDate && toDate) {
                const fromTimestamp = new Date(fromDate).getTime();
                const toTimestamp = new Date(toDate).getTime() + (24 * 60 * 60 * 1000); // Include full end date
                return articleDate >= fromTimestamp && articleDate <= toTimestamp;
            } else if (fromDate) {
                const fromTimestamp = new Date(fromDate).getTime();
                return articleDate >= fromTimestamp;
            } else if (toDate) {
                const toTimestamp = new Date(toDate).getTime() + (24 * 60 * 60 * 1000);
                return articleDate <= toTimestamp;
            }

            return true;
        });
    }

    function displayResults(articles, page) {
        newsGrid.innerHTML = '';

        // Calculate pagination
        const startIndex = (page - 1) * resultsPerPage;
        const endIndex = Math.min(startIndex + resultsPerPage, articles.length);
        const currentArticles = articles.slice(startIndex, endIndex);

        resultsCount.textContent = `Showing ${startIndex + 1}-${endIndex} of ${articles.length} results`;

        // Create article cards
        currentArticles.forEach(article => {
            const card = createArticleCard(article);
            newsGrid.appendChild(card);
        });

        // Create pagination
        createPagination(articles.length, page);

        // Update download button state
        updateDownloadButtonState();
    }

    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card';

        // Get title - sanitize to prevent XSS
        const title = sanitizeHTML(article.title || article.headline || 'Untitled');

        // Format date
        let publishedDate = 'Unknown date';
        try {
            const dateValue = article.published_date || article.publishedAt || article.date ||
                              article.published || article.pubDate || null;

            if (dateValue) {
                publishedDate = new Date(dateValue).toLocaleDateString();
            }
        } catch (e) {
            console.error('Error formatting date:', e);
        }

        // Get image URL - use any available image property or default
        const imageUrl = article.thumbnail || article.image || article.urlToImage ||
            article.media_url || article.image_url || article.imageUrl ||
            'https://via.placeholder.com/300x200?text=No+Image+Available';

        // Get article URL
        const articleUrl = article.link || article.url || article.web_url ||
            article.articleUrl || article.sourceUrl || '#';

        // Get description/snippet - sanitize to prevent XSS
        const description = sanitizeHTML(
            article.snippet || article.description || article.content ||
            article.summary || article.abstract || article.text ||
            'No description available'
        );

        // Get source
        const source = article.source || article.publisher || article.site ||
            article.sourceName || article.publication || 'Unknown Source';

        // Create the article card HTML
        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}" class="news-image" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
            <div class="news-content">
                <div class="news-source">
                    <span>${source}</span>
                    <span class="news-date">${publishedDate}</span>
                </div>
                <h3 class="news-title">${title}</h3>
                <p class="news-description">${description}</p>
                <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="news-link">Read Full Article</a>
            </div>
        `;

        return card;
    }

    // Helper function to sanitize HTML content
    function sanitizeHTML(text) {
        if (!text || typeof text !== 'string') return '';

        // Create a temporary element
        const temp = document.createElement('div');
        // Set its text content to the input text (browser handles escaping)
        temp.textContent = text;
        // Return the sanitized HTML
        return temp.innerHTML;
    }

    function createPagination(totalItems, currentPage) {
        paginationElement.innerHTML = '';

        const totalPages = Math.ceil(totalItems / resultsPerPage);

        if (totalPages <= 1) {
            return;
        }

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
        paginationElement.appendChild(prevButton);

        // Page numbers - show at most 5 pages
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentPage);
            pageButton.addEventListener('click', () => goToPage(i));
            paginationElement.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next →';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                goToPage(currentPage + 1);
            }
        });
        paginationElement.appendChild(nextButton);
    }

    function goToPage(page) {
        currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        displayResults(allArticles, page);
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingElement.classList.remove('hidden');
            newsGrid.classList.add('hidden');
            paginationElement.classList.add('hidden');
        } else {
            loadingElement.classList.add('hidden');
            newsGrid.classList.remove('hidden');
            paginationElement.classList.remove('hidden');
        }
    }

    function showMessage(message, isError) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');

        if (isError) {
            errorContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            errorContainer.style.borderLeftColor = 'var(--error-color)';
            errorContainer.style.color = 'var(--error-color)';
        } else {
            errorContainer.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            errorContainer.style.borderLeftColor = 'var(--success-color)';
            errorContainer.style.color = 'var(--success-color)';
        }

        // Auto hide message after 5 seconds
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }

    // Function to convert news data to CSV format
    function convertToCSV(articles) {
        // Define CSV headers
        const headers = ['Title', 'Description', 'Source', 'Published Date', 'Link'];

        // Create CSV content starting with headers
        let csvContent = headers.join(',') + '\n';

        // Add each article as a row in the CSV
        articles.forEach(article => {
            // Get article data, ensuring proper CSV formatting
            const title = formatForCSV(article.title || article.headline || 'Untitled');
            const description = formatForCSV(article.snippet || article.description || article.content ||
                article.summary || article.abstract || article.text || 'No description available');
            const source = formatForCSV(article.source || article.publisher || article.site ||
                article.sourceName || article.publication || 'Unknown Source');

            // Format date
            let publishedDate = 'Unknown date';
            try {
                const dateValue = article.published_date || article.publishedAt || article.date ||
                                article.published || article.pubDate || null;

                if (dateValue) {
                    publishedDate = new Date(dateValue).toLocaleDateString();
                }
            } catch (e) {
                console.error('Error formatting date:', e);
            }

            // Get article URL
            const articleUrl = article.link || article.url || article.web_url ||
                article.articleUrl || article.sourceUrl || '#';

            // Add row to CSV content
            const row = [title, description, source, publishedDate, articleUrl].join(',');
            csvContent += row + '\n';
        });

        return csvContent;
    }

    // Helper function to format text for CSV (escape commas, quotes, etc.)
    function formatForCSV(text) {
        if (!text || typeof text !== 'string') return '""';

        // Remove line breaks and tabs
        text = text.replace(/\r?\n|\r|\t/g, ' ');

        // If text contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            text = '"' + text.replace(/"/g, '""') + '"';
        }

        return text;
    }

    // Function to handle CSV download
    function handleDownloadCsv() {
        if (allArticles.length === 0) {
            showMessage('No news data available to download', true);
            return;
        }

        try {
            // Convert articles to CSV
            const csvContent = convertToCSV(allArticles);

            // Create a Blob with the CSV content
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // Create a temporary URL for the Blob
            const url = URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;

            // Set the filename with current date
            const date = new Date().toISOString().slice(0, 10);
            const query = queryInput.value.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'news_search';
            link.download = `news_data_${query}_${date}.csv`;

            // Append the link to the body, click it, and remove it
            document.body.appendChild(link);
            link.click();

            // Small delay before cleanup to ensure download starts
            setTimeout(() => {
                document.body.removeChild(link);
                // Clean up the URL object
                URL.revokeObjectURL(url);
            }, 100);

            showMessage('CSV file downloaded successfully', false);
        } catch (error) {
            console.error('Download error:', error);
            showMessage('Error creating download: ' + error.message, true);
        }
    }

    // Function to update the download button state
    function updateDownloadButtonState() {
        if (allArticles.length > 0) {
            downloadCsvBtn.disabled = false;
        } else {
            downloadCsvBtn.disabled = true;
        }
    }
});
// Add this to your GitHub Pages site
window.addEventListener('message', function(event) {
    // Check if the message is asking for height
    if (event.data === 'getHeight') {
    // Calculate the full height of the document
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    ) + 50; // Add padding
    
    // Send height back to parent
    window.parent.postMessage({height: height}, '*');
  }
});

// Also send height whenever content changes
const observer = new MutationObserver(function() {
  const height = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  ) + 50;
  
  window.parent.postMessage({height: height}, '*');
});

// Start observing the document for content changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});
