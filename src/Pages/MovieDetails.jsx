// Pages/MovieDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovieDetails, getSimilarMovies, getMovieWatchProviders } from '../services/api'; // Import new getMovieWatchProviders
import MovieCard from '../Components/MovieCard';
import { useMovieContext } from '../contexts/MovieContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';
import '../css/MovieDetails.css';

// Define the number of items per initial row (approximate, depends on screen size)
const INITIAL_PHOTO_COUNT = 15; // Display approximately 3 rows of photos
const INITIAL_VIDEO_COUNT = 12; // Display approximately 3 rows of videos


function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [watchProviders, setWatchProviders] = useState(null); // NEW STATE for watch providers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const { isFavourite, addToFavourites, removeFromFavourites } = useMovieContext();
  const favourite = movie ? isFavourite(movie.id) : false;

  function onFavouriteClick(e) {
    e.preventDefault();
    if (movie) {
      if (favourite) removeFromFavourites(movie.id);
      else addToFavourites(movie);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      console.log(`[MovieDetails] useEffect triggered for movie ID: ${id}`);
      try {
        setLoading(true);
        setError(null);
        setShowAllImages(false);
        setShowAllVideos(false);

        const movieData = await getMovieDetails(id);
        console.log("[MovieDetails] Raw movieData received from API:", movieData);

        if (!movieData || Object.keys(movieData).length === 0 || movieData.success === false) {
            console.warn("[MovieDetails] movieData is empty, invalid, or API returned an error:", movieData);
            setError(movieData.status_message || "No movie data found for this ID or API error.");
            setMovie(null);
            setSimilarMovies([]);
            setWatchProviders(null); // Clear watch providers on error
            return;
        }
        setMovie(movieData);

        const similarData = await getSimilarMovies(id);
        console.log("[MovieDetails] Raw similarData received from API:", similarData);

        if (!Array.isArray(similarData)) {
            console.warn("[MovieDetails] Similar data is not an array. Skipping similar movies section.");
            setSimilarMovies([]);
        } else {
            const filteredSimilar = similarData.filter(m => m.poster_path && !m.adult);
            console.log("[MovieDetails] Filtered similar movies for display:", filteredSimilar);
            setSimilarMovies(filteredSimilar);
        }

        // NEW: Fetch watch providers
        const providersData = await getMovieWatchProviders(id, 'US'); // Fetch for US region
        console.log("[MovieDetails] Raw watchProvidersData received from API:", providersData);
        setWatchProviders(providersData);


      } catch (err) {
        console.error("[MovieDetails] Caught error during data fetch:", err);
        if (err instanceof TypeError) {
            console.error("[MovieDetails] Network error or CORS issue. Check your API key and internet connection.");
        } else if (err.message.includes('HTTP status')) {
            console.error(`[MovieDetails] API responded with a non-OK status: ${err.message}`);
        }
        setError("Failed to load movie details. Please try again later.");
        setMovie(null);
        setSimilarMovies([]);
        setWatchProviders(null); // Clear watch providers on error
      } finally {
        setLoading(false);
        console.log("[MovieDetails] Loading process finished.");
      }
    };

    fetchData();
  }, [id]);

  // --- Helper Functions (No changes here, copied for completeness) ---
  const getOfficialTrailer = (videos) => {
    return videos?.results.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube' && video.official
    );
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getCertification = (releaseDates) => {
    const usRelease = releaseDates?.results.find(
      (release) => release.iso_3166_1 === 'US'
    );
    const certification = usRelease?.release_dates.find(
      (date) => date.certification !== ''
    )?.certification;
    return certification || 'N/A';
  };

  const getFormattedReleaseDate = (releaseDates, fallbackDate) => {
    const usRelease = releaseDates?.results.find(
      (release) => release.iso_3166_1 === 'US'
    );
    const primaryDate = usRelease?.release_dates[0]?.release_date;
    if (primaryDate) {
      return new Date(primaryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return fallbackDate || 'N/A';
  };

  // --- Conditional Rendering for Loading, Error, Not Found ---
  if (loading) {
    console.log("[MovieDetails] Rendering: Loading state display...");
    return <div className="movie-details-loading">Loading movie details...</div>;
  }

  if (error) {
    console.log("[MovieDetails] Rendering: Error state display. Error message:", error);
    return <div className="movie-details-error">{error}</div>;
  }

  if (!movie) {
    console.log("[MovieDetails] Rendering: Movie not found state (movie object is null after loading).");
    return <div className="movie-details-not-found">Movie not found.</div>;
  }

  // --- Destructure movie data for easier access ---
  const {
    title,
    release_date,
    vote_average,
    vote_count,
    poster_path,
    backdrop_path,
    genres,
    overview,
    runtime,
    videos,
    credits,
    images,
    release_dates,
    homepage,
    production_countries,
    spoken_languages,
    alternative_titles,
    production_companies,
  } = movie;

  const officialTrailer = getOfficialTrailer(videos);
  const formattedRuntime = formatRuntime(runtime);
  const certification = getCertification(release_dates);
  const formattedReleaseDate = getFormattedReleaseDate(release_dates, release_date);

  const directors = credits?.crew.filter(c => c.job === 'Director');
  const writers = credits?.crew.filter(c => ['Writer', 'Screenplay', 'Story'].includes(c.job));
  const castToShow = credits?.cast ? credits.cast.slice(0, 20) : [];

  const allAvailableImages = [
    ...(images?.backdrops || []),
    ...(images?.posters || [])
  ].filter((img, index, self) =>
    index === self.findIndex((t) => (
      t.file_path === img.file_path
    ))
  );
  const imagesToDisplay = showAllImages ? allAvailableImages : allAvailableImages.slice(0, INITIAL_PHOTO_COUNT);


  const allAvailableVideos = videos?.results.filter(video =>
    video.site === 'YouTube' && video.key !== officialTrailer?.key
  ) || [];
  const videosToDisplay = showAllVideos ? allAvailableVideos : allAvailableVideos.slice(0, INITIAL_VIDEO_COUNT);

  const stars = credits?.cast.filter(c => c.order < 5);


  return (
    <div className="movie-details-page">
      {/* Movie Header with Backdrop and Poster */}
      <div className="movie-header-backdrop" style={{
        backgroundImage: backdrop_path ? `url(https://image.tmdb.org/t/p/original${backdrop_path})` : 'none'
      }}>
        <div className="backdrop-overlay"></div>
        <div className="movie-header-content">
          <img
            src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : '/placeholder-poster.png'}
            alt={title}
            className="movie-poster-large"
          />
          <div className="movie-info-header">
            <div className="title-and-favorite">
                <h1>{title}</h1>
                {/* FAVORITE BADGE AT THE TOP */}
                <button
                    className={`favourite-btn-details ${favourite ? "active" : ""}`}
                    onClick={onFavouriteClick}
                    title={favourite ? "Remove from favorites" : "Add to favorites"}
                >
                    <FontAwesomeIcon icon={favourite ? solidHeart : regularHeart} />
                </button>
            </div>

            <div className="subtitle-info">
              <span>{release_date ? release_date.split('-')[0] : 'N/A'}</span>
              <span>{certification}</span>
              <span>{formattedRuntime}</span>
            </div>
            <div className="rating-info">
              <span className="star-icon">⭐</span>
              <span className="score">
                {vote_average ? vote_average.toFixed(1) : 'N/A'}/10
              </span>
              <span className="vote-count">({vote_count ? (vote_count / 1000).toFixed(0) + 'K' : 'N/A'} votes)</span>
            </div>
            <div className="genres">
              {genres && genres.map((genre) => (
                <Link to={`/genres/${genre.id}`} key={genre.id} className="genre-tag">
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="movie-body-content">
        {/* Storyline */}
        <section className="section-block">
          <h2 className="section-title">Storyline</h2>
          <p className="storyline-text">{overview || 'No storyline available.'}</p>
        </section>

        {/* Trailer Section */}
        {officialTrailer && (
          <section className="section-block trailer-section">
            <h2 className="section-title">Trailer</h2>
            <div className="video-player-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${officialTrailer.key}`} // Correct YouTube embed URL
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={officialTrailer.name}
              ></iframe>
            </div>
          </section>
        )}

        {/* NEW: Where to Watch Section */}
        {watchProviders && (
          <section className="section-block where-to-watch-section">
            <h2 className="section-title">Where to Watch</h2>
            {watchProviders.link && (
                <p className="watch-provider-link-text">
                    Find all options at <a href={watchProviders.link} target="_blank" rel="noopener noreferrer">TMDB</a>
                </p>
            )}
            {watchProviders.flatrate?.length > 0 && (
              <div className="provider-category">
                <h3>Stream</h3>
                <div className="provider-list">
                  {watchProviders.flatrate.map((provider) => (
                    <div key={provider.provider_id} className="provider-item">
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="provider-logo"
                      />
                      <span>{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {watchProviders.rent?.length > 0 && (
              <div className="provider-category">
                <h3>Rent</h3>
                <div className="provider-list">
                  {watchProviders.rent.map((provider) => (
                    <div key={provider.provider_id} className="provider-item">
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="provider-logo"
                      />
                      <span>{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {watchProviders.buy?.length > 0 && (
              <div className="provider-category">
                <h3>Buy</h3>
                <div className="provider-list">
                  {watchProviders.buy.map((provider) => (
                    <div key={provider.provider_id} className="provider-item">
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="provider-logo"
                      />
                      <span>{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!watchProviders.flatrate?.length && !watchProviders.rent?.length && !watchProviders.buy?.length && (
                <p>No streaming, rent, or buy options available in US.</p>
            )}
          </section>
        )}


        {/* Details Section */}
        <section className="section-block">
          <h2 className="section-title">Details</h2>
          <ul className="details-list">
            <li>
              <strong>Release Date:</strong> {formattedReleaseDate}
            </li>
            <li>
              <strong>Countries of Origin:</strong>{' '}
              {production_countries?.map((country) => country.name).join(', ') || 'N/A'}
            </li>
            {homepage && (
              <li>
                <strong>Official Site:</strong>{' '}
                <a href={homepage} target="_blank" rel="noopener noreferrer">
                  {homepage}
                </a>
              </li>
            )}
            <li>
              <strong>Language:</strong>{' '}
              {spoken_languages?.[0]?.english_name || movie.original_language || 'N/A'}
            </li>
            <li>
              <strong>Also Known As:</strong>{' '}
              {alternative_titles?.titles?.map((t) => t.title).join(', ') || 'N/A'}
            </li>
            <li>
              <strong>Production Companies:</strong>{' '}
              {production_companies?.map((company) => company.name).join(', ') || 'N/A'}
            </li>
          </ul>
        </section>

        {/* Expanded Cast & Crew Section */}
        {credits && (
          <section className="section-block">
            <h2 className="section-title">Cast & Crew</h2>
            <ul className="details-list cast-crew-overview">
                <li>
                    <strong>Director:</strong>{' '}
                    {directors?.map((d) => d.name).join(', ') || 'N/A'}
                </li>
                <li>
                    <strong>Writers:</strong>{' '}
                    {writers?.map((w) => w.name).join(', ') || 'N/A'}
                </li>
                 <li>
                    <strong>Stars:</strong>{' '}
                    {stars?.map((actor) => actor.name).join(', ') || 'N/A'}
                  </li>
            </ul>

            {castToShow.length > 0 && (
                <div className="cast-grid">
                  {castToShow.map((person) => (
                    <div key={person.id} className="cast-item">
                      <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : '/placeholder-person.png'}
                        alt={person.name}
                        className="cast-photo"
                      />
                      <div className="cast-info">
                        <span className="cast-name">{person.name}</span>
                        <span className="cast-character">{person.character}</span>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </section>
        )}

        {/* Photos Section */}
        {allAvailableImages.length > 0 && (
          <section className="section-block">
            <h2 className="section-title">Photos ({allAvailableImages.length})</h2>
            <div className="image-gallery limited-photos-grid">
              {imagesToDisplay.map((image, index) => (
                <img
                  key={image.file_path || index}
                  src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                  alt={`${title} still ${index + 1}`}
                  className="gallery-image"
                />
              ))}
            </div>
            {allAvailableImages.length > INITIAL_PHOTO_COUNT && !showAllImages && (
              <div className="view-more-container">
                <button className="view-more-button" onClick={() => setShowAllImages(true)}>
                  View All {allAvailableImages.length - INITIAL_PHOTO_COUNT} Photos
                </button>
              </div>
            )}
             {allAvailableImages.length > INITIAL_PHOTO_COUNT && showAllImages && (
              <div className="view-more-container">
                <button className="view-more-button" onClick={() => setShowAllImages(false)}>
                  Show Less
                </button>
              </div>
            )}
          </section>
        )}

        {/* Videos Section */}
        {allAvailableVideos.length > 0 && (
          <section className="section-block">
            <h2 className="section-title">Videos ({allAvailableVideos.length})</h2>
            <div className="other-videos-grid limited-videos-grid">
              {videosToDisplay.map((video) => (
                <div key={video.key} className="video-thumbnail-wrapper">
                  <a href={`https://www.youtube.com/watch?v=${video.key}`} target="_blank" rel="noopener noreferrer"> {/* Correct YouTube watch URL */}
                    <img
                      src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`} // Correct YouTube thumbnail URL
                      alt={video.name}
                      className="video-thumbnail"
                    />
                    <div className="video-thumbnail-overlay">
                        <span className="play-icon">▶</span>
                        <span className="video-name">{video.name}</span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
            {allAvailableVideos.length > INITIAL_VIDEO_COUNT && !showAllVideos && (
              <div className="view-more-container">
                <button className="view-more-button" onClick={() => setShowAllVideos(true)}>
                  View All {allAvailableVideos.length - INITIAL_VIDEO_COUNT} Videos
                </button>
              </div>
            )}
             {allAvailableVideos.length > INITIAL_VIDEO_COUNT && showAllVideos && (
              <div className="view-more-container">
                <button className="view-more-button" onClick={() => setShowAllVideos(false)}>
                  Show Less
                </button>
              </div>
            )}
          </section>
        )}

        {/* Similar Movies Section */}
        {similarMovies.length > 0 && (
          <section className="section-block similar-movies-section">
            <h2 className="section-title">Similar Movies</h2>
            <div className="similar-movies-grid movies-grid">
              {similarMovies.map((similarMovie) => (
                <MovieCard key={similarMovie.id} movie={similarMovie} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MovieDetails;