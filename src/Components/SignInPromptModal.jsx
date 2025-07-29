// Components/SignInPromptModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // To navigate to Account page
import { useMovieContext } from '../contexts/MovieContext'; // To access context values
import '../css/SignInPromptModal.css'; // This CSS file will be created next

function SignInPromptModal() {
  // Destructure the necessary function from the MovieContext
  const { dismissSignInPromptForSession } = useMovieContext();
  const navigate = useNavigate();

  // Handler for when the user chooses to sign in
  const handleSignInClick = () => {
    dismissSignInPromptForSession(); // Hide the modal and mark it as dismissed for this session
    navigate('/account'); // Redirect the user to the Account page for sign-in/sign-up
  };

  // Handler for when the user chooses to continue as a guest
  const handleContinueAsGuestClick = () => {
    dismissSignInPromptForSession(); // Hide the modal and mark it as dismissed for this session
    // No navigation is needed; the user remains on the current page
  };

  return (
    // The modal overlay covers the entire screen, making the background slightly dim
    <div className="modal-overlay">
      {/* The main content area of the modal */}
      <div className="modal-content">
        {/* Close button for the modal */}
        <button className="modal-close-button" onClick={dismissSignInPromptForSession}>&times;</button>
        
        {/* Modal title */}
        <h2 className="modal-title">Save Your Favorites!</h2>
        
        {/* Modal message explaining the benefit of signing in */}
        <p className="modal-message">
          Sign in to permanently save your favorite movies across devices. Otherwise, your liked movies will be lost if you close your browser or refresh the page.
        </p>
        
        {/* Container for the action buttons */}
        <div className="modal-actions">
          {/* Primary button to navigate to the sign-in page */}
          <button className="modal-button primary-button" onClick={handleSignInClick}>
            Sign In / Create Account
          </button>
          {/* Secondary button to dismiss the modal and continue as guest */}
          <button className="modal-button secondary-button" onClick={handleContinueAsGuestClick}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignInPromptModal;