import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useGenreContext } from "../contexts/GenreContext";
import "../css/Navbar.css";

// Import FontAwesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faChevronDown, faChevronUp, faUserCircle } from '@fortawesome/free-solid-svg-icons';


function NavBar() {
    const { genres, genresLoading, genresError } = useGenreContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for desktop Genres dropdown
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NEW: State for mobile hamburger menu
    const [isMobileGenreSubMenuOpen, setIsMobileGenreSubMenuOpen] = useState(false); // NEW: State for mobile Genres sub-menu

    const dropdownRef = useRef(null); // Ref for desktop Genres dropdown container
    const mobileMenuRef = useRef(null); // NEW: Ref for mobile menu container

    // Handlers for desktop Genres dropdown (hover and click)
    const handleMouseEnter = () => {
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        setIsDropdownOpen(false);
    };

    const toggleDesktopDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    // NEW: Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prevIsMobileMenuOpen => {
            // If the menu is about to be closed (prevIsMobileMenuOpen is true)
            if (prevIsMobileMenuOpen) {
                setIsMobileGenreSubMenuOpen(false); // Close genre sub-menu
            }
            return !prevIsMobileMenuOpen; // Return the new state for isMobileMenuOpen
        });
    };

    // NEW: Toggle mobile genre sub-menu
    const toggleMobileGenreSubMenu = () => {
        setIsMobileGenreSubMenuOpen(prev => !prev);
    };

    // Close desktop dropdown if clicked outside
    useEffect(() => {
        const handleClickOutsideDesktopDropdown = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutsideDesktopDropdown);
        } else {
            document.removeEventListener("mousedown", handleClickOutsideDesktopDropdown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDesktopDropdown);
        };
    }, [isDropdownOpen]);

    // NEW: Close mobile menu if clicked outside
    useEffect(() => {
        const handleClickOutsideMobileMenu = (event) => {
            // Ensure the click is outside the mobile menu itself AND not on the hamburger icon
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && isMobileMenuOpen) {
                // Check if the click was on the hamburger icon itself, if so, don't close
                if (!event.target.closest('.hamburger-icon')) {
                    setIsMobileMenuOpen(false);
                    setIsMobileGenreSubMenuOpen(false); // Also close genre sub-menu
                }
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutsideMobileMenu);
        } else {
            document.removeEventListener("mousedown", handleClickOutsideMobileMenu);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideMobileMenu);
        };
    }, [isMobileMenuOpen]);


    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Movie Library</Link>
            </div>

            {/* Hamburger Icon for Mobile */}
            <div className="hamburger-icon" onClick={toggleMobileMenu}>
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </div>

            {/* Desktop Navigation Links */}
            <div className="navbar-links desktop-nav-links">
                <Link to="/" className="nav-link"> Home </Link>
                <Link to="/favourites" className="nav-link"> Favourites </Link>

                {/* Genres Dropdown Container (Desktop) */}
                <div
                    className="nav-dropdown"
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button className="nav-link nav-dropdown-toggle" onClick={toggleDesktopDropdown}>
                        Genres <FontAwesomeIcon icon={isDropdownOpen ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
                    </button>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            {genresLoading && <div className="dropdown-loading">Loading genres...</div>}
                            {genresError && <div className="dropdown-error">Error loading genres.</div>}
                            {!genresLoading && !genresError && genres.length === 0 && (
                                <div className="dropdown-empty">No genres found.</div>
                            )}
                            {!genresLoading && !genresError && genres.length > 0 && (
                                <div className="genres-grid">
                                    {genres.map(genre => (
                                        <Link
                                            key={genre.id}
                                            to={`/genres/${genre.id}`}
                                            className="dropdown-item"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Account Link (Desktop) */}
                <Link to="/account" className="nav-link">
                    <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '5px' }} />
                    Account
                </Link>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
                    <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                    <Link to="/favourites" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Favourites</Link>

                    {/* Genres section in mobile menu */}
                    <div className="mobile-nav-genre-toggle">
                        <button onClick={toggleMobileGenreSubMenu}>
                            Genres <FontAwesomeIcon icon={isMobileGenreSubMenuOpen ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
                        </button>
                    </div>

                    {/* FIX: Added dynamic 'open' class to mobile-genre-sub-menu */}
                    {isMobileGenreSubMenuOpen && (
                        <div className={`mobile-genre-sub-menu ${isMobileGenreSubMenuOpen ? 'open' : ''}`}>
                            {genresLoading && <div className="mobile-dropdown-loading">Loading genres...</div>}
                            {genresError && <div className="mobile-dropdown-error">Error loading genres.</div>}
                            {!genresLoading && !genresError && genres.length === 0 && (
                                <div className="mobile-dropdown-empty">No genres found.</div>
                            )}
                            {!genresLoading && !genresError && genres.length > 0 && (
                                <div className="mobile-genres-list">
                                    {genres.map(genre => (
                                        <Link
                                            key={genre.id}
                                            to={`/genres/${genre.id}`}
                                            className="mobile-dropdown-item"
                                            onClick={() => setIsMobileMenuOpen(false)} // Close both menus on genre click
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <Link to="/account" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                        <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '5px' }} />
                        Account
                    </Link>
                </div>
            )}
        </nav>
    );
}

export default NavBar;
