// Components/MovieCard.jsx
import { Link } from 'react-router-dom'; 
import "../css/MovieCard.css"
import { useMovieContext } from "../contexts/MovieContext";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';


function MovieCard({movie}){
    const {isFavourite, addToFavourites, removeFromFavourites} = useMovieContext()
    const favourite = isFavourite(movie.id)

    function onFavouriteClick(e){
        e.preventDefault(); // Prevents the default button action (which might be form submission, though unlikely here)
        e.stopPropagation(); 
                             // It stops the click event from bubbling up to the parent <Link>
                             // ensuring only the heart button's action (add/remove favourite) is triggered.
        if (favourite) removeFromFavourites(movie.id)
        else addToFavourites(movie)
    }

    return (
        // Wrap the entire movie-card div with a Link
        <Link to={`/movie/${movie.id}`} className="movie-card-link"> {/* Added movie-card-link class */}
            <div className="movie-card">
                <div className="movie-poster">
                    <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                    <div className="movie-overlay">
                        <button
                            className={`favourite-btn ${favourite ? "active" : ""}`}
                            onClick={onFavouriteClick}
                        >
                            <FontAwesomeIcon icon={favourite ? solidHeart : regularHeart} />
                        </button>
                    </div>
                </div>
                <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <p>{movie.release_date?.split("-")[0]}</p>
                </div>
            </div>
        </Link>
    );
}
export default MovieCard;