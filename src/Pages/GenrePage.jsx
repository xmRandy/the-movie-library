// Pages/GenrePage.jsx 

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
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isInitialMount = useRef(true);

  // --- Sync component state with URL ---
  useEffect(() => {
    const hasIdsKey = searchParams.has("ids");
    const idsFromQuery =
      searchParams
        .get("ids")
        ?.split(",")
        .map(Number)
        .filter((n) => !isNaN(n)) || [];

    const idsFromParam = paramGenreId ? [parseInt(paramGenreId, 10)] : [];
    const sourceIds = hasIdsKey ? idsFromQuery : idsFromParam;
    const uniqueSortedIds = Array.from(new Set(sourceIds)).sort((a, b) => a - b);

    setSelectedGenreIds(uniqueSortedIds);
    setDisplayedMovies([]);
    setCurrentPage(1);
    setTotalPages(1);
    setHasMore(true);
    setError(null);
    setLoading(true);
    isInitialMount.current = false;
  }, [paramGenreId, searchParams]);

  // --- Fetch movies whenever selectedGenreIds or currentPage changes ---
  useEffect(() => {
    if (genresLoading) {
      setLoading(true);
      return;
    }

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
        const response = await getMoviesByGenres(selectedGenreIds, currentPage);
        const newMovies = response.results || [];

        if (currentPage === 1) {
          // fresh fetch
          setDisplayedMovies(newMovies);
        } else {
          // append for "Load More"
          setDisplayedMovies((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const filtered = newMovies.filter((m) => !ids.has(m.id));
            return [...prev, ...filtered].slice(0, MAX_GENRE_MOVIES_TO_FETCH);
          });
        }

        setTotalPages(response.total_pages || 1);
        setHasMore(currentPage < (response.total_pages || 1));
        setError(null);
      } catch (err) {
        console.error("[GenrePage] Error fetching movies:", err);
        setError("Failed to load movies for the selected genres. Please try again.");
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
    const wasEmpty = selectedGenreIds.length === 0;
    const currentIds = new Set(selectedGenreIds);

    if (currentIds.has(genreId)) currentIds.delete(genreId);
    else currentIds.add(genreId);

    const newIds = Array.from(currentIds);

    if (newIds.length === 0) {
      setSearchParams({});
      navigate(`/genres`);
      return;
    }

    if (wasEmpty && newIds.length === 1) {
      const onlyId = newIds[0];
      setSearchParams({});
      navigate(`/genres/${onlyId}`);
      return;
    }

    setSearchParams({ ids: newIds.join(",") });
    navigate(`/genres?ids=${newIds.join(",")}`);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage((p) => p + 1);
    }
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

      {hasMore && !loading && displayedMovies.length > 0 && (
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
