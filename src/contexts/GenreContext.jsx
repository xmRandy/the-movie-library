// src/contexts/GenreContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMovieGenres } from '../services/api'; // Import the new API function

const GenreContext = createContext();

export const useGenreContext = () => useContext(GenreContext);

export const GenreProvider = ({ children }) => {
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState(null);

  useEffect(() => {
    const fetchGenres = async () => {
      setGenresLoading(true);
      setGenresError(null);
      try {
        const genreList = await getMovieGenres();
        setGenres(genreList);
        console.log("[GenreContext] Fetched genres:", genreList);
      } catch (err) {
        console.error("[GenreContext] Error fetching genres:", err);
        setGenresError("Failed to load genres.");
      } finally {
        setGenresLoading(false);
      }
    };
    fetchGenres();
  }, []); // Fetch genres only once on mount

  const value = {
    genres,
    genresLoading,
    genresError,
  };

  return (
    <GenreContext.Provider value={value}>
      {children}
    </GenreContext.Provider>
  );
};