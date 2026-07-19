document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration details ---
    const SUPABASE_URL = 'https://whgsolhymmnraavyqvii.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_ZwPIGbPy_QVm5t31E-pC2A_qQh4EEnB';
    let supabaseClient = null;

    // Helper to escape HTML values
    function escapeHtml(string) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(string).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Helper to capitalize strings
    function capitalize(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // Dynamic Supabase SDK Loader
    function ensureSupabaseLoaded() {
        return new Promise((resolve) => {
            if (window.supabase) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    // Initialize Supabase Client
    function getSupabaseClient() {
        if (supabaseClient) return supabaseClient;
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return supabaseClient;
        }
        return null;
    }

    // --- Header Scroll Logic ---
    const header = document.getElementById('main-header');
    const logo = document.getElementById('header-logo');
    
    // Only run header scroll background swap on page scroll if it's the home header (fixed transparent style)
    const isHomeHeader = header && header.classList.contains('fixed');
    
    const handleScroll = () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('scrolled', 'text-primary-dark');
            header.classList.remove('text-white');
            if (logo && isHomeHeader) {
                logo.src = '/logo.webp';
            }
        } else {
            if (isHomeHeader) {
                header.classList.remove('scrolled', 'text-primary-dark');
                header.classList.add('text-white');
                if (logo) {
                    logo.src = '/logo-white.webp';
                }
            }
        }
    };
    
    if (header) {
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Execute on load to set initial state
    }

    // --- Mobile Menu Toggle Drawer Logic ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('max-h-96');
            if (isOpen) {
                // Close
                mobileMenu.classList.add('max-h-0', 'opacity-0', 'scale-y-95');
                mobileMenu.classList.remove('max-h-96', 'opacity-100', 'scale-y-100');
            } else {
                // Open
                mobileMenu.classList.remove('max-h-0', 'opacity-0', 'scale-y-95');
                mobileMenu.classList.add('max-h-96', 'opacity-100', 'scale-y-100');
            }
        });

        // Close mobile drawer menu when any link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('max-h-0', 'opacity-0', 'scale-y-95');
                mobileMenu.classList.remove('max-h-96', 'opacity-100', 'scale-y-100');
            });
        });
    }

    // --- Search Modal Logic ---
    const searchButton = document.getElementById('search-button');
    const searchModal = document.getElementById('search-modal');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchButton && searchModal) {
        // Show Search Modal
        searchButton.addEventListener('click', async (e) => {
            e.preventDefault();
            searchModal.classList.remove('hidden');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            if (searchResults) searchResults.innerHTML = '';
            
            // Dynamic load Supabase if not present
            try {
                await ensureSupabaseLoaded();
            } catch (err) {
                console.error("Failed to load search provider:", err);
            }
        });

        // Hide Search Modal helpers
        const hideModal = () => {
            searchModal.classList.add('hidden');
        };

        if (closeSearch) {
            closeSearch.addEventListener('click', hideModal);
        }

        // Close search when clicking on the backdrop overlay itself
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                hideModal();
            }
        });

        // ESC Keybind support to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
                hideModal();
            }
        });

        // Live Dynamic Searching
        if (searchInput && searchResults) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                const query = searchInput.value.trim();
                
                if (query.length < 2) {
                    searchResults.innerHTML = '';
                    return;
                }

                searchResults.innerHTML = '<div class="text-sm text-gray-400 py-3 text-center">Searching...</div>';

                debounceTimer = setTimeout(async () => {
                    try {
                        await ensureSupabaseLoaded();
                    } catch (err) {
                        searchResults.innerHTML = '<div class="text-sm text-red-500 py-3 text-center">Failed to load search provider.</div>';
                        return;
                    }
                    const client = getSupabaseClient();
                    if (!client) {
                        searchResults.innerHTML = '<div class="text-sm text-red-500 py-3 text-center">Database client unavailable.</div>';
                        return;
                    }

                    try {
                        const { data, error } = await client
                            .from('content')
                            .select('id, title, tag, created_at')
                            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                            .order('created_at', { ascending: false })
                            .limit(5);

                        if (error) throw error;

                        if (!data || data.length === 0) {
                            searchResults.innerHTML = '<div class="text-sm text-gray-400 py-3 text-center">No matching insights found.</div>';
                            return;
                        }

                        searchResults.innerHTML = '';
                        data.forEach(item => {
                            const date = new Date(item.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });
                            const tag = item.tag ? item.tag.split(',')[0] : 'Insight';

                            const itemDiv = document.createElement('a');
                            itemDiv.href = `/articles/?id=${item.id}`;
                            itemDiv.className = "block py-3 hover:bg-gray-50 px-3 rounded-lg transition group";
                            itemDiv.innerHTML = `
                                <div class="flex justify-between items-start">
                                    <div class="font-medium text-gray-800 group-hover:text-gold transition text-sm">${escapeHtml(item.title)}</div>
                                    <span class="text-[10px] bg-gold/10 text-gold font-semibold uppercase px-2 py-0.5 rounded border border-gold/20 flex-shrink-0 ml-3">${escapeHtml(capitalize(tag))}</span>
                                </div>
                                <div class="text-[11px] text-gray-400 mt-1">${date}</div>
                            `;
                            searchResults.appendChild(itemDiv);
                        });

                    } catch (err) {
                        console.error('Search query error:', err.message);
                        searchResults.innerHTML = `<div class="text-sm text-red-500 py-3 text-center">Error fetching: ${err.message}</div>`;
                    }
                }, 300);
            });
        }
    }
});
