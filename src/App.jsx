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
  const handleLetterClick = (letter, letterId) => {
    if (usedLetters.includes(letterId)) return;

    const nextPosition = userInput.length;
    const correctLetter = currentWord.english[nextPosition];
    if (letter === correctLetter) {
      setUserInput(prev => prev + letter);
      setUsedLetters(prev => [...prev, letterId]);
      // Remove error if it existed at this position
      if (errorPositions.has(nextPosition)) {
        const newErrors = new Set(errorPositions);
        newErrors.delete(nextPosition);
        setErrorPositions(newErrors);
      }
    } else {
      // Wrong letter - mark error position
      setUserInput(prev => prev + letter);
      setErrorPositions(prev => new Set(prev).add(nextPosition));
      setUsedLetters(prev => [...prev, letterId]);
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
        <div className="text-3xl text-center">
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