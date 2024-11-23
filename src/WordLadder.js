import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import wordList from "./words.json"; // Adjust the path if needed
import {
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaMusic,
  FaBan,
  FaPlay,
  FaRedo,
  FaDoorOpen,
} from "react-icons/fa"; // Import icons
import wordgameImage from "../src/wordgame.png";
import backgroundMusic from "./bg1.mp3";
import letterMatchSFX from "./letterMatchedSFX.mp3";
import submitSFX from "./submitSFX.mp3";
import victorySFX from "./victoryMusic.mp3";
import lostSFX from "./lostSFX.mp3";
import errorSFX from "./error.mp3";
import { FaQuestion } from "react-icons/fa"; // Import icons for settings, about, and volume control

const validWords = new Set(wordList);

const isOneLetterDifferent = (word1, word2) => {
  let diffCount = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) diffCount++;
    if (diffCount > 1) return false;
  }
  return diffCount === 1;
};

const findShortestPath = (startWord, targetWord, wordList) => {
  const queue = [[startWord]];
  const visited = new Set([startWord]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentWord = path[path.length - 1];

    if (currentWord === targetWord) return path;

    for (const word of wordList) {
      if (isOneLetterDifferent(currentWord, word) && !visited.has(word)) {
        visited.add(word);
        queue.push([...path, word]);
      }
    }
  }
  return [];
};

const getRevealedTarget = (currentWord, targetWord) => {
  return targetWord
    .split("")
    .map((char, index) => (currentWord[index] === char ? char : " "))
    .join("");
};

const getRandomWord = (words) => {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

const WordLadder = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [startWord, setStartWord] = useState("play");
  const [targetWord, setTargetWord] = useState("slay");
  const [currentWord, setCurrentWord] = useState(startWord);
  const [inputWord, setInputWord] = useState("");
  const [hiddenWord, setHiddenWord] = useState("");
  const [steps, setSteps] = useState([startWord]);
  const [message, setMessage] = useState("");
  const [shortestPath, setShortestPath] = useState([]);
  const [userCompleted, setUserCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [score, setScore] = useState(0);
  const [timerId, setTimerId] = useState(null); // Timer ID
  const [isPaused, setIsPaused] = useState(false); // Modal visibility
  const [isMutedMusic, setIsMutedMusic] = useState(false); // Mute music state
  const [isMutedSFX, setIsMutedSFX] = useState(false); // Mute SFX state
  const audioRef = useRef(new Audio(backgroundMusic)); // Create audio instance
  const hasStartedMusic = useRef(false); // Flag to ensure music starts only once
  const submitSFXRef = useRef(new Audio(submitSFX));
  const letterMatchedSFXRef = useRef(new Audio(letterMatchSFX));
  const victorySFXRef = useRef(new Audio(victorySFX));
  const lostSFXRef = useRef(new Audio(lostSFX));
  const errorSFXRef = useRef(new Audio(errorSFX));
  const [showAboutCard, setShowAboutCard] = useState(false); // State for About card
  const [isGameover, setIsGameover] = useState(false);

  useEffect(() => {
    audioRef.current.loop = true;

    // Try to play audio immediately
    audioRef.current.play().catch((error) => {
      console.log("Autoplay blocked or failed:", error);
    });

    // Add a one-time event listener for user interaction if playback was blocked
    const handleUserInteraction = () => {
  audioRef.current
    .play()
    .then(() => console.log("Background music is playing"))
    .catch((error) => console.log("Audio playback failed:", error));
  window.removeEventListener("click", handleUserInteraction);
  window.removeEventListener("touchstart", handleUserInteraction);
};


    // Listen for user interactions to attempt playback again if initially blocked
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);

    return () => {
      // Clean up listeners on unmount
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  

  useEffect(() => {
    const path = findShortestPath(startWord, targetWord, wordList);
    setShortestPath(path);
  }, [startWord, targetWord]);


  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      audioRef.current.pause();
      lostSFXRef.current.currentTime = 0;
      lostSFXRef.current.play().then(() => console.log("Time's Up music is playing")).catch((error) => {
        console.log("Lost SFX playback failed:", error);
      });
      setTimeLeft(0); // Ensure it stops at zero
      setMessage("Time's up! Game over.");
      setUserCompleted(true);
      setIsGameover(true);

      clearInterval(timerId); // Clear interval to stop countdown
      return;
    }

    if (userCompleted || timeLeft <= 0) {
      clearInterval(timerId);
      return;
    }

    if (!isPaused) {
      const id = setInterval(() => {
        setTimeLeft((prevTime) => Math.max(prevTime - 1, 0)); // Prevent it from going below zero
      }, 1000);
      setTimerId(id);

      return () => clearInterval(id); // Clear interval on unmount or pause
    }
  }, [isPaused, timeLeft, userCompleted]);




  const handleQuit = () => {
    navigate("/"); // Navigate to home route
  };

  const handleChange = (e) => {
    setInputWord(e.target.value);
  };

  const calculateScore = (inputWord, targetWord) => {
    let points = 0;

    for (let i = 0; i < inputWord.length; i++) {
      if (inputWord[i] === targetWord[i]) {
        points++;
      }
    }

    if (inputWord === targetWord) {
      points += 10; // Adjust points as needed
    }

    return points;
  };

  const handleLetterMatchSFX = () => {
    letterMatchedSFXRef.current.currentTime = 0; // Reset playback to the start
    letterMatchedSFXRef.current.play().catch((error) => {
      console.log("Letter match audio playback failed:", error);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Validate word length
    if (inputWord.length !== startWord.length) {
      setMessage("Word must be the same length!");
      errorSFXRef.current.currentTime = 0;
      errorSFXRef.current.play().catch(console.error);
      return;
    }
  
    // Validate word existence
    if (!validWords.has(inputWord.toLowerCase())) {
      setMessage("Input must be a valid word!");
      errorSFXRef.current.currentTime = 0;
      errorSFXRef.current.play().catch(console.error);
      return;
    }
  
    // Validate one-letter difference
    if (!isOneLetterDifferent(currentWord, inputWord)) {
      setMessage("Only one letter can be changed at a time!");
      errorSFXRef.current.currentTime = 0;
      errorSFXRef.current.play().catch(console.error);
      return;
    }
  
    // Update current word and steps
    setSteps([...steps, inputWord]);
    setCurrentWord(inputWord);
    setMessage("");
  
    const newScore = calculateScore(inputWord, targetWord);
    setScore((prevScore) => prevScore + newScore);
  
    // Check if user matched a letter
    let hasMatchingLetter = false;
    for (let i = 0; i < inputWord.length; i++) {
      if (inputWord[i] === targetWord[i]) {
        hasMatchingLetter = true;
        break;
      }
    }
  
    if (hasMatchingLetter && !isMutedSFX) {
      handleLetterMatchSFX();
    } else {
      submitSFXRef.current.currentTime = 0;
      submitSFXRef.current.play().catch(console.error);
    }
  
    // Check for game completion
    if (inputWord === targetWord) {
      setMessage("Congratulations! You've completed the word ladder!");
      setUserCompleted(true); // Trigger winning modal
      clearInterval(timerId); // Stop the timer
      setIsPaused(true); // Prevent any further actions
      audioRef.current.pause(); // Stop music
      victorySFXRef.current.currentTime = 0;
      victorySFXRef.current.play().catch(console.error);
  
      // Calculate final solution path (if needed)
      const combinedWordList = [...new Set([...wordList, ...steps])];
      const userPath = findShortestPath(startWord, targetWord, combinedWordList);
      setShortestPath(userPath);
    }
  
    // Clear input field for the next attempt
    setInputWord("");
  };

  const handleAboutClick = () => {
    setShowAboutCard(true); // Show the About card overlay
  };

  const handleCloseAbout = () => {
    setShowAboutCard(false); // Close the About card overlay
  };

  const handlePause = () => {
    setIsPaused((prevState) => !prevState); // Toggle the pause state

    if (isPaused) {
      // Resume the timer and music if it's paused
      const id = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      setTimerId(id); // Store timer ID

      if (!isMutedMusic) {
        audioRef.current.play().catch((error) => {
          console.log("Audio playback failed:", error);
        });
      }
    } else {
      // Pause the timer and music if the game is paused
      clearInterval(timerId);
      audioRef.current.pause();
    }
  };

  const handleContinue = () => {
    setIsPaused(false); // Set pause state to false

    // Resume the timer
    const id = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    setTimerId(id); // Store the new timer ID

    // Resume the music if it's not muted
    if (!isMutedMusic) {
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
    }
  };

  const handleRetry = () => {
    setStartWord(getRandomWord(wordList));
    setTargetWord(getRandomWord(wordList));
    setCurrentWord(startWord);
    setInputWord("");
    setSteps([startWord]);
    setMessage("");
    setUserCompleted(false);
    setTimeLeft(300);
    setScore(0);
    setIsPaused(false);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMutedMusic; // Toggle mute
    }
    setIsMutedMusic((prev) => !prev);
  };

  const toggleSFX = () => {
    submitSFXRef.current.muted = !isMutedSFX;
    victorySFXRef.current.muted = !isMutedSFX;
    letterMatchedSFXRef.current.muted = !isMutedSFX;
    lostSFXRef.current.muted = !isMutedSFX;
    setIsMutedSFX((prev) => !prev);
  };

  return (
    <div className="container text-center">
      <div className="blur-container">
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
        <div className="circle circle4"></div>
        <div className="circle circle5"></div>
      </div>

      <audio ref={audioRef} src={backgroundMusic} loop autoPlay />
      <button onClick={handlePause} className="pause-button ">
        <FaPause />
      </button>

       {/* pause card */}
      {isPaused && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-white">Game Paused</h2>
            <div className="modal-icons">
              <button onClick={toggleMusic} className="icon-button text-white">
                {isMutedMusic ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <button onClick={toggleSFX} className="icon-button text-white">
                {isMutedSFX ? <FaBan /> : <FaMusic />}
              </button>
            </div>
            <button onClick={handleContinue} className="modal-button">
              <FaPlay /> Continue
            </button>
            <button
              onClick={() => window.location.reload()}
              className="modal-button"
            >
              <FaRedo /> Retry
            </button>
            <button onClick={handleQuit} className="modal-button">
              <FaDoorOpen /> Quit
            </button>
          </div>
        </div>
      )}

 {/* game over card */}
      {isGameover && (
        <div className="modal-gameover-overlay">
          <div className="modal-gameover-content">
            <h2 className="game-over-title">
              TIME'S UP
              <br />
              GAME OVER
            </h2>
            <p className="solution-title">SOLUTION</p>
            <p className="solution-path">
              {shortestPath.length > 0
                ? shortestPath.join(" -> ")
                : "No path found"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="modal-gameover-button left"
            >
              RETRY
            </button>
            <button
              onClick={handleQuit}
              className="modal-gameover-button right"
            >
              QUIT GAME
            </button>
          </div>
        </div>
      )}


 {/* victory card */}
{userCompleted && (
        <div className="modal-gameover-overlay">
          <div className="modal-gameover-content">
            <h2 className="game-over-title">
            Congratulations! 
              <br />
              You've completed the word ladder!
            </h2>
            <p className="solution-title">SOLUTION</p>
            <p className="solution-path">
              {shortestPath.length > 0
                ? shortestPath.join(" -> ")
                : "No path found"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="modal-gameover-button left"
            >
              PLAY AGAIN
            </button>
            <button
              onClick={handleQuit}
              className="modal-gameover-button right"
            >
              QUIT GAME
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAboutClick}
        className="btn_set_ab float-right  rounded-circle"
      >
        <FaQuestion className="fs-5 text-white" />
      </button>
      
      {/* Conditionally render the About card as an overlay */}
      {showAboutCard && (
        <div className="overlay">
          <div className="card-overlay">
            <div className="card-body text-white text-justify">
              <h5 className="fw-bold fs-4 mt-2 abt_game">About This Game</h5>

              {/* Objective Section */}
              <div className="mt-3">
                <h6 className="fw-bold fs-5">Objective:</h6>
                <p>
                  Transform the start word into the target word by changing one
                  letter at a time. Each intermediate step must be a valid word.
                </p>
              </div>

              {/* How to Play Section */}
              <div className="fmt-3">
                <h6 className="fw-bold fs-5">How to Play:</h6>
                <ul>
                  <li>
                    Enter a new word by changing exactly one letter of the
                    current word.
                  </li>
                  <li>
                    The new word must be a valid word (e.g., if the current word
                    is "bill", you could change it to "ball", "bell", or another
                    valid word).
                  </li>
                  <li>
                    Click Submit to check if your word is valid and move to the
                    next step.
                  </li>
                  <li>
                    Keep transforming the word until you reach the target word
                    or run out of time.
                  </li>
                </ul>
              </div>

              {/* Winning Section */}
              <div className="mt-3">
                <h6 className="fw-bold fs-5">Winning:</h6>
                <p className="fs-6 mb-1">
                  You win if you successfully transform the start word into the
                  target word before time runs out.
                </p>
              </div>

              {/* Tips Section */}
              <div className="mt-3">
                <h6 className="fw-bold fs-5">Tips:</h6>
                <ul>
                  <li>
                    Think of common words that are only one letter different
                    from the current word.
                  </li>
                  <li>
                    If you're stuck, try changing different letters until you
                    find a valid word.
                  </li>
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

      <img src={wordgameImage} className="image"></img>
      <div className="row align-items-start">
        <div className="col">
          <div className="target-container">
            <h6 className="start float-left text-white mx-4 "> Start Word </h6>
            <div className="mt-3 word-box float-left">
              <div className="start-box">?</div>
              <div className="start-box">?</div>
              <div className="start-box">?</div>
              <div className="start-box">?</div>
              <div className="word-box" style={{ position: "fixed" }}>
                {startWord.split("").map((letter, i) => (
                  <div key={i} className="start-box">
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="target-container">
            <h6 className="current-word float-left text-white mx-4 ">
              Current Word
            </h6>

            <div className="mt-3 word-box float-left">
              <div className="current-box">?</div>
              <div className="current-box">?</div>
              <div className="current-box">?</div>
              <div className="current-box">?</div>
              <div className="word-box" style={{ position: "fixed" }}>
                {currentWord.split("").map((letter, i) => (
                  <div key={i} className="current-box">
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="target-container">
            <h6 className="float-left time text-white mx-4">Time Left: </h6>
            <h5 className="float-left text-white seconds">
              {timeLeft} seconds
            </h5>
          </div>
        </div>
        <div className="col">
          <div className="target-container">
            <h6 className="target text-white ">Target Word</h6>
            <div className="mt-3  word-box">
              <div className="target-box"></div>
              <div className="target-box"></div>
              <div className="target-box"></div>
              <div className="target-box"></div>
              <div className="word-box" style={{ position: "fixed" }}>
                {getRevealedTarget(currentWord, targetWord)
                  .split("")
                  .map((letter, i) => (
                    <div key={i} className="target-box">
                      {letter}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="textfield  ">
            <input
              className="text-white"
              type="text"
              value={inputWord}
              onChange={handleChange}
              placeholder="Enter next word"
              id="single-line-border"
              disabled={userCompleted}
            />
            <br></br>
            <br></br>
            <button type="submit" className="enter text-white ">
              Enter
            </button>
          </form>
          <p style={{ color: "red" }}>{message}</p>
        </div>
        <div className="col">
          <div className="target-container">
            <h6 className="all float-right text-white mx-4">All Steps Taken</h6>
            <div
              className="steps-taken-list float-right mt-3"
              id="scrollable-container"
            >
              {steps.map((word, index) => (
                <div key={index} className="word-box">
                  {word.split("").map((letter, i) => (
                    <div key={i} className="letter-box">
                      {letter}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* Add a button or form to call handleAddWord with new words */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordLadder;
