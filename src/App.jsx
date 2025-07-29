import { Routes, Route } from 'react-router-dom';
import './css/App.css';
import Home from './Pages/Home';
import Favourites from './Pages/Favourites';
import { MovieProvider, useMovieContext } from './contexts/MovieContext';
import { GenreProvider } from './contexts/GenreContext'; // <--- NEW: Import GenreProvider
import NavBar from './Pages/NavBar';
import Account from './Pages/Account';
import MovieDetails from './Pages/MovieDetails';
import SignInPromptModal from './Components/SignInPromptModal';
import GenrePage from './Pages/GenrePage';


// Define the main App component
function App() {
  const { showSignInPrompt } = useMovieContext(); // Get from MovieContext

  return (
    <div>
      <NavBar />
      <main className='Main-content'>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/favourites" element={<Favourites/>}/>
          <Route path="/account" element={<Account/>}/>
          <Route path="/movie/:id" element={<MovieDetails/>}/>
          <Route path="/genres" element={<GenrePage/>}/> {/* Base genre page */}
          <Route path="/genres/:id" element={<GenrePage/>}/> {/* Genre page with pre-selected ID */}
        </Routes>
      </main>
      {showSignInPrompt && <SignInPromptModal />}
    </div>
  );
}

// Create a wrapper component that provides the MovieContext AND GenreContext
function AppWrapper() {
  return (
    <MovieProvider>
      <GenreProvider> {/* <--- NEW: GenreProvider wraps the App component */}
        <App />
      </GenreProvider>
    </MovieProvider>
  );
}

export default AppWrapper;
