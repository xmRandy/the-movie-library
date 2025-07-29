import "../css/Favourites.css"
import { useMovieContext } from "../contexts/MovieContext"
import MovieCard from "../Components/MovieCard"


function Favourites(){
    const {favourites} = useMovieContext()

    // Check if there are any favourite movies to display
    if (favourites && favourites.length > 0) {
        return (
            <div className="favourites">
                <h2>Your Favourites</h2>
                <div className="movies-grid">
                {favourites.map((movie) => (
                    <MovieCard movie={movie} key={movie.id}/>
                ))}
                </div>
            </div>
        );
    }

    // Display message when there are no favourite movies
    return (
        <div className="favourites-empty">
            <h2>No Favourite Movies Yet</h2>
            <p>Start adding movies to your favourites and they will appear here!</p>
        </div>
    );
}

export default Favourites;
