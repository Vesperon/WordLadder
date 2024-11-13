import React, { useState } from "react";
import WordLadder from "./WordLadder";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaQuestionCircle } from "react-icons/fa"; // Import icons for settings, about, and volume control
import wordgameImage from "../src/wordgame.png";

const MainMenu = () => {
  const [startGame, setStartGame] = useState(false);
  const [showAboutCard, setShowAboutCard] = useState(false); // State for About card

  const handlePlayButtonClick = () => {
    setStartGame(true);
  };

  const handleAboutClick = () => {
    setShowAboutCard(true); // Show the About card overlay
  };

  const handleCloseAbout = () => {
    setShowAboutCard(false); // Close the About card overlay
  };

  if (startGame) {
    return <WordLadder />;
  }

  return (
    <div className="main-menu-bg d-flex flex-column align-items-center justify-content-center vh-100">
      {/* Top-right buttons */}
      <div className="d-flex justify-content-end align-items-start ms-auto mb-5 mr-3">
  <button
    onClick={handleAboutClick}
    className="btn_set_ab rounded-circle mr-3"
  >
    <FaQuestionCircle className="fs-5" />
  </button>
</div>


      {/* Conditionally render the About card as an overlay */}
      {showAboutCard && (
        <div className="overlay">
          <div className="card-overlay">
            <div className="card-body text-white">
              <h5 className="fw-bold fs-4 mt-2 abt_game" >About This Game</h5>

              {/* Objective Section */}
              <div className="mt-3">
                <h6 className="fw-bold fs-5">Objective:</h6>
                <p>
                  Transform the start word into the target word by changing one letter at a time. Each intermediate step must be a valid word.
                </p>
              </div>

              {/* How to Play Section */}
              <div className="fmt-3">
                <h6 className="fw-bold fs-5">How to Play:</h6>
                <ul>
                  <li>Enter a new word by changing exactly one letter of the current word.</li>
                  <li>The new word must be a valid word (e.g., if the current word is "bill", you could change it to "ball", "bell", or another valid word).</li>
                  <li>Click Submit to check if your word is valid and move to the next step.</li>
                  <li>Keep transforming the word until you reach the target word or run out of time.</li>
                </ul>
              </div>

              {/* Winning Section */}
              <div className="mt-3">
                <h6 className="fw-bold fs-5">Winning:</h6>
                <p className="fs-6 mb-1">
                  You win if you successfully transform the start word into the target word before time runs out.
                </p>
              </div>

              {/* Tips Section */}
              <div className="mt-3">
                <h6 className="fw-bold fs-5">Tips:</h6>
                <ul>
                  <li>Think of common words that are only one letter different from the current word.</li>
                  <li>If you're stuck, try changing different letters until you find a valid word.</li>
                </ul>
              </div>

              <div className="center-button">
  <button onClick={handleCloseAbout} className="btn btn-danger">
    Close
  </button>
</div>

            </div>
          </div>
        </div>
      )}

      {/* Title */}
      
      <img src={wordgameImage} className="logo display-3 mb-5"></img>
    

      {/* Play Button */}
      <button
        onClick={handlePlayButtonClick}
        className="btn_play btn-lg px-4 py-3 mt-3 rounded-4 fw-bold text-white"
      >
        PLAY
      </button>

      {/* Background Blurry Circles */}
      <div>
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
        <div className="circle circle4"></div>
        <div className="circle circle5"></div>
        <div className="circle circle6"></div>
      </div>
    </div>
  );
};

export default MainMenu;
