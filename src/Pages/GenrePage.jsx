import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MovieCard from '../Components/MovieCard';
import { useGenreContext } from '../contexts/GenreContext';
import { getMoviesByGenres } from '../services/api';
import '../css/GenrePage.css';

// Constants
const MOVIES_PER_PAGE_API = 20;
const MAX_GENRE_MOVIES_TO_FETCH = 500;

function GenrePage() {
  const { id: paramGenreId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { genres, genresLoading, genresError } = useGenreContext();

  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [displayedMovies, setDisplayedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isInitialMount = useRef(true);

  // Effect to sync component state with URL parameters
  useEffect(() => {
    const idsFromParam = paramGenreId ? [parseInt(paramGenreId, 10)] : [];
    const idsFromQuery = searchParams.get('ids')?.split(',').map(Number) || [];
    const allIds = [...idsFromParam, ...idsFromQuery].filter(id => !isNaN(id));
    const uniqueSortedIds = Array.from(new Set(allIds)).sort((a, b) => a - b);

    setSelectedGenreIds(uniqueSortedIds);

    // Reset state for the new selection
    setDisplayedMovies([]);
    setCurrentPage(1);
    setTotalPages(1);
    setHasMore(true);
    setError(null);
    setLoading(true);
    isInitialMount.current = false;
  }, [paramGenreId, searchParams]);

  // Effect to fetch movie data based on selected genres and current page
  useEffect(() => {
    if (genresLoading) {
      setLoading(true);
      return;
    }

    if (selectedGenreIds.length === 0) {
      setLoading(false);
      if (isInitialMount.current) {
        setError("Please select one or more genres to see movies.");
      }
      setHasMore(false);
      return;
    }

    const fetchMovies = async () => {
      if (currentPage > totalPages || displayedMovies.length >= MAX_GENRE_MOVIES_TO_FETCH) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getMoviesByGenres(selectedGenreIds, currentPage);
        const newMovies = response.results;

        setDisplayedMovies(prevMovies => {
          const existingIds = new Set(prevMovies.map(m => m.id));
          const filteredNewMovies = newMovies.filter(m => !existingIds.has(m.id));
          return [...prevMovies, ...filteredNewMovies].slice(0, MAX_GENRE_MOVIES_TO_FETCH);
        });

        setTotalPages(response.total_pages);

        const moreAvailableFromApi = currentPage < response.total_pages;
        const underHardCap = (displayedMovies.length + newMovies.length) < MAX_GENRE_MOVIES_TO_FETCH;
        setHasMore(moreAvailableFromApi && underHardCap);

      } catch (err) {
        console.error("[GenrePage] Error fetching genre movies:", err);
        setError("Failed to load movies for the selected genres. Please try again.");
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenreIds, currentPage, genresLoading]);

  const handleGenreToggle = (genreId) => {
    const currentIds = new Set(selectedGenreIds);
    if (currentIds.has(genreId)) {
      currentIds.delete(genreId);
    } else {
      currentIds.add(genreId);
    }

    const newIds = Array.from(currentIds);
    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(',') });
    } else {
      setSearchParams({});
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const showNoResultsMessage = !loading && displayedMovies.length === 0 && selectedGenreIds.length > 0;
  const showLoadMoreButton = hasMore && !loading && displayedMovies.length > 0;

  return (
    <div className="genre-page">
      <h1 className="genre-page-title">Explore Genres</h1>

      {genresLoading && <div className="loading-genres">Loading genres...</div>}
      {genresError && <div className="error-genres">{genresError}</div>}

      {!genresLoading && !genresError && genres.length > 0 && (
        <div className="genre-filters">
          {genres.map(genre => (
            <button
              key={genre.id}
              className={`genre-filter-button ${selectedGenreIds.includes(genre.id) ? 'active' : ''}`}
              onClick={() => handleGenreToggle(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {loading && displayedMovies.length === 0 && <div className="loading">Loading movies...</div>}
      {error && <div className="error_message">{error}</div>}
      {showNoResultsMessage && (
        <div className="no-results">No movies found for the selected genre(s). Please try different genres.</div>
      )}

      <div className="movies-grid">
        {displayedMovies.map(movie => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>

      {loading && displayedMovies.length > 0 && <div className="loading-more">Loading more movies...</div>}

      {showLoadMoreButton && (
        <div className="load-more-container">
          <button onClick={handleLoadMore} className="load-more-button" disabled={loading}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default GenrePage;