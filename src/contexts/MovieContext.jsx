import { createContext, useState, useContext, useEffect, useRef } from "react"; 
// Firebase Imports for Context
import { auth, db } from '../firebase';
import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    collection,
    onSnapshot,
    writeBatch,
} from 'firebase/firestore';


const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
    const [favourites, setFavourites] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

    // useRef for session-based prompt dismissal
    const hasPromptBeenShownAndDismissedThisSession = useRef(
        sessionStorage.getItem('signInPromptDismissed') === 'true'
    );
    // END NEW / CORRECTED: useRef --->

    // --- Authentication State Listener ---
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            setIsFavoritesLoading(true);
            setShowSignInPrompt(false); // Hide prompt if auth state changes (e.g., user logs in/out)

            if (user) {
                console.log("[MovieContext] User logged in:", user.uid);
                // User is logged in. Handle favorites:
                const localFavsJSON = localStorage.getItem("favourites");
                if (localFavsJSON) {
                    const localFavs = JSON.parse(localFavsJSON);
                    if (localFavs.length > 0) {
                        console.log("[MovieContext] Migrating local favorites to Firestore...");
                        const batch = writeBatch(db);
                        const userFavoritesCollectionRef = collection(db, `users/${user.uid}/favorites`);
                        
                        for (const movie of localFavs) {
                            const favDocRef = doc(userFavoritesCollectionRef, String(movie.id));
                            const docSnap = await getDoc(favDocRef);
                            if (!docSnap.exists()) {
                                batch.set(favDocRef, movie);
                            }
                        }
                        await batch.commit();
                        console.log("[MovieContext] Local favorites migration complete. Clearing localStorage.");
                        localStorage.removeItem("favourites");
                    }
                }

                // Set up real-time listener to user's favorites in Firestore
                const userFavoritesCollectionRef = collection(db, `users/${user.uid}/favorites`);
                const unsubscribeFirestore = onSnapshot(userFavoritesCollectionRef, (snapshot) => {
                    const firestoreFavs = [];
                    snapshot.forEach((doc) => {
                        firestoreFavs.push(doc.data());
                    });
                    setFavourites(firestoreFavs);
                    setIsFavoritesLoading(false);
                    console.log("[MovieContext] Favorites synced from Firestore:", firestoreFavs.length, "movies.");
                }, (error) => {
                    console.error("[MovieContext] Error listening to Firestore favorites:", error);
                    setFavourites([]);
                    setIsFavoritesLoading(false);
                });

                return () => unsubscribeFirestore();
            } else {
                console.log("[MovieContext] User logged out or no user. Loading favorites from localStorage.");
                const localFavsJSON = localStorage.getItem("favourites");
                if (localFavsJSON) {
                    setFavourites(JSON.parse(localFavsJSON));
                } else {
                    setFavourites([]);
                }
                setIsFavoritesLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // --- Core Favorite Functions ---

    const addToFavourites = async (movie) => {
        if (currentUser) {
            try {
                const favDocRef = doc(db, `users/${currentUser.uid}/favorites`, String(movie.id));
                await setDoc(favDocRef, movie);
                console.log(`[MovieContext] Added movie ${movie.title} (${movie.id}) to Firestore favorites.`);
            } catch (error) {
                console.error("[MovieContext] Error adding favorite to Firestore:", error);
            }
        } else {
            setFavourites(prev => {
                if (!prev.some(favMovie => favMovie.id === movie.id)) {
                    const newFavs = [...prev, movie];
                    localStorage.setItem('favourites', JSON.stringify(newFavs));
                    console.log(`[MovieContext] Added movie ${movie.title} (${movie.id}) to localStorage favorites.`);
                    
                    // Conditional prompt display
                    if (!hasPromptBeenShownAndDismissedThisSession.current) {
                        setShowSignInPrompt(true);
                    }
                    
                    return newFavs;
                }
                return prev;
            });
        }
    };

    const removeFromFavourites = async (movieId) => {
        if (currentUser) {
            try {
                const favDocRef = doc(db, `users/${currentUser.uid}/favorites`, String(movieId));
                await deleteDoc(favDocRef);
                console.log(`[MovieContext] Removed movie ${movieId} from Firestore favorites.`);
            } catch (error) {
                console.error("[MovieContext] Error removing favorite from Firestore:", error);
            }
        } else {
            setFavourites(prev => {
                const newFavs = prev.filter(movie => movie.id !== movieId);
                localStorage.setItem('favourites', JSON.stringify(newFavs));
                console.log(`[MovieContext] Removed movie ${movieId} from localStorage favorites.`);
                return newFavs;
            });
        }
    };

    const isFavourite = (movieId) => {
        return favourites.some(movie => movie.id === movieId);
    };

    // Function to dismiss the sign-in prompt permanently for this session
    const dismissSignInPromptForSession = () => {
        setShowSignInPrompt(false);
        hasPromptBeenShownAndDismissedThisSession.current = true;
        sessionStorage.setItem('signInPromptDismissed', 'true'); // Persist for session
        console.log("[MovieContext] Sign-in prompt dismissed for this session.");
    };
   

    const value = {
        favourites,
        isFavoritesLoading,
        isFavourite,
        addToFavourites,
        removeFromFavourites,
        currentUser,
        showSignInPrompt,
        dismissSignInPromptForSession,
    };

    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    );
};