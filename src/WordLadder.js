import React, { useState, useEffect } from "react";

// Helper function to check if two words differ by exactly one letter
const isOneLetterDifferent = (word1, word2) => {
  let diffCount = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) diffCount++;
    if (diffCount > 1) return false;
  }
  return diffCount === 1;
};

// Function to find the shortest path using BFS
const findShortestPath = (startWord, targetWord, wordList) => {
  const queue = [[startWord]];  // Queue to store paths
  const visited = new Set([startWord]);  // Set to track visited words

  while (queue.length > 0) {
    const path = queue.shift();  // Get the first path from the queue
    const currentWord = path[path.length - 1];  // Last word in the path

    // If we've reached the target, return the path
    if (currentWord === targetWord) return path;

    // Go through each word in the dictionary
    for (const word of wordList) {
      // If the word differs by one letter and hasn't been visited
      if (isOneLetterDifferent(currentWord, word) && !visited.has(word)) {
        visited.add(word);  // Mark word as visited
        queue.push([...path, word]);  // Add new path with the current word
      }
    }
  }

  return [];  // Return an empty array if no path found
};

// Function to display the correctly matched letters
const getRevealedTarget = (currentWord, targetWord) => {
  return targetWord
    .split("")
    .map((char, index) => (currentWord[index] === char ? char : "_"))
    .join("");
};

// Function to get a random word from a list
const getRandomWord = (words, length) => {
  const filteredWords = words.filter((word) => word.length === length);
  const randomIndex = Math.floor(Math.random() * filteredWords.length);
  return filteredWords[randomIndex];
};

const WordLadder = () => {
  // Updated word list with 4-letter words
  const wordList = [
    "bark", "dark", "park", "lark",
    "cart", "card", "hard", "ward",
    "word", "cord", "load", "frog",
    "clog", "smog", "fold", "gold"
  ];

  // Randomly select start and target words of the same length
  const [startWord, setStartWord] = useState(getRandomWord(wordList, 4));
  const [targetWord, setTargetWord] = useState(getRandomWord(wordList, 4));

  const [currentWord, setCurrentWord] = useState(startWord);
  const [inputWord, setInputWord] = useState("");
  const [steps, setSteps] = useState([startWord]);
  const [message, setMessage] = useState("");
  const [shortestPath, setShortestPath] = useState([]);
  const [userCompleted, setUserCompleted] = useState(false);

  useEffect(() => {
    // Find the shortest path when the component mounts
    const path = findShortestPath(startWord, targetWord, wordList);
    setShortestPath(path);
  }, [startWord, targetWord]);

  const handleChange = (e) => {
    setInputWord(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inputWord.length !== startWord.length) {
      setMessage("Word must be the same length!");
      return;
    }

    if (!isOneLetterDifferent(currentWord, inputWord)) {
      setMessage("Only one letter can be changed at a time!");
      return;
    }

    setSteps([...steps, inputWord]);
    setCurrentWord(inputWord);
    setMessage("");

    if (inputWord === targetWord) {
      setMessage("Congratulations! You've completed the word ladder!");
      setUserCompleted(true);  // Mark the user as having completed the game

      // Combine user input steps with the original word list
      const combinedWordList = [...new Set([...wordList, ...steps])];
      
      // Run BFS based on the user's inputted words
      const userPath = findShortestPath(startWord, targetWord, combinedWordList);
      setShortestPath(userPath);  // Update the shortest path based on the user's input
    }

    setInputWord("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Word Ladder Game</h1>
      <p>Start Word: {startWord}</p>
      <p>Target Word: {getRevealedTarget(currentWord, targetWord)}</p> {/* Display matched letters */}
      <p>Current Word: {currentWord}</p>
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

      {/* Display all inputted words */}
      <h3>All Steps Taken:</h3>
      <ul>
        {steps.map((word, index) => (
          <li key={index}>{word}</li>
        ))}
      </ul>

      {/* Display the shortest path after user completes the game */}
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
