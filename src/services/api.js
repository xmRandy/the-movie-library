// services/api.js

// Use environment variable for the API key
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Ensure API_KEY is loaded, otherwise throw an error (important for production)
if (!API_KEY) {
  console.error("TMDB API Key is not defined. Please set VITE_TMDB_API_KEY in your .env file or environment variables.");
  // Depending on your app's needs, you might want to throw an error here
  // or handle this gracefully in the UI.
}

export const getPopularMovies = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`);
    if (!response.ok) {
      // Include more context in the error message for debugging
      const errorBody = await response.text(); // Get response body for more details
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody} for page ${page}`);
    }
    const data = await response.json();
    return data; // Returns { page, results, total_pages, total_results }
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw error;
  }
};

export const searchMovies = async (query) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching movies:", error);
    throw error;
  }
};

export const getMovieDetails = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,images,release_dates`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error fetching movie details for ID ${movieId}: HTTP status ${response.status}, Message: ${errorBody}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch movie details for ID ${movieId}:`, error);
    throw error;
  }
};

export const getSimilarMovies = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error fetching similar movies for ID ${movieId}: HTTP status ${response.status}, Message: ${errorBody}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Failed to fetch similar movies for ID ${movieId}:`, error);
    throw error;
  }
};

export const getMovieWatchProviders = async (movieId, region = 'US') => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/watch/providers?api_key=${API_KEY}`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error fetching watch providers for ID ${movieId}: HTTP status ${response.status}, Message: ${errorBody}`);
    }
    const data = await response.json();
    // TMDB watch providers API returns results nested under a 'results' object,
    // and then by region code (e.g., 'US', 'GB'). If a region isn't found,
    // data.results[region] might be undefined.
    return data.results ? data.results[region] : undefined;
  } catch (error) {
    console.error(`Failed to fetch watch providers for ID ${movieId}:`, error);
    throw error;
  }
};

// --- NEW FUNCTION: Fetch all movie genres ---
export const getMovieGenres = async () => {
  try {
    const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody}`);
    }
    const data = await response.json();
    return data.genres; // Returns an array of { id, name } objects
  } catch (error) {
    console.error("Error fetching movie genres:", error);
    throw error;
  }
};

// --- NEW FUNCTION: Discover movies by genre IDs ---
// Accepts an array of genre IDs and a page number
export const getMoviesByGenres = async (genreIds = [], page = 1) => {
  try {
    const genresParam = genreIds.length > 0 ? `&with_genres=${genreIds.join(',')}` : '';
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}${genresParam}`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody}`);
    }
    const data = await response.json();
    return data; // Returns { page, results, total_pages, total_results }
  } catch (error) {
    console.error("Error discovering movies by genres:", error);
    throw error;
  }
};
