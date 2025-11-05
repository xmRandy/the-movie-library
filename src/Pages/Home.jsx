// Pages/Home.jsx - Incremental Display for Faster First Paint

import MovieCard from "../Components/MovieCard";
import { useState, useEffect } from "react";
import { searchMovies, getPopularMovies } from "../services/api";
import "../css/Home.css";

// --- Constants ---
const MOVIES_PER_PAGE_API = 20; // TMDB returns 20 movies per page by default
const MAX_POPULAR_MOVIES_TO_FETCH = 500; // Total popular movies to fetch in background
const INITIAL_MOVIES_TO_DISPLAY = 34; // Movies shown on first load
const MOVIES_TO_ADD_ON_LOAD_MORE = 21; // Movies added with each "Load More" click

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPopularMovies, setAllPopularMovies] = useState([]); // Stores all fetched popular movies
  const [displayedMovies, setDisplayedMovies] = useState([]); // Movies currently visible on screen
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false); // Flag for search mode

  // --- Initial Load Effect (Fetch popular movies incrementally) ---
  useEffect(() => {
    const fetchPopularMoviesIncrementally = async () => {
      setLoading(true);
      setError(null);
      setIsSearching(false); // Ensure we're in popular mode initially

      let fetchedMovies = [];
      let currentPage = 1;
      let totalPages = 1;

      try {
        // --- Loop through multiple pages incrementally ---
        while (
          fetchedMovies.length < MAX_POPULAR_MOVIES_TO_FETCH &&
          currentPage <= totalPages
        ) {
          const response = await getPopularMovies(currentPage); // getPopularMovies returns { results, page, total_pages }
          fetchedMovies = [...fetchedMovies, ...response.results];
          totalPages = response.total_pages;

          // --- ✅ Display as soon as the first page loads ---
          if (currentPage === 1) {
            // Immediately show the first visible batch
            const initialBatch = fetchedMovies.slice(0, INITIAL_MOVIES_TO_DISPLAY);
            setAllPopularMovies(fetchedMovies);
            setDisplayedMovies(initialBatch);
            setLoading(false); // Stop loading spinner once we have content
            console.log(`[Home] Displaying first ${initialBatch.length} movies immediately.`);
          } else {
            // --- Update background movies silently for later load ---
            setAllPopularMovies([...fetchedMovies]);
            console.log(`[Home] Background loaded page ${currentPage}, total so far: ${fetchedMovies.length}`);
          }

          // --- Prepare next page ---
          currentPage++;

          // Optional: Small delay for smoother background fetching
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // --- Final cleanup ---
        setAllPopularMovies((prev) => prev.slice(0, MAX_POPULAR_MOVIES_TO_FETCH));
        console.log(`[Home] Finished fetching ${fetchedMovies.length} movies total.`);

      } catch (err) {
        console.error("[Home] Failed to load popular movies:", err);
        setError("Failed to load popular movies. Please try again.");
        setLoading(false);
      }
    };

    // --- Run fetch only when not searching ---
    if (!isSearching) {
      fetchPopularMoviesIncrementally();
    }
  }, [isSearching]); // Dependency ensures re-run when leaving search mode


  // --- Load More Handler (Client-side pagination) ---
  const handleLoadMore = () => {
    if (loading) return; // Prevent multiple triggers while fetching

    // Calculate next batch end index
    const nextEndIndex = displayedMovies.length + MOVIES_TO_ADD_ON_LOAD_MORE;

    // Slice the pre-fetched array
    const nextBatch = allPopularMovies.slice(0, nextEndIndex);

    // Update displayed movies
    setDisplayedMovies(nextBatch);
    console.log(`[Home] Loaded ${nextBatch.length - displayedMovies.length} more movies. Now displaying ${nextBatch.length}.`);
  };


  // --- Search Handler (resets to display search results) ---
  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();

    // --- Empty query resets to popular mode ---
    if (!trimmedQuery) {
      setIsSearching(false); // Exit search mode and trigger popular fetch
      setSearchQuery("");
      return;
    }
    if (loading) return; // Prevent multiple searches at once

    setLoading(true);
    setError(null);
    setIsSearching(true); // Indicate we are in search mode

    try {
      // searchMovies returns data.results directly
      const searchResults = await searchMovies(trimmedQuery);
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
    !isSearching && 
    displayedMovies.length < allPopularMovies.length;


  // --- Render ---
  return (
    <div className="home">
      {/* Search Bar */}
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

      {/* Error Message */}
      {error && <div className="error_message">{error}</div>}

      {/* Movie Grid */}
      <div className="movies-grid">
        {displayedMovies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}

        {/* Load More Button */}
        {shouldShowLoadMore && (
          <div className="load-more-card">
            <button onClick={handleLoadMore} className="load-more-button">
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Loading Messages */}
      {loading && displayedMovies.length > 0 && (
        <div className="loading-more">Loading more movies in background...</div>
      )}
      {loading && displayedMovies.length === 0 && (
        <div className="loading">Loading...</div>
      )}
    </div>
  );
}

export default Home;
