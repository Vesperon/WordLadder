import React, { useState, useEffect, useRef } from "react";
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
  const [startWord, setStartWord] = useState(getRandomWord(wordList));
  const [targetWord, setTargetWord] = useState(getRandomWord(wordList));
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

  useEffect(() => {
    audioRef.current.loop = true;

    // Try to play audio immediately
    audioRef.current.play().catch((error) => {
      console.log("Autoplay blocked or failed:", error);
    });

    // Add a one-time event listener for user interaction if playback was blocked
    const handleUserInteraction = () => {
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed on interaction:", error);
      });
      window.removeEventListener("click", handleUserInteraction); // Remove listener after first interaction
      window.removeEventListener("touchstart", handleUserInteraction); // Remove for touch events as well
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
      lostSFXRef.current.play().catch((error) => {
        console.log("Lost SFX playback failed:", error);
      });
      setTimeLeft(0); // Ensure it stops at zero
      setMessage("Time's up! Game over.");
      setUserCompleted(true);

      clearInterval(timerId); // Clear interval to stop countdown
      return;
    }

    if (!isPaused) {
      const id = setInterval(() => {
        setTimeLeft((prevTime) => Math.max(prevTime - 1, 0)); // Prevent it from going below zero
      }, 1000);
      setTimerId(id);

      return () => clearInterval(id); // Clear interval on unmount or pause
    }
  }, [isPaused, timeLeft]);

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

    if (inputWord.length !== startWord.length) {
      setMessage("Word must be the same length!");
      return;
    }

    if (!validWords.has(inputWord.toLowerCase())) {
      setMessage("Input must be a valid word!");
      return;
    }

    if (!isOneLetterDifferent(currentWord, inputWord)) {
      setMessage("Only one letter can be changed at a time!");
      return;
    }

    setSteps([...steps, inputWord]);
    setCurrentWord(inputWord);
    setMessage("");

    const newScore = calculateScore(inputWord, targetWord);
    setScore((prevScore) => prevScore + newScore);

    let hasMatchingLetter = false;
    for (let i = 0; i < inputWord.length; i++) {
      if (inputWord[i] === targetWord[i]) {
        hasMatchingLetter = true;
        break;
      }
    }

    if (hasMatchingLetter && !isMutedSFX) {
      handleLetterMatchSFX();
      return;
    }

    submitSFXRef.current.currentTime = 0; // Reset playback to the start
    submitSFXRef.current.play().catch((error) => {
      console.log("Submit audio playback failed:", error);
    });
    if (inputWord === targetWord) {
      setMessage("Congratulations! You've completed the word ladder!");
      setUserCompleted(true);
      clearInterval(timerId); // Stop the timer when the target word is found
      audioRef.current.pause();
      victorySFXRef.current.currentTime = 0; // Reset playback to the start
      victorySFXRef.current.play().catch((error) => {
        console.log("Submit audio playback failed:", error);
      });
      const combinedWordList = [...new Set([...wordList, ...steps])];
      const userPath = findShortestPath(
        startWord,
        targetWord,
        combinedWordList
      );
      setShortestPath(userPath);
    }

    setInputWord("");
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
    <div className="container ">
      {/* Background Blurry Circles */}
      <div className="blur-container">
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
        <div className="circle circle4"></div>
        <div className="circle circle5"></div>
      </div>
      <audio ref={audioRef} src={backgroundMusic} loop autoPlay />
      <button onClick={handlePause} className="pause-button">
        <FaPause />
      </button>
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
            <button onClick={() => window.location.reload()} className="modal-button">
              <FaRedo /> Retry
            </button>
            <button
              onClick={handleRetry}
              className="modal-button"
            >
              <FaDoorOpen /> Quit
            </button>
          </div>
        </div>
      )}
      
      <img src={wordgameImage} className="image"></img>
      <div className="game-container">
        <div className="steps-taken">
          <h5 className="all">All Steps Taken</h5>
          <div className="steps-taken-list" id="scrollable-container">
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
        </div>
        {/* Add a button or form to call handleAddWord with new words */}
      </div>
      <h6 className="start float-left text-white "> Start Word </h6> <br></br>{" "}
      <br></br>
      <div className="mt-3 word-box" style={{ marginLeft: "30px" }}>
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
      <br></br> <br></br>
      <br></br>
      <h6 className="target text-white">Target Word</h6>
      <div className="mt-3  word-box" style={{ marginLeft: "470px" }}>
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
      <h6 className="current-word float-left text-white ">Current Word:</h6>{" "}
      <br></br> <br></br>
      <div className="mt-3 word-box" style={{ marginLeft: "30px" }}>
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
      <br></br> <br></br>
      <br></br>
      <br></br> <br></br>
      <h6 className="float-left time text-white">Time Left: </h6>
      <br></br> <br></br>
      <h5 className="float-left text-white seconds">{timeLeft} seconds</h5>
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
        <br></br> <br></br>
        <button type="submit" className="enter text-white">
          Enter
        </button>
      </form>
      <p style={{ color: "red" }}>{message}</p>
      {userCompleted && (
        <div className="solution">
          <h3>Optimal Solution </h3>
          <p>
            {shortestPath.length > 0
              ? shortestPath.join(" -> ")
              : "No path found"}
          </p>
        </div>
      )}
    </div>
  );
};

export default WordLadder;
