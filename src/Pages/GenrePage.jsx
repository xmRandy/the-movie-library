// Pages/GenrePage.jsx 
import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import MovieCard from "../Components/MovieCard";
import { useGenreContext } from "../contexts/GenreContext";
import { getMoviesByGenres } from "../services/api";
import "../css/GenrePage.css";

// Constants
const MOVIES_PER_PAGE_API = 20;
const MAX_GENRE_MOVIES_TO_FETCH = 500;

function GenrePage() {
  const { id: paramGenreId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { genres, genresLoading, genresError } = useGenreContext();

  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [displayedMovies, setDisplayedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isInitialMount = useRef(true);

  // --- Sync component state with URL parameters ---
  useEffect(() => {
    // If ?ids exists, it overrides the route param
    const hasIdsKey = searchParams.has("ids");
    const idsFromQuery =
      searchParams
        .get("ids")
        ?.split(",")
        .map(Number)
        .filter((n) => !isNaN(n)) || [];

    const idsFromParam = paramGenreId ? [parseInt(paramGenreId, 10)] : [];

    // Choose source: query if present, else param
    const sourceIds = hasIdsKey ? idsFromQuery : idsFromParam;
    const uniqueSortedIds = Array.from(new Set(sourceIds)).sort((a, b) => a - b);

    setSelectedGenreIds(uniqueSortedIds);

    // Reset state for new selection
    setDisplayedMovies([]);
    setCurrentPage(1);
    setTotalPages(1);
    setHasMore(true);
    setError(null);
    setLoading(true);
    isInitialMount.current = false;
  }, [paramGenreId, searchParams]);

  // --- Fetch movies based on selected genres and current page ---
  useEffect(() => {
    if (genresLoading) {
      setLoading(true);
      return;
    }

    //  If no genres selected
    if (selectedGenreIds.length === 0) {
      setDisplayedMovies([]);
      setHasMore(false);
      setLoading(false);
      setError(null); // not an error, just empty
      return;
    }

    //  Reset pagination state for new selections
    if (currentPage !== 1) setCurrentPage(1);
    setHasMore(true);
    setError(null);

    const fetchMovies = async () => {
      if (
        currentPage > totalPages ||
        displayedMovies.length >= MAX_GENRE_MOVIES_TO_FETCH
      ) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await getMoviesByGenres(selectedGenreIds, currentPage);
        const newMovies = response.results || [];

        setDisplayedMovies((prevMovies) => {
          const existingIds = new Set(prevMovies.map((m) => m.id));
          const filteredNewMovies = newMovies.filter(
            (m) => !existingIds.has(m.id)
          );
          return [...filteredNewMovies].slice(0, MAX_GENRE_MOVIES_TO_FETCH);
        });

        setTotalPages(response.total_pages || 1);

        const moreAvailableFromApi = currentPage < (response.total_pages || 1);
        const underHardCap =
          displayedMovies.length + newMovies.length <
          MAX_GENRE_MOVIES_TO_FETCH;
        setHasMore(moreAvailableFromApi && underHardCap);
      } catch (err) {
        console.error("[GenrePage] Error fetching genre movies:", err);
        setError(
          "Failed to load movies for the selected genres. Please try again."
        );
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenreIds, currentPage, genresLoading]);

  // --- Handle Genre Toggle ---
  const handleGenreToggle = (genreId) => {
    const currentIds = new Set(selectedGenreIds);
    if (currentIds.has(genreId)) {
      currentIds.delete(genreId);
    } else {
      currentIds.add(genreId);
    }

    const newIds = Array.from(currentIds);

    //  Always write an 'ids' key so it overrides :id
    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(",") });
      //  Clean URL navigation
      navigate(`/genres?ids=${newIds.join(",")}`);
    } else {
      // Keep ?ids= even if empty → means ignore :id
      setSearchParams({ ids: "" });
      navigate(`/genres?ids=`);
    }
  };

  // --- Load More Movies ---
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  // --- UI Conditions ---
  const showNoResultsMessage =
    !loading && displayedMovies.length === 0 && selectedGenreIds.length > 0;
  const showLoadMoreButton =
    hasMore && !loading && displayedMovies.length > 0;

  // --- Render ---
  return (
    <div className="genre-page">
      <h1 className="genre-page-title">Explore Genres</h1>

      {genresLoading && <div className="loading-genres">Loading genres...</div>}
      {genresError && <div className="error-genres">{genresError}</div>}

      {!genresLoading && !genresError && genres.length > 0 && (
        <div className="genre-filters">
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`genre-filter-button ${
                selectedGenreIds.includes(genre.id) ? "active" : ""
              }`}
              onClick={() => handleGenreToggle(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {loading && displayedMovies.length === 0 && (
        <div className="loading">Loading movies...</div>
      )}
      {error && <div className="error_message">{error}</div>}
      {showNoResultsMessage && (
        <div className="no-results">
          No movies found for the selected genre(s). Please try different genres.
        </div>
      )}

      <div className="movies-grid">
        {displayedMovies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>

      {loading && displayedMovies.length > 0 && (
        <div className="loading-more">Loading more movies...</div>
      )}

      {showLoadMoreButton && (
        <div className="load-more-container">
          <button
            onClick={handleLoadMore}
            className="load-more-button"
            disabled={loading}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default GenrePage;
