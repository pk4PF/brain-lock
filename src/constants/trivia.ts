/**
 * General-knowledge question bank for the trivia challenge. Each question has
 * exactly 4 options; `answer` is the index (0-3) of the correct one. Difficulty
 * in the unlock flow only controls how many questions you face (Easy 3 / Med 5 /
 * Hard 8) — pass = all correct.
 */
export interface TriviaQuestion {
  q: string;
  options: [string, string, string, string];
  answer: number;
}

export const TRIVIA: TriviaQuestion[] = [
  { q: 'What is the capital of Australia?', options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], answer: 1 },
  { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'What planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], answer: 2 },
  { q: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Rembrandt'], answer: 2 },
  { q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
  { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 2 },
  { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { q: 'Which country has the most people?', options: ['India', 'USA', 'China', 'Indonesia'], answer: 0 },
  { q: 'How many minutes are in a full day?', options: ['1200', '1440', '1600', '2400'], answer: 1 },
  { q: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], answer: 2 },
  { q: 'Which language has the most native speakers?', options: ['English', 'Spanish', 'Hindi', 'Mandarin'], answer: 3 },
  { q: 'What is the hardest natural substance?', options: ['Gold', 'Iron', 'Diamond', 'Quartz'], answer: 2 },
  { q: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Tolstoy', 'Austen'], answer: 1 },
  { q: 'What is the freezing point of water in °C?', options: ['0', '10', '-10', '32'], answer: 0 },
  { q: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1 },
  { q: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], answer: 1 },
  { q: 'What is the currency of Japan?', options: ['Won', 'Yuan', 'Yen', 'Ringgit'], answer: 2 },
  { q: 'Which planet is closest to the Sun?', options: ['Earth', 'Venus', 'Mercury', 'Mars'], answer: 2 },
  { q: 'What does "HTTP" stand for the first word of?', options: ['Hyper', 'High', 'Host', 'Home'], answer: 0 },
  { q: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '7'], answer: 2 },
  { q: 'What is the tallest mountain on Earth?', options: ['K2', 'Kilimanjaro', 'Everest', 'Denali'], answer: 2 },
  { q: 'Which blood type is the universal donor?', options: ['A', 'O negative', 'AB', 'B positive'], answer: 1 },
  { q: 'In what year did World War II end?', options: ['1943', '1945', '1947', '1950'], answer: 1 },
  { q: 'What is the largest planet in our solar system?', options: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'], answer: 2 },
  { q: 'How many colours are in a rainbow?', options: ['5', '6', '7', '8'], answer: 2 },
];
