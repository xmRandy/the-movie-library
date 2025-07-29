// Pages/Home.jsx - Simplified Loading for Stability

import MovieCard from "../Components/MovieCard";
import { useState, useEffect } from "react"; // No useCallback needed for simplicity
import { searchMovies, getPopularMovies } from "../services/api";
import "../css/Home.css";

const MOVIES_PER_PAGE_API = 20; // TMDB returns 20 movies per page by default
const MAX_POPULAR_MOVIES_TO_FETCH = 500; // Total popular movies to fetch in background
const INITIAL_MOVIES_TO_DISPLAY = 34; // Movies shown on first load
const MOVIES_TO_ADD_ON_LOAD_MORE = 21; // Movies added with each "Load More" click


function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPopularMovies, setAllPopularMovies] = useState([]); // Stores all 500 fetched movies
  const [displayedMovies, setDisplayedMovies] = useState([]); // Movies currently visible on screen
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isSearching, setIsSearching] = useState(false); // Flag to know if currently in search mode
  // No need for currentPage, totalPagesFromApi, hasMorePopularMovies for popular movies when pre-fetching

  // --- Initial Load Effect (Fetches all 500 popular movies on mount) ---
  useEffect(() => {
    const fetchAllPopularMovies = async () => {
      setLoading(true);
      setError(null);
      setIsSearching(false); // Ensure we're in popular mode initially
      
      let fetchedMovies = [];
      let currentPage = 1;
      let totalPages = 1; // Start with 1, update from API response

      try {
        while (fetchedMovies.length < MAX_POPULAR_MOVIES_TO_FETCH && currentPage <= totalPages) {
          const response = await getPopularMovies(currentPage); // getPopularMovies returns { results, page, total_pages }
          
          fetchedMovies = [...fetchedMovies, ...response.results];
          totalPages = response.total_pages; // Keep totalPages updated from API
          
          if (currentPage >= totalPages) { // Stop if we hit the actual end of pages
            console.log(`[Home] Reached last page of popular movies from API: ${totalPages}`);
            break;
          }
          currentPage++;
        }
        
        // Slice to MAX_POPULAR_MOVIES_TO_FETCH if we fetched more
        const finalPopularMovies = fetchedMovies.slice(0, MAX_POPULAR_MOVIES_TO_FETCH);
        setAllPopularMovies(finalPopularMovies);
        setDisplayedMovies(finalPopularMovies.slice(0, INITIAL_MOVIES_TO_DISPLAY)); // Show initial 34
        
        console.log(`[Home] Fetched total ${finalPopularMovies.length} popular movies. Displaying ${INITIAL_MOVIES_TO_DISPLAY} initially.`);

      } catch (err) {
        console.error("[Home] Failed to load all popular movies:", err);
        setError("Failed to load popular movies. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Only run this fetch when we are NOT in search mode.
    // If returning from search, this will also re-trigger to show popular movies.
    if (!isSearching) {
        fetchAllPopularMovies();
    }
  }, [isSearching]); // Dependency: re-run when we exit search mode


  // --- Load More Handler (Client-side pagination) ---
  const handleLoadMore = () => {
    if (loading) return; // Prevent multiple clicks while loading search results

    // Calculate the next end index for displayed movies
    const nextEndIndex = displayedMovies.length + MOVIES_TO_ADD_ON_LOAD_MORE;
    
    // Slice from the pre-fetched allPopularMovies array
    const nextBatch = allPopularMovies.slice(0, nextEndIndex);
    
    setDisplayedMovies(nextBatch);
    console.log(`[Home] Loaded ${nextBatch.length - displayedMovies.length} more movies. Now displaying ${nextBatch.length} movies.`);
  };


  // --- Search Handler (resets to display search results) ---
  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
        setIsSearching(false); // Exit search mode, useEffect will re-fetch popular movies
        setSearchQuery("");
        return;
    }
    if (loading) return; // Prevent multiple searches

    setLoading(true);
    setError(null);
    setIsSearching(true); // Indicate we are in search mode

    try {
      const searchResults = await searchMovies(trimmedQuery); // searchMovies returns data.results directly
      setDisplayedMovies(searchResults); // Display search results
      console.log(`[Home] Search for "${trimmedQuery}" returned ${searchResults.length} results.`);
    } catch (err) {
      console.error("[Home] Failed to search movies:", err);
      setError("Failed to search movies.");
    } finally {
      setLoading(false);
    }
  };

  // --- Determine if "Load More" button should be visible ---
  const shouldShowLoadMore = 
    !loading && 
    !isSearching && // Only show if not in search mode
    displayedMovies.length < allPopularMovies.length; // Show only if more movies are available in the pre-fetched list


  return (
    <div className="home">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for movies"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      {error && <div className="error_message">{error}</div>}

      <div className="movies-grid">
        {displayedMovies.map((movie) => ( // Render from displayedMovies state
          <MovieCard movie={movie} key={movie.id} />
        ))}
        
        {/* Load More Button - Conditionally rendered as a MovieCard */}
        {shouldShowLoadMore && (
            <div className="load-more-card">
                <button onClick={handleLoadMore} className="load-more-button">
                    Load More
                </button>
            </div>
        )}
      </div>
      {/* Loading messages */}
      {loading && displayedMovies.length > 0 && <div className="loading-more">Loading more movies...</div>}
      {loading && displayedMovies.length === 0 && <div className="loading">Loading...</div>}

    </div>
  );
}

export default Home;
