import React, { useState, useEffect, useCallback } from 'react';

const EnglishSpellingApp = () => {
  
  const DEFAULT_WORDS = [
    { english: 'computer', russian: 'компьютер' },
    { english: 'telephone', russian: 'телефон' },
    { english: 'window', russian: 'окно' },
    { english: 'carry on', russian: 'продолжай'},
    { english: 'girl', russian: 'девочка'}
  ];

  const resetPractice = () => {
    // if no allWords fill them
    if (allWords.length === 0) {
      setAllWords([...DEFAULT_WORDS]);
      setWordsToLearn([...DEFAULT_WORDS]);
    } else {
      setWordsToLearn([...allWords]);
    }
    setCurrentWord(null);
    setShuffledLetters([]);
    setUserTypedText('');
    setWrongLetterPositions(new Set());
    setUsedLetterIds([]);
  }

  const addNewWords = () => {
    const parced = parseWordsFromText(newWordsInput);
    if (parced.length === 0) return;
    const updatedWords = createUniqueWordList([...allWords, ...parced]);
    
    setAllWords(updatedWords);
    setWordsToLearn(updatedWords);
    setNewWordsInput('');
    return;
  };

  const createUniqueWordList = (words) => {
    // Extract all English words from the list of word objects
    const englishWords = words.map(word => word.english);

    // Create a set to filter out duplicates, then convert it back to an array
    const uniqueEnglishWords = [...new Set(englishWords)];

    // Find the corresponding word object for each unique English word
    const uniqueWords = uniqueEnglishWords.map(english => 
      words.find(word => word.english === english)
    );

    return uniqueWords;
  }

  const parseWordsFromText = (text) => {
    const lines = text.split('\n');
    const words = lines.reduce((acc, line) => {
      const [english, russian] = line.trim().split(':');
      if (english && russian) acc.push({ english, russian });
      return acc;
    }, []);
    return words;
  };

  const removeWord = (englishWord) => {
    const updatedWords = allWords.filter(word => word.english !== englishWord);
    setAllWords(updatedWords);
    setWordsToLearn(updatedWords);
  }

  const removeAllWords = () => {
    setAllWords([]);
    setWordsToLearn([]);
  }

  const loadWordsFromStorage = () => {
    try {
      const stored = localStorage.getItem('allWords');
      if (stored && JSON.parse(stored).length) {
        return JSON.parse(stored);
      } else {
        // First time loading from the store. Save default words.
        const initialWords = [...DEFAULT_WORDS];
        saveWordsToStorage(initialWords);
        return initialWords;
      }
      
    } catch (error) {
      console.log('Failed to load words from a storage');
    }
  }

  const saveWordsToStorage = (words) => {
    try {
      localStorage.setItem('allWords', JSON.stringify(words));
    } catch (error) {
      console.error('Failed to save words', error);
    }
  }

  const isDefaultWord = (englishWord) => {
    return DEFAULT_WORDS.some(word => word.english === englishWord);
  }
  // Cudos to The Fisher–Yates algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createLettersWithIds = (word) => {
    return word.split('').map((letter,index) => (
      {
        id: `${letter}_${index}`,
        letter
      }
    ));
  }

  // Hooks

  const [allWords, setAllWords] = useState(
    () => loadWordsFromStorage()
  );
  const [wordsToLearn, setWordsToLearn] = useState(allWords);
  const [currentWord, setCurrentWord] = useState(null);
  const [userTypedText, setUserTypedText] = useState('');
  const [wrongLetterPositions, setWrongLetterPositions] = useState(new Set());
  const [newWordsInput, setNewWordsInput] = useState('');
  const [usedLetterIds ,setUsedLetterIds] = useState([])
  const [shuffledLetters, setShuffledLetters] = useState([]);

  // Save to localStorage whenever allWords changes
  useEffect(() => {
    saveWordsToStorage(allWords);
  }, [allWords]);

  const renderTypedResult = () => {
    if (!userTypedText) {
      return <span className='text-gray-400, italic'>Type the word...</span>
    }
    return userTypedText.split('').map((letter, index) => {
      const hasError = wrongLetterPositions.has(index);
      return (
        <span 
          key={index}
          className={hasError ? 'text-red-600 border-b-2 border-red-600 bg-red-100' :'text-gray-900'}
        >
          {letter === ' ' ? '\u00A0': letter}
        </span>
      )
    })
  }


  const handleLetterInput = (inputLetter, letterId = null) => {
    if (!currentWord) return;
    
    const letter = inputLetter.toLowerCase();
    const targetWord = currentWord.english.toLowerCase();
    
    if (letter !== ' ' && !targetWord.includes(letter)) return;
    
    let availableLetterId = letterId;
    
    // For keydown

    if (!availableLetterId) {
      const availableLetter = shuffledLetters.find(l => 
        l.letter.toLowerCase() === letter && !usedLetterIds.includes(l.id)
      );
      if (!availableLetter) return;
      availableLetterId = availableLetter.id;
    }
    
    if (usedLetterIds.includes(availableLetterId)) return;

    const findNextPositionToType = () => {
      const errorPositions = Array.from(wrongLetterPositions).sort((a, b) => a - b);
        
      return errorPositions.length > 0 ? errorPositions[0] : userTypedText.length;
    };

    const targetPosition = findNextPositionToType();
    const expectedLetter = targetWord[targetPosition];
    
    if (letter === expectedLetter) {
      handleCorrectLetter(letter, targetPosition, availableLetterId);
    } else {
      console.log({letter, targetPosition, userInputL: userTypedText.length, userTypedText ,availableLetterId});
      handleWrongLetter(letter, targetPosition, availableLetterId);
    }
  };

  const handleCorrectLetter = (letter, position, letterId) => {
    let newText = userTypedText;
    
    if (position < userTypedText.length) {
      newText = userTypedText.substring(0, position) + letter.toUpperCase() + userTypedText.substring(position + 1);
      const previousLetterId = usedLetterIds[position];
      if (previousLetterId) {
        setUsedLetterIds(prev => prev.filter(id => id !== previousLetterId));
      }
    } else {
      newText = userTypedText + letter.toUpperCase();
    }
    
    setUserTypedText(newText);
    
    const newErrorPositions = new Set(wrongLetterPositions);
    newErrorPositions.delete(position);
    setWrongLetterPositions(newErrorPositions);
    
    const newUsedLetterIds = [...usedLetterIds];
    newUsedLetterIds[position] = letterId;
    setUsedLetterIds(newUsedLetterIds);
    
    if (newText.length === currentWord.english.length && newErrorPositions.size === 0) {
      setTimeout(() => {
        setWordsToLearn(prev => prev.filter(word => word.english !== currentWord.english));
        selectRandomWord();
      }, 1000);
    }
  };

  const handleWrongLetter = (letter, position, letterId) => {
    let newText = userTypedText;
    
    if (position < userTypedText.length) {
      newText = userTypedText.substring(0, position) + letter.toUpperCase() + userTypedText.substring(position + 1);
      const previousLetterId = usedLetterIds[position];
      if (previousLetterId) {
        setUsedLetterIds(prev => prev.filter(id => id !== previousLetterId));
      }
    } else {
      newText = userTypedText + letter.toUpperCase();
    }
    
    setUserTypedText(newText);
    
    const newUsedLetterIds = [...usedLetterIds];
    newUsedLetterIds[position] = letterId;
    setUsedLetterIds(newUsedLetterIds);
    
    const newErrorPositions = new Set(wrongLetterPositions);
    newErrorPositions.add(position);
    setWrongLetterPositions(newErrorPositions);
  };

  const handleKeyPress = (event) => {
    const key = event.key.toLowerCase();
    
    if (!/^[a-z ]$/.test(key)) return;
    
    // Only prevent space in the game area, not when adding words
    if (key === ' ' && !event.target.matches('textarea')) {
      event.preventDefault();
    }
    
    // Only handle letter input if not typing in textarea
    if (!event.target.matches('textarea')) {
      handleLetterInput(key);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWord, userTypedText, wrongLetterPositions, shuffledLetters, usedLetterIds]);

  const selectRandomWord = useCallback(() => {
    if (wordsToLearn.length === 0 ) {
      setCurrentWord(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * wordsToLearn.length);
    const selectedWord = wordsToLearn[randomIndex];

    setCurrentWord(selectedWord);
    setShuffledLetters(
      shuffleArray(
        createLettersWithIds(selectedWord.english)
      )
    );
    setUserTypedText('');
    setWrongLetterPositions(new Set());
    setUsedLetterIds([]);
  }, [wordsToLearn])

  useEffect(() => {
    selectRandomWord();
  }, [selectRandomWord])

  const renderNoWords = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-6 sm:mb-10">
        English Spelling Practice
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 border-b-2 border-gray-200 pb-2 sm:pb-3">
          Add New Words
        </h2>
        <textarea
          value={newWordsInput}
          onChange={(e) => setNewWordsInput(e.target.value)}
          placeholder="Add new words (one per line):&#10;table:стол&#10;spinning wheel:прялка"
          className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg min-h-24 sm:min-h-32 mb-3 sm:mb-4 font-mono text-sm"
          rows={6}
        />
        <button
          onClick={addNewWords}
          disabled={!newWordsInput.trim()}
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 rounded-lg font-semibold mr-0 sm:mr-4"
        >
          Add Words
        </button>
      </div>

      {allWords.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 border-b-2 border-gray-200 pb-2 sm:pb-3">
            Words ({allWords.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
            {allWords.map((word, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 sm:p-3 rounded-lg">
                <span className="font-mono text-xs sm:text-sm flex-1 mr-2">
                  <span className="font-semibold">{word.english}</span> - {word.russian}
                  {isDefaultWord(word.english) && (
                    <span className="ml-1 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1 sm:px-2 py-1 rounded">default</span>
                  )}
                </span>
                <button
                  onClick={() => removeWord(word.english)}
                  className="text-red-500 hover:text-red-700 text-lg sm:text-xl flex-shrink-0"
                  title="Remove word"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-lg sm:text-xl text-gray-600 p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-lg">
        <p className="mb-3 sm:mb-4">No words remaining!</p>
        <p className="mb-4 sm:mb-6">Add new words above or reset to practice again.</p>
        <button
          onClick={resetPractice}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold cursor-pointer"
        >
          Reset Practice
        </button>
      </div>
    </div>
  )

  if (!currentWord) {
    if (wordsToLearn.length === 0) {
      return renderNoWords();
    }
    return <div className='flex justify-center items-center min-h-screen'>Loading...</div>
  }

  const isWordComplete = userTypedText.length === currentWord.english.length && wrongLetterPositions.size === 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-6 sm:mb-10">
        English Spelling Practice
      </h1>

 
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 border-b-2 border-gray-200 pb-2 sm:pb-3">
          Translation
        </h2>
        <div className="text-2xl sm:text-3xl text-center text-blue-800 font-bold">
          {currentWord.russian}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 border-b-2 border-gray-200 pb-2 sm:pb-3">
          Result
        </h2>
        <div className="text-lg sm:text-2xl lg:text-3xl text-center min-h-12 sm:min-h-16 p-4 sm:p-6 bg-gray-50 border-3 border-gray-300 rounded-lg font-mono tracking-wider sm:tracking-widest flex items-center justify-center font-bold">
          {renderTypedResult()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 border-b-2 border-gray-200 pb-2 sm:pb-3">
          Spelling
        </h2>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
          {shuffledLetters.map((letterObj, index) => {
            const isLetterUsed = usedLetterIds.includes(letterObj.id);
            
            return (
              <button
                key={index}
                onClick={() => handleLetterInput(letterObj.letter, letterObj.id)}
                disabled={isLetterUsed}
                className={`text-lg sm:text-xl lg:text-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-lg font-bold min-w-12 sm:min-w-14 lg:min-w-16 text-center shadow-md transition-all duration-200 ${
                  !isLetterUsed
                    ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                {letterObj.letter.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 border-b-2 border-gray-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2 sm:mb-0">Add New Words</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className="text-base sm:text-lg font-semibold text-blue-600">
              Remaining: {wordsToLearn.length}/{allWords.length}
            </span>
            <button
              onClick={resetPractice}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
        <textarea
          value={newWordsInput}
          onChange={(e) => setNewWordsInput(e.target.value)}
          placeholder="Add new words (one per line):&#10;table:стол&#10;spinning wheel:прялка"
          className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg min-h-20 sm:min-h-24 mb-3 sm:mb-4 font-mono text-sm"
          rows={4}
        />
        <button
          onClick={addNewWords}
          disabled={!newWordsInput.trim()}
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 rounded-lg font-semibold"
        >
          Add Words
        </button>
      </div>

      {allWords.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 border-b-2 border-gray-200 pb-3'>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2 sm:mb-0">
              Words ({allWords.length})
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <button
                onClick={removeAllWords}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold cursor-pointer"
              >
                Remove All Words
              </button>
            </div>            
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 max-h-32 sm:max-h-40 overflow-y-auto">
            {allWords.map((word, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 sm:p-3 rounded-lg">
                <span className="font-mono text-xs sm:text-sm flex-1 mr-2">
                  <span className="font-semibold">{word.english}</span> - {word.russian}
                  {isDefaultWord(word.english) && (
                    <span className="ml-1 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1 sm:px-2 py-1 rounded">default</span>
                  )}
                </span>
                <button
                  onClick={() => removeWord(word.english)}
                  className="text-red-500 hover:text-red-700 text-lg sm:text-xl flex-shrink-0 cursor-pointer"
                  title="Remove word"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-gray-600 text-sm sm:text-base lg:text-lg p-4 sm:p-6 bg-white rounded-lg shadow-sm">
        Type letters on your keyboard or click the letter buttons above
      </div>

      {isWordComplete && (
        <div className="text-center text-green-600 text-lg sm:text-xl lg:text-2xl font-bold mt-4 sm:mt-6 p-4 sm:p-6 bg-green-100 border-2 border-green-600 rounded-lg">
          Well done! Moving to next word...
        </div>
      )}
    </div>
  );
};

export default EnglishSpellingApp;