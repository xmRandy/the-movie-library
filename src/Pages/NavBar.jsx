import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useGenreContext } from "../contexts/GenreContext";
import "../css/Navbar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faChevronDown, faChevronUp, faUserCircle } from '@fortawesome/free-solid-svg-icons';

function NavBar() {
    const { genres, genresLoading, genresError } = useGenreContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileGenreSubMenuOpen, setIsMobileGenreSubMenuOpen] = useState(false);

    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const handleMouseEnter = () => {
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        setIsDropdownOpen(false);
    };

    const toggleDesktopDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prevIsMobileMenuOpen => {
            if (prevIsMobileMenuOpen) {
                setIsMobileGenreSubMenuOpen(false);
            }
            return !prevIsMobileMenuOpen;
        });
    };

    const toggleMobileGenreSubMenu = () => {
        setIsMobileGenreSubMenuOpen(prev => !prev);
    };

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

    useEffect(() => {
        const handleClickOutsideMobileMenu = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && isMobileMenuOpen) {
                if (!event.target.closest('.hamburger-icon')) {
                    setIsMobileMenuOpen(false);
                    setIsMobileGenreSubMenuOpen(false);
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

            <div className="hamburger-icon" onClick={toggleMobileMenu}>
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </div>

            <div className="navbar-links desktop-nav-links">
                <Link to="/" className="nav-link"> Home </Link>
                <Link to="/favourites" className="nav-link"> Favourites </Link>
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
                <Link to="/account" className="nav-link">
                    <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '5px' }} />
                    Account
                </Link>
            </div>

            {isMobileMenuOpen && (
                <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
                    {/* --- NEW CLOSE ICON --- */}
                    <div className="mobile-menu-close-icon" onClick={toggleMobileMenu}>
                        <FontAwesomeIcon icon={faTimes} />
                    </div>
                    {/* --- END NEW CLOSE ICON --- */}

                    <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                    <Link to="/favourites" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Favourites</Link>

                    <div className="mobile-nav-genre-toggle">
                        <button onClick={toggleMobileGenreSubMenu}>
                            Genres <FontAwesomeIcon icon={isMobileGenreSubMenuOpen ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
                        </button>
                    </div>

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
                                            onClick={() => setIsMobileMenuOpen(false)}
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