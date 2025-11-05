// Pages/GenrePage.jsx - Clean routing logic:
// - If all genres cleared → /genres (empty state)
// - First selection from empty → /genre/:id (navbar-like)
// - Multiple selections → /genres?ids=... (shareable)
// Also: dedup error vs empty-state and reliable fresh fetch.

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import MovieCard from "../Components/MovieCard";
import { useGenreContext } from "../contexts/GenreContext";
import { getMoviesByGenres } from "../services/api";
import "../css/GenrePage.css";

const MAX_GENRE_MOVIES_TO_FETCH = 500;

function GenrePage() {
  const { id: paramGenreId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { genres, genresLoading, genresError } = useGenreContext();

  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [displayedMovies, setDisplayedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // only for real failures
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isInitialMount = useRef(true);

  // --- Sync component state with URL ---
  useEffect(() => {
    // If ?ids exists, it overrides the route :id
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

    // Reset state for new selection source
    setDisplayedMovies([]);
    setTotalPages(1);
    setHasMore(true);
    setError(null);
    setLoading(true);
    isInitialMount.current = false;
  }, [paramGenreId, searchParams]);

  // --- Fetch movies fresh for any (non-empty) selection change ---
  useEffect(() => {
    if (genresLoading) {
      setLoading(true);
      return;
    }

    // Empty selection → show empty state (not an error)
    if (selectedGenreIds.length === 0) {
      setDisplayedMovies([]);
      setHasMore(false);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMovies = async () => {
      setLoading(true);
      try {
        // Always fetch page 1 fresh for the current selection
        const response = await getMoviesByGenres(selectedGenreIds, 1);
        const movies = response.results || [];

        if (movies.length === 0) {
          setDisplayedMovies([]);
          setHasMore(false);
          setError(null); // no results is not an error
        } else {
          setDisplayedMovies(movies.slice(0, MAX_GENRE_MOVIES_TO_FETCH));
          setTotalPages(response.total_pages || 1);
          setHasMore(response.page < (response.total_pages || 1));
          setError(null);
        }
      } catch (err) {
        console.error("[GenrePage] Error fetching movies:", err);
        setError("Failed to load movies for the selected genres. Please try again.");
        setDisplayedMovies([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenreIds, genresLoading]);

  // --- Handle Genre Toggle ---
  const handleGenreToggle = (genreId) => {
    const wasEmpty = selectedGenreIds.length === 0;

    const currentIds = new Set(selectedGenreIds);
    if (currentIds.has(genreId)) currentIds.delete(genreId);
    else currentIds.add(genreId);

    const newIds = Array.from(currentIds);

    // Case A: user cleared all → go to /genres (empty state)
    if (newIds.length === 0) {
      setSearchParams({}); // remove ids key
      navigate(`/genres`);
      return;
    }

    // Case B: user is selecting the first genre from empty → behave like navbar
    if (wasEmpty && newIds.length === 1) {
      const onlyId = newIds[0];
      setSearchParams({}); // no ids key → route param is source of truth
      navigate(`/genres/${onlyId}`);
      return;
    }

    // Case C: multi-select (or changing existing multi) → use shareable query
    setSearchParams({ ids: newIds.join(",") });
    navigate(`/genres?ids=${newIds.join(",")}`);
  };

  const showNoResultsMessage =
    !loading && !error && displayedMovies.length === 0 && selectedGenreIds.length > 0;

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

      {/* Mutually exclusive: show real error OR empty-state */}
      {error ? (
        <div className="error_message">{error}</div>
      ) : (
        showNoResultsMessage && (
          <div className="no-results">
            No movies found for the selected genre(s). Please try different genres.
          </div>
        )
      )}

      <div className="movies-grid">
        {displayedMovies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>

      {loading && displayedMovies.length > 0 && (
        <div className="loading-more">Loading more movies...</div>
      )}
    </div>
  );
}

export default GenrePage;
