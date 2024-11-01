import React, { useState, useEffect } from "react";
import wordList from "./words.json"; // Adjust the path if needed

// Convert word list into a Set for quick lookup
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
    .map((char, index) => (currentWord[index] === char ? char : "_"))
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
  const [timeLeft, setTimeLeft] = useState(60); // Timer set to 60 seconds
  const [score, setScore] = useState(0); // Initialize score

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

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer); // Clean up on unmount
  }, [timeLeft]);

  const handleChange = (e) => {
    setInputWord(e.target.value);
  };

  const calculateScore = (inputWord, targetWord) => {
    let points = 0;

    // Add points for each matching letter
    for (let i = 0; i < inputWord.length; i++) {
      if (inputWord[i] === targetWord[i]) {
        points++;
      }
    }

    // Add points for correctly guessing the target word
    if (inputWord === targetWord) {
      points += 10; // Adjust the points as needed
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

    // Calculate and update the score
    const newScore = calculateScore(inputWord, targetWord);
    setScore((prevScore) => prevScore + newScore);

    if (inputWord === targetWord) {
      setMessage("Congratulations! You've completed the word ladder!");
      setUserCompleted(true);

      const combinedWordList = [...new Set([...wordList, ...steps])];
      const userPath = findShortestPath(startWord, targetWord, combinedWordList);
      setShortestPath(userPath);
      
      // Add time instead of resetting
      setTimeLeft((prevTime) => prevTime + 30); // Add 30 seconds
      // Generate new start and target words after winning
      setStartWord(getRandomWord(wordList));
      setTargetWord(getRandomWord(wordList));
      setCurrentWord(startWord); // Reset current word to the new start word
      setSteps([startWord]); // Reset steps to only include the new start word
      setUserCompleted(false); // Allow the user to keep playing
    }

    setInputWord("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Word Ladder Game</h1>
      <p>Start Word: {startWord}</p>
      <p>Target Word: {getRevealedTarget(currentWord, targetWord)}</p>
      <p>Current Word: {currentWord}</p>
      <p>Time Left: {timeLeft} seconds</p>
      <p>Score: {score}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputWord}
          onChange={handleChange}
          placeholder="Enter next word"
          disabled={userCompleted}
        />
        <button type="submit" disabled={userCompleted}>Submit</button>
      </form>
      <p style={{ color: "red" }}>{message}</p>

      <h3>All Steps Taken:</h3>
      <ul>
        {steps.map((word, index) => (
          <li key={index}>{word}</li>
        ))}
      </ul>

      {userCompleted && (
        <>
          <h3>Optimal Solution (Shortest Path):</h3>
          <p>{shortestPath.length > 0 ? shortestPath.join(" -> ") : "No path found"}</p>
        </>
      )}
    </div>
  );
};

export default WordLadder;
