'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchSuggestion {
  type: 'product' | 'category' | 'brand' | 'feature';
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
}

interface EnhancedSearchProps {
  initialQuery?: string;
  placeholder?: string;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function EnhancedSearch({
  initialQuery = '',
  placeholder = 'Search for blinds, shades, or shutters...',
  showFilters = true,
  onSearch,
  className = ''
}: EnhancedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v2/commerce/products/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`);
      
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        setSuggestions(data.data?.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updatedRecentSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5);
    
    setRecentSearches(updatedRecentSearches);
    localStorage.setItem('recent_searches', JSON.stringify(updatedRecentSearches));

    // Track search analytics
    fetch('/api/v2/commerce/products/search/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        resultCount: suggestions.length
      })
    }).catch(console.error);

    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    } else if (recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const totalItems = suggestions.length + (query.length < 2 ? recentSearches.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (query.length < 2 && selectedIndex < recentSearches.length) {
            // Recent search selected
            const selectedSearch = recentSearches[selectedIndex];
            setQuery(selectedSearch);
            handleSearch(selectedSearch);
          } else if (suggestions.length > 0) {
            // Suggestion selected
            const adjustedIndex = query.length < 2 ? selectedIndex - recentSearches.length : selectedIndex;
            if (adjustedIndex >= 0 && adjustedIndex < suggestions.length) {
              const suggestion = suggestions[adjustedIndex];
              router.push(suggestion.url);
              setShowSuggestions(false);
            }
          }
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(suggestion.url);
    setShowSuggestions(false);
    
    // Track click analytics
    fetch('/api/v2/commerce/products/search/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        resultCount: suggestions.length,
        clickedResult: suggestion.title
      })
    }).catch(console.error);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product': return '🔍';
      case 'category': return '📂';
      case 'brand': return '🏷️';
      case 'feature': return '⭐';
      default: return '🔍';
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}

        {loading && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-red"></div>
          </div>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Clock className="h-4 w-4 mr-1" />
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentQuery)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-50 ${
                    selectedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium">{recentQuery}</div>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              {query.length >= 2 && (
                <div className="flex items-center text-sm text-gray-500 mb-2 px-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Suggestions
                </div>
              )}
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = query.length < 2 ? index + recentSearches.length : index;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-50 flex items-start space-x-3 ${
                      selectedIndex === adjustedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    {suggestion.image ? (
                      <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        <img
                          src={suggestion.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-lg">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {suggestion.type}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Query Option */}
          {query.length >= 2 && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => handleSearch(query)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-primary-red bg-opacity-10 rounded flex-shrink-0 flex items-center justify-center">
                  <Search className="h-5 w-5 text-primary-red" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    Search for "<span className="text-primary-red">{query}</span>"
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && suggestions.length === 0 && !loading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No suggestions found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}