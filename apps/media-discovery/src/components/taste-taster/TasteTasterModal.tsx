'use client';

import { useState } from 'react';
import Image from 'next/image';

const mockMoviePairs = [
  [
    { id: 1, title: 'Blade Runner 2049', poster: '/bladerunner2049.jpg' },
    { id: 2, title: 'Toy Story', poster: '/toystory.jpg' },
  ],
  [
    { id: 3, title: 'Interstellar', poster: '/interstellar.jpg' },
    { id: 4, title: 'La La Land', poster: '/lalaland.jpg' },
  ],
  [
    { id: 5, title: 'Arrival', poster: '/arrival.jpg' },
    { id: 6, title: 'The Big Lebowski', poster: '/biglebowski.jpg' },
  ],
];

interface TasteTasterModalProps {
  onClose: () => void;
}

export default function TasteTasterModal({ onClose }: TasteTasterModalProps) {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedMovieTitles, setSelectedMovieTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelection = (movieTitle: string) => {
    const updatedSelections = [...selectedMovieTitles, movieTitle];
    setSelectedMovieTitles(updatedSelections);
    finishOrContinue(updatedSelections);
  };

  const handleSkip = () => {
    finishOrContinue(selectedMovieTitles);
  };
  
  const finishOrContinue = async (selections: string[]) => {
    if (currentPairIndex < mockMoviePairs.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      setIsLoading(true);
      try {
        if (selections.length > 0) {
            const response = await fetch('/api/generate-taste-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieTitles: selections }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate taste profile');
            }

            const tasteProfile = await response.json();
            sessionStorage.setItem('tasteProfile', JSON.stringify(tasteProfile));
        }
        
        sessionStorage.setItem('tasteProfileGenerated', 'true');

      } catch (error) {
        console.error("Taste Taster API error:", error);
        // Still close the modal, but don't set the generated flag so it can be tried again.
      } finally {
        setIsLoading(false);
        onClose();
      }
    }
  }

  const currentPair = mockMoviePairs[currentPairIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl shadow-xl p-8 max-w-2xl relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Tell us your taste!</h1>
            {isLoading ? (
                <p className="text-lg mb-8 text-gray-300">Generating your taste profile...</p>
            ) : (
                <p className="text-lg mb-8 text-gray-300">Which movie do you prefer?</p>
            )}
        </div>

        <div className="flex justify-center space-x-8 mb-8">
          {currentPair.map((movie) => (
            <div
              key={movie.id}
              className={`flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !isLoading && handleSelection(movie.title)}
            >
              <Image
                src={movie.poster}
                alt={movie.title}
                width={250}
                height={375}
                className="rounded-lg shadow-lg"
              />
              <p className="mt-4 text-lg text-center">{movie.title}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
            <button
                onClick={handleSkip}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-700 rounded-lg text-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
            >
                {isLoading ? 'Analyzing...' : 'Neither / Skip'}
            </button>

            <p className="mt-8 text-sm text-gray-500">
                {currentPairIndex + 1} of {mockMoviePairs.length}
            </p>
        </div>
      </div>
    </div>
  );
}
