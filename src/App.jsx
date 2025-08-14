import React, { useCallback, useEffect, useState } from 'react';

const SpellingApp = () => {
  const wordPairs = [
    { english: 'computer', russian: 'компьютер' },
    { english: 'telephone', russian: 'телефон' },
    { english: 'window', russian: 'окно' }
  ];

  const [availableWords, setAvailableWords] = useState(wordPairs);
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [errorPositions, setErrorPositions] = useState(new Set());
  const [usedLetters, setUsedLetters] = useState([]);
  const [shuffledLetters, setShuffledLetters] = useState([]);


  
  // Shuffle letters function
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const pickRandomWord = useCallback(() => {
    if (availableWords.length === 0) {
      setCurrentWord(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * wordPairs.length);
    const selectedWord = availableWords[randomIndex];

    setCurrentWord(selectedWord);
    const letters = selectedWord.english.split('').map((letter, index) => ({ letter, id: `${letter}_${index}` }));
    setShuffledLetters(shuffleArray(letters));
    setUserInput('');
    setErrorPositions(new Set());
    setUsedLetters([]);

  }, [availableWords]);

  useEffect(() => {
    pickRandomWord();
  }, [pickRandomWord]);

  const renderResult = () => {
    if (!userInput) {
      return <span className="text-gray-400 italic">Type the word...</span>;
    }
    return userInput.split("").map((letter, index) => {
      const isError = errorPositions.has(index);
      return (
        <span 
          key={index}
          className={`${isError ? 'text-red-600 border-b-2 border-red-600 bg-red-100' : 'text-gray-900'}`}>
            {letter === ' ' ? '&nbsp;' : letter}
        </span>
      )
    });
  }


  // Handle letter click
  const handleLetterClick = (letterObj) => {
    handleLetterInput(letterObj.letter, letterObj.id);
  };

  const handleLetterInput = (inputLetter, letterId = null) => {
    if (!currentWord) return;
    
    const letter = inputLetter.toLowerCase();
    const targetWord = currentWord.english.toLowerCase();
    
    // Check if letter exists in the current word
    if (!targetWord.includes(letter)) return;
    
    // For keyboard input, find an available letter
    let availableLetterId = letterId;
    if (!availableLetterId) {
      const availableLetter = shuffledLetters.find(l => 
        l.letter.toLowerCase() === letter && !usedLetters.includes(l.id)
      );
      if (!availableLetter) return;
      availableLetterId = availableLetter.id;
    }
    
    // Check if this specific letter is still available
    if (usedLetters.includes(availableLetterId)) return;

    // Find the next position to type (first error position or end of input)
    let targetPosition = userInput.length;
    
    // If we have errors, find the first error position
    const errorPositionArray = Array.from(errorPositions).sort((a, b) => a - b);
    if (errorPositionArray.length > 0) {
      targetPosition = errorPositionArray[0];
    }
    
    const targetLetter = targetWord[targetPosition];
    
    if (letter === targetLetter) {
      // Correct letter
      let newInput = userInput;
      
      if (targetPosition < userInput.length) {
        // Replace wrong letter at target position
        newInput = userInput.substring(0, targetPosition) + letter.toUpperCase() + userInput.substring(targetPosition + 1);
        
        // Free up the previously used wrong letter at this position
        const previousLetterId = usedLetters[targetPosition];
        if (previousLetterId) {
          setUsedLetters(prev => prev.filter(id => id !== previousLetterId));
        }
      } else {
        // Add correct letter at the end
        newInput = userInput + letter.toUpperCase();
      }
      
      setUserInput(newInput);
      
      // Remove error from this position
      const newErrorPositions = new Set(errorPositions);
      newErrorPositions.delete(targetPosition);
      setErrorPositions(newErrorPositions);
      
      // Mark this letter as used at the correct position
      const newUsedLetters = [...usedLetters];
      newUsedLetters[targetPosition] = availableLetterId;
      setUsedLetters(newUsedLetters);
      
      // Check if word is complete
      if (newInput.length === currentWord.english.length && newErrorPositions.size === 0) {
        setTimeout(() => {
          // Remove completed word from available words
          setAvailableWords(prev => 
            prev.filter(word => word.english !== currentWord.english)
          );
          pickRandomWord();
        }, 1000);
      }
    } else {
      // Wrong letter
      const newErrorPositions = new Set(errorPositions);
      let newInput = userInput;
      
      if (targetPosition < userInput.length) {
        // Replace wrong letter at target position
        newInput = userInput.substring(0, targetPosition) + letter.toUpperCase() + userInput.substring(targetPosition + 1);
        
        // Free up the previously used wrong letter at this position
        const previousLetterId = usedLetters[targetPosition];
        if (previousLetterId) {
          setUsedLetters(prev => prev.filter(id => id !== previousLetterId));
        }
      } else {
        // Add wrong letter at the end
        newInput = userInput + letter.toUpperCase();
      }
      
      setUserInput(newInput);
      
      // Mark this letter as used at the target position
      const newUsedLetters = [...usedLetters];
      newUsedLetters[targetPosition] = availableLetterId;
      setUsedLetters(newUsedLetters);
      
      newErrorPositions.add(targetPosition);
      setErrorPositions(newErrorPositions);
    }
  };

  if (!currentWord) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-10">
        English Spelling Practice
      </h1>
      
      {/* Translation Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-semibold mb-6">Translation</h2>
        <div className="text-3xl text-center uppercase">
          {currentWord.russian}
        </div>
      </div>

      {/* Result Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-semibold mb-6">Your Spelling</h2>
        <div className="text-3xl text-center min-h-16 p-6 bg-gray-100 rounded-lg">
          {renderResult()}
        </div>
      </div>

      {/* Letter Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6">Letters</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {shuffledLetters.map((letterObj, index) => {
            const isUsed = usedLetters.includes(letterObj.id);
            return (
              <button
                key={index}
                onClick={() => handleLetterClick(letterObj.letter, letterObj.id)}
                className={`text-2xl px-6 py-4 bg-blue-500 text-white rounded-lg font-bold ${
                  isUsed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {letterObj.letter.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default SpellingApp;