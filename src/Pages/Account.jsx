// Pages/Account.jsx - Final Consolidated Version
import React, { useState, useEffect } from 'react';
import { useMovieContext } from '../contexts/MovieContext'; // Now gets more values from context
import MovieCard from '../Components/MovieCard';
import '../css/Account.css';

// Firebase Imports
// db is imported here because writeBatch, collection, query, getDocs, deleteDoc directly use it.
// auth and googleProvider are used in auth functions that might be local or passed down.
import { auth, googleProvider, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  // onAuthStateChanged is now in MovieContext, so removed from here
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';


// Helper function to generate a consistent placeholder avatar URL based on initials
const generatePlaceholderAvatar = (displayName, email) => {
  const initials = displayName ?
    displayName.split(' ').map(n => n[0]).join('').toUpperCase() :
    email ? email.charAt(0).toUpperCase() : 'ML';

  const colors = ['FF5733', '33FF57', '3357FF', 'FF33A1', 'A133FF', '33FFDD', 'FF8833', '8833FF', '33DDFF']; // More colors for variety
  const colorIndex = (initials.charCodeAt(0) + initials.charCodeAt(initials.length - 1)) % colors.length;
  const bgColor = colors[colorIndex];
  const textColor = 'FFFFFF';

  return `https://placehold.co/150x150/${bgColor}/${textColor}?text=${initials}`;
};


function Account() {
  // NEW: Get currentUser, showSignInPrompt, and closeSignInPrompt from context
  const { favourites, currentUser, showSignInPrompt, closeSignInPrompt } = useMovieContext();

  // --- Auth Form State Management (These are local to Account component for forms) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  // NEW: State for the confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // --- Auth Handlers (These use 'auth' directly, not 'currentUser' state) ---
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFeedbackMessage('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const generatedPhotoURL = generatePlaceholderAvatar(displayName, email);
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: generatedPhotoURL
      });

      console.log('User signed up with email:', userCredential.user.email); // Good for dev, consider removing for prod
      setEmail('');
      setPassword('');
      setDisplayName('');
      setFeedbackMessage('Account created successfully! You are now signed in.');
      // onAuthStateChanged in MovieContext will update currentUser state globally
    } catch (error) {
      console.error("Email signup error:", error.message);
      setAuthError(error.message);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFeedbackMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in with email:', auth.currentUser.email); // Good for dev, consider removing for prod
      // onAuthStateChanged in MovieContext will update currentUser state globally
    } catch (error) {
      console.error("Email sign-in error:", error.message);
      setAuthError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setFeedbackMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('User signed in with Google:', auth.currentUser.displayName); // Good for dev, consider removing for prod
      // onAuthStateChanged in MovieContext will update currentUser state globally
    } catch (error) {
      console.error("Google sign-in error:", error.message);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in popup was closed.');
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    setFeedbackMessage('');
    try {
      await signOut(auth);
      console.log('User signed out.'); // Good for dev, consider removing for prod
      setFeedbackMessage('You have been successfully signed out.');
      // onAuthStateChanged in MovieContext will update currentUser state globally to null
    } catch (error) {
      console.error("Sign out error:", error.message);
      setAuthError(error.message);
    }
  };

  // --- Delete Account Handler (Uses currentUser from context as the target user to delete) ---
  const handleDeleteAccount = async () => {
    if (!currentUser) { // Use currentUser from context
      setAuthError("No user is logged in to delete.");
      return;
    }

    // Show the custom confirmation modal instead of window.confirm
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAction = async () => {
    setShowDeleteConfirm(false); // Close the modal
    setAuthError('');
    setFeedbackMessage('Deleting account...');
    try {
      // 1. Delete user's data from Firestore (favorites in this case)
      // IMPORTANT: This assumes your Firestore security rules allow the user to delete their own favorites.
      // With test mode rules (allow read, write: if true;), this will work, but is insecure.
      // Once you implement proper rules, ensure:
      // match /users/{userId}/favorites/{documentId} { allow delete: if request.auth.uid == userId; }
      const favoritesCollectionRef = collection(db, `users/${currentUser.uid}/favorites`); // Use currentUser.uid
      const q = query(favoritesCollectionRef);
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((docToDelete) => {
        batch.delete(docToDelete.ref);
      });
      await batch.commit();
      console.log(`Successfully deleted ${querySnapshot.size} favorite movies from Firestore for user ${currentUser.uid}.`);

      // 2. Delete the user from Firebase Authentication
      // IMPORTANT: Firebase requires a recent re-authentication for security-sensitive operations like deleteUser.
      // If the user hasn't signed in recently, this will throw 'auth/requires-recent-login'.
      // The current error handling correctly advises re-signing in.
      await deleteUser(currentUser); // Use currentUser object from context
      console.log('User account deleted successfully!');
      setFeedbackMessage('Your account has been successfully deleted. You have been logged out.');
      // onAuthStateChanged in MovieContext will update currentUser state globally to null
    } catch (error) {
      console.error("Error deleting account:", error.message);
      if (error.code === 'auth/requires-recent-login') {
        setAuthError('Please sign in again recently to delete your account. (Sign out and sign back in, then try again).');
      } else {
        setAuthError(`Failed to delete account: ${error.message}`);
      }
      setFeedbackMessage('');
    }
  };

  const cancelDeleteAction = () => {
    setShowDeleteConfirm(false); // Close the modal
    setFeedbackMessage('Account deletion cancelled.');
    setAuthError('');
  };


  return (
    <div className="account-page">
      <h1 className="account-page-title">My Account</h1>

      {currentUser ? ( // Check currentUser from context
        // --- Logged In User View ---
        <section className="section-block profile-info-section">
          <h2 className="section-title">Profile Information</h2>
          <div className="profile-details">
            <img
                src={currentUser.photoURL || generatePlaceholderAvatar(currentUser.displayName, currentUser.email)}
                alt="User Avatar"
                className="profile-avatar"
                title="Your profile picture"
                style={{ cursor: 'default' }}
            />
            <div className="profile-text">
              <p><strong>Welcome,</strong> {currentUser.displayName || currentUser.email}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              {currentUser.metadata?.creationTime && (
                <p><strong>Member Since:</strong> {new Date(currentUser.metadata.creationTime).toLocaleDateString()}</p>
              )}
            </div>
            {/* Display general feedback message here related to profile info/logout */}
            {feedbackMessage && <p className="auth-feedback">{feedbackMessage}</p>}
            {authError && <p className="auth-error">{authError}</p>}

            {/* Sign Out Button */}
            <button onClick={handleSignOut} className="auth-button sign-out-button">Sign Out</button>
          </div>
        </section>
      ) : (
        // --- Auth Forms View (Not Logged In) ---
        <section className="section-block auth-section">
          <h2 className="section-title">{isRegistering ? "Create Account" : "Sign In"}</h2>
          {authError && <p className="auth-error">{authError}</p>}
          {feedbackMessage && <p className="auth-feedback">{feedbackMessage}</p>}

          <form onSubmit={isRegistering ? handleEmailSignUp : handleEmailSignIn} className="auth-form">
            {isRegistering && (
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="auth-input"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
            <button type="submit" className="auth-button">
              {isRegistering ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="auth-divider">
            <span className="divider-line"></span>
            <span className="divider-text">OR</span>
            <span className="divider-line"></span>
          </div>

          <button onClick={handleGoogleSignIn} className="auth-button google-auth-button">
            Sign In with Google
          </button>

          <p className="auth-toggle-text">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{' '}
            <span onClick={() => setIsRegistering(!isRegistering)} className="toggle-link">
              {isRegistering ? "Sign In" : "Sign Up"}
            </span>
          </p>
        </section>
      )}

      {/* My Favorites Section (Always display, but data depends on login status in context) */}
      <section className="section-block my-favorites-section">
        <h2 className="section-title">My Favorites ({favourites.length})</h2>
        {/* Sign-in prompt for guest users */}
        {showSignInPrompt && !currentUser && (
            <div className="sign-in-prompt">
              <p>Sign in to permanently save your favorites!</p>
              <button onClick={closeSignInPrompt} className="prompt-close-button">X</button>
            </div>
        )}
        {/* Check favorites loading state from context if needed: {isFavoritesLoading ? <p>Loading Favorites...</p> : ...} */}
        {favourites.length === 0 ? (
          <p className="no-movies-message">
            {currentUser ? "You haven't added any movies to your favorites yet. Start exploring and find some!" :
            "You haven't added any movies to your favorites. Your favorites will be saved here after you sign in."}
          </p>
        ) : (
          <div className="favorites-grid movies-grid">
            {favourites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* NEW: Delete Account Section (only visible if user is logged in) */}
      {currentUser && ( // Check currentUser from context
        <section className="section-block delete-account-section-wrapper">
          {/* Display authError and feedbackMessage relevant to delete action here if needed,
              or keep them above in the profile section as global messages for auth. */}
          {/* Currently, authError/feedbackMessage are also displayed in the profile section.
              You might want to make them specific to the delete section, or just global.
              For simplicity, I'll remove the local ones from here as they are global in profile. */}
          {/* authError and feedbackMessage will be displayed in the profile info section above,
              acting as general messages for the logged-in user's actions. */}
          <button onClick={handleDeleteAccount} className="auth-button delete-account-button">Delete Account</button>
        </section>
      )}

      {/* Custom Confirmation Modal for Delete Account */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Account Deletion</h3>
            <p>WARNING: Deleting your account is permanent. All your data, including favorites, will be lost. This cannot be undone. Are you absolutely sure?</p>
            <div className="modal-actions">
              <button onClick={confirmDeleteAction} className="auth-button confirm-delete-button">Yes, Delete My Account</button>
              <button onClick={cancelDeleteAction} className="auth-button cancel-delete-button">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;