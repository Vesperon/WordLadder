import React, { useState, useEffect, useRef } from "react";
import wordList from "./words.json"; // Adjust the path if needed
import { FaPause } from "react-icons/fa6";
import wordLadderImage from "../src/wordladder.png";
import backgroundMusic from "./bg1.mp3";
import backspaceSFX from "./EraseSFX.mp3";
import lettermatchSFX from "./LetterMatched.mp3";

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
  const audioRef = useRef(new Audio(backgroundMusic));    // Create audio instance
  const backspaceAudioRef = useRef(new Audio(backspaceSFX)); // Backspace sound effect
  const hasStartedMusic = useRef(false);   // Flag to ensure music starts only once
  const submitSFXRef = useRef(new Audio(lettermatchSFX));

  
  useEffect(() => {
    const startAudio = () => {
      if (!hasStartedMusic.current) {
        audioRef.current.loop = true; // Ensure the background music loops
        audioRef.current.play().catch((error) => {
          console.log("Audio playback failed:", error);
        });
        hasStartedMusic.current = true; // Set flag to true after starting audio
      }
      document.removeEventListener("click", startAudio);
    };

    // Add a click listener to start audio on user interaction
    document.addEventListener("click", startAudio);

    return () => {
      document.removeEventListener("click", startAudio); // Cleanup on unmount
    };
  }, []);
  
  useEffect(() => {
    const path = findShortestPath(startWord, targetWord, wordList);
    setShortestPath(path);
    
  }, [startWord, targetWord]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setMessage("Time's up! Game over.");
      setUserCompleted(true);
      return;
    }
    if (!isPaused) {
      const id = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      setTimerId(id);

      return () => clearInterval(id);
    }

    const id = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    setTimerId(id); // Store timer ID

    return () => clearInterval(id); // Clean up on unmount
  
  }, [timeLeft, isPaused]);

  
  const handleKeyDown = (e) => {
    // Play backspace sound effect if the backspace key is pressed
    if (e.key === "Backspace") {
      backspaceAudioRef.current.currentTime = 0; // Reset playback to the start
      backspaceAudioRef.current.play().catch((error) => {
        console.log("Backspace audio playback failed:", error);
      });
    }
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

    submitSFXRef.current.currentTime = 0; // Reset playback to the start
    submitSFXRef.current.play().catch((error) => {
      console.log("Submit audio playback failed:", error);
    });
    if (inputWord === targetWord) {
      setMessage("Congratulations! You've completed the word ladder!");
      setUserCompleted(true);
      clearInterval(timerId); // Stop the timer when the target word is found

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
    setIsPaused((prevState) => !prevState); // Toggle the pause state (show/hide modal)
    if (isPaused) {
      // Resume the timer if it's paused
      const id = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      setTimerId(id); // Store timer ID
    } else {
      // Stop the timer if it's paused
      clearInterval(timerId);
    }
  };

  const handleContinue = () => {
    setIsPaused(false);
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
    setIsMutedSFX((prev) => !prev);
  };

  
  
  return (
    <div className="container ">
     <audio ref={audioRef} src={backgroundMusic} loop autoPlay />
     <audio ref={backspaceAudioRef} src={backspaceSFX} />
      <button onClick={handlePause} className="pause-button">
        <FaPause />
        {isPaused ? "Resume" : ""}
      </button>
      {isPaused && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Game Paused</h2>

            <button onClick={toggleMusic}>
              {isMutedMusic ? "Unmute Music" : "Mute Music"}
            </button>
            <button onClick={toggleSFX}>
              {isMutedSFX ? "Unmute SFX" : "Mute SFX"}
            </button>

            <button onClick={() => window.location.reload()}>Retry</button>
            <button onClick={() => window.location.reload()}>Quit</button>
            <button onClick={handleContinue}>Continue</button>
          </div>
        </div>
      )}
      <img src={wordLadderImage} className="image"></img>
     

     <div className="game-container">
        <div className="steps-taken">
          <h3>All Steps Taken:</h3>
          <div className="steps-taken-list">
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
      <h5 className="start float-left text-white "> Start Word </h5> <br></br>{" "}
      <br></br>
      <div className="mt-3">
        <div className="word-placeholder">?</div>
        <div className="word-placeholder">?</div>
        <div className="word-placeholder">?</div>
        <div className="word-placeholder">?</div>
      </div>
      <br></br> <br></br>
      <br></br>
      <h5 className="startWord float-left px-4 text-white rounded ">
        {startWord}
      </h5>
      <h6 className="target text-white">Target Word</h6>
      <div className="mt-3 wordtarget">
        <div className="word-targets">?</div>
        <div className="word-targets">?</div>
        <div className="word-targets">?</div>
        <div className="word-targets">?</div>
      </div>
      <h5 className="targetword text-white">
        {" "}
        {getRevealedTarget(currentWord, targetWord)}
      </h5>
      <h6 className="current-word float-left text-white ">Current Word:</h6>{" "}
      <br></br> <br></br>
      <div className="mt-3">
        <div className="word-current">?</div>
        <div className="word-current">?</div>
        <div className="word-current">?</div>
        <div className="word-current">?</div>
      </div>
      <br></br> <br></br>
      <br></br>
      <h6
        className="current float-left px-4
      
       text-white "
      >
        {" "}
        {currentWord}
      </h6>{" "}
      <br></br> <br></br>
      <h5 className="float-left time text-white">Time Left: </h5>
      <br></br> <br></br>
       <h5 className="float-left text-white seconds">{timeLeft} seconds</h5>             
      <form onSubmit={handleSubmit} className="textfield">
        <input
          type="text"
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}   // Listen for backspace key
          placeholder="Enter next word"
          disabled={userCompleted}
        />
        <br></br> <br></br>
        <button type="submit" className="btn text-white">
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
