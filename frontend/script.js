// API URL - use relative path so browser calls same host (ALB)
// This works both locally (localhost) and in cloud (ALB DNS)
const API_URL = window.location.origin;

// Store current quote globally so we can favorite/share it
let currentQuote = null;

// Run when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('CloudQuotes app loaded!');
    checkAPIStatus();
    getNewQuote();
    loadStats();
});

// Check if backend API is running
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
            document.getElementById('api-status').textContent = '✅ Online';
            document.getElementById('api-status').style.color = '#51cf66';
        } else {
            document.getElementById('api-status').textContent = '❌ Offline';
            document.getElementById('api-status').style.color = '#ff6b6b';
        }
    } catch (error) {
        console.error('API is not responding:', error);
        document.getElementById('api-status').textContent = '❌ Offline';
        document.getElementById('api-status').style.color = '#ff6b6b';
    }
}

// Fetch a new random quote from API
async function getNewQuote() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-message');
    const quoteDisplay = document.getElementById('quote-display');
    
    try {
        // Show loading state
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        quoteDisplay.style.display = 'none';
        
        // Make API request
        const response = await fetch(`${API_URL}/api/quotes/random`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch quote');
        }
        
        const quote = await response.json();
        currentQuote = quote;
        
        // Display the quote
        displayQuote(quote);
        
        // Load favorite count for this quote
        loadFavoriteCount(quote.id);
        
    } catch (error) {
        console.error('Error loading quote:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = '❌ Could not load quote. Please check if the backend is running.';
    }
}

// Get quote by specific category
async function getQuoteByCategory(category) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-message');
    const quoteDisplay = document.getElementById('quote-display');
    
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        quoteDisplay.style.display = 'none';
        
        const response = await fetch(`${API_URL}/api/quotes/category/${category}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch quote');
        }
        
        const quote = await response.json();
        currentQuote = quote;
        
        displayQuote(quote);
        loadFavoriteCount(quote.id);
        
    } catch (error) {
        console.error('Error loading quote:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = '❌ Could not load quote from this category.';
    }
}

// Display quote on the page
function displayQuote(quote) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('quote-display').style.display = 'block';
    
    document.getElementById('quote-text').textContent = quote.text;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
    document.getElementById('quote-category').textContent = quote.category.toUpperCase();
}

// Load favorite count for a quote
async function loadFavoriteCount(quoteId) {
    try {
        const response = await fetch(`${API_URL}/api/favorites/count/${quoteId}`);
        const data = await response.json();
        document.getElementById('favorite-count').textContent = data.count;
    } catch (error) {
        console.error('Error loading favorite count:', error);
        document.getElementById('favorite-count').textContent = '0';
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        const stats = await response.json();
        
        document.getElementById('total-quotes').textContent = stats.total_quotes;
        document.getElementById('total-favorites').textContent = stats.total_favorites;
    } catch (error) {
        console.error('Error loading stats:', error);
        // don't show error for stats - it's not critical
    }
}

// Show modal for favoriting
function showFavoriteModal() {
    if (!currentQuote) {
        alert('Please load a quote first!');
        return;
    }
    document.getElementById('favorite-modal').style.display = 'block';
}

// Close favorite modal
function closeFavoriteModal() {
    document.getElementById('favorite-modal').style.display = 'none';
    document.getElementById('favorite-form').reset();
    document.getElementById('favorite-message').textContent = '';
    document.getElementById('favorite-message').className = '';
}

// Submit favorite
async function submitFavorite(event) {
    event.preventDefault();
    
    const userName = document.getElementById('user-name').value;
    const messageEl = document.getElementById('favorite-message');
    
    try {
        const response = await fetch(`${API_URL}/api/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quote_id: currentQuote.id,
                user_name: userName
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            messageEl.textContent = '✅ ' + result.message;
            messageEl.className = 'success';
            
            // Refresh favorite count and stats
            loadFavoriteCount(currentQuote.id);
            loadStats();
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeFavoriteModal();
            }, 2000);
        } else {
            messageEl.textContent = '❌ ' + result.error;
            messageEl.className = 'error';
        }
    } catch (error) {
        console.error('Error submitting favorite:', error);
        messageEl.textContent = '❌ Could not submit favorite. Please try again.';
        messageEl.className = 'error';
    }
}

// Show modal for submitting quote
function showSubmitModal() {
    document.getElementById('submit-modal').style.display = 'block';
}

// Close submit modal
function closeSubmitModal() {
    document.getElementById('submit-modal').style.display = 'none';
    document.getElementById('submit-form').reset();
    document.getElementById('submit-message').textContent = '';
    document.getElementById('submit-message').className = '';
}

// Submit new quote
async function submitQuote(event) {
    event.preventDefault();
    
    const text = document.getElementById('quote-text-input').value;
    const author = document.getElementById('quote-author-input').value;
    const category = document.getElementById('quote-category-input').value;
    const messageEl = document.getElementById('submit-message');
    
    try {
        const response = await fetch(`${API_URL}/api/quotes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                author: author,
                category: category
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            messageEl.textContent = '✅ ' + result.message;
            messageEl.className = 'success';
            
            // Refresh stats
            loadStats();
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeSubmitModal();
            }, 2000);
        } else {
            messageEl.textContent = '❌ ' + result.error;
            messageEl.className = 'error';
        }
    } catch (error) {
        console.error('Error submitting quote:', error);
        messageEl.textContent = '❌ Could not submit quote. Please try again.';
        messageEl.className = 'error';
    }
}

// Share quote (simple alert for now, could integrate with social media APIs)
function shareQuote() {
    if (!currentQuote) {
        alert('Please load a quote first!');
        return;
    }
    
    const shareText = `"${currentQuote.text}" - ${currentQuote.author}`;
    
    // Try to use Web Share API if available (works on mobile)
    if (navigator.share) {
        navigator.share({
            title: 'CloudQuotes',
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('✅ Quote copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text:', err);
            alert('Quote: ' + shareText);
        });
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const favoriteModal = document.getElementById('favorite-modal');
    const submitModal = document.getElementById('submit-modal');
    
    if (event.target == favoriteModal) {
        closeFavoriteModal();
    }
    if (event.target == submitModal) {
        closeSubmitModal();
    }
}