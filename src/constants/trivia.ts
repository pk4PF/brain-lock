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
  { q: 'What does the "S" in "HTTPS" stand for?', options: ['Secure', 'Server', 'System', 'Standard'], answer: 0 },
  { q: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '7'], answer: 2 },
  { q: 'What is the tallest mountain on Earth?', options: ['K2', 'Kilimanjaro', 'Everest', 'Denali'], answer: 2 },
  { q: 'Which blood type is the universal donor?', options: ['A', 'O negative', 'AB', 'B positive'], answer: 1 },
  { q: 'In what year did World War II end?', options: ['1943', '1945', '1947', '1950'], answer: 1 },
  { q: 'What is the largest planet in our solar system?', options: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'], answer: 2 },
  { q: 'How many colours are in a rainbow?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'What is the capital of Canada?', options: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'], answer: 1 },
  { q: 'How many legs does a spider have?', options: ['6', '8', '10', '12'], answer: 1 },
  { q: 'What is the largest mammal in the world?', options: ['Elephant', 'Blue whale', 'Giraffe', 'Hippo'], answer: 1 },
  { q: 'Which metal is liquid at room temperature?', options: ['Iron', 'Mercury', 'Copper', 'Lead'], answer: 1 },
  { q: 'How many players are on a soccer team?', options: ['9', '10', '11', '12'], answer: 2 },
  { q: 'What is the capital of France?', options: ['Lyon', 'Marseille', 'Paris', 'Nice'], answer: 2 },
  { q: 'What is the main ingredient in guacamole?', options: ['Avocado', 'Pea', 'Cucumber', 'Lime'], answer: 0 },
  { q: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], answer: 2 },
  { q: 'What is the chemical formula for water?', options: ['CO2', 'H2O', 'O2', 'NaCl'], answer: 1 },
  { q: 'Who developed the theory of relativity?', options: ['Newton', 'Einstein', 'Darwin', 'Tesla'], answer: 1 },
  { q: 'What is the largest country by area?', options: ['Canada', 'China', 'USA', 'Russia'], answer: 3 },
  { q: 'How many sides does a triangle have?', options: ['2', '3', '4', '5'], answer: 1 },
  { q: 'What is the main language spoken in Brazil?', options: ['Spanish', 'Portuguese', 'French', 'English'], answer: 1 },
  { q: 'Which organ pumps blood around the body?', options: ['Liver', 'Lungs', 'Heart', 'Kidney'], answer: 2 },
  { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Greyhound'], answer: 1 },
  { q: 'How many zeros are in one million?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'What is the capital of Italy?', options: ['Venice', 'Milan', 'Rome', 'Naples'], answer: 2 },
  { q: 'Which gas makes up most of Earth\'s atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], answer: 1 },
  { q: 'How many teeth does an adult human normally have?', options: ['28', '30', '32', '34'], answer: 2 },
  { q: 'What is the smallest planet in our solar system?', options: ['Mars', 'Mercury', 'Earth', 'Venus'], answer: 1 },
  { q: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'], answer: 2 },
  { q: 'What is the largest hot desert on Earth?', options: ['Gobi', 'Sahara', 'Kalahari', 'Mojave'], answer: 1 },
  { q: 'What is the currency of the United Kingdom?', options: ['Euro', 'Dollar', 'Pound', 'Franc'], answer: 2 },
  { q: 'Which planet is famous for its rings?', options: ['Mars', 'Saturn', 'Venus', 'Mercury'], answer: 1 },
  { q: 'What do bees make from nectar?', options: ['Wax', 'Honey', 'Silk', 'Milk'], answer: 1 },
  { q: 'How many strings does a violin have?', options: ['3', '4', '5', '6'], answer: 1 },
  { q: 'In which country are the pyramids of Giza?', options: ['Mexico', 'Egypt', 'Peru', 'Sudan'], answer: 1 },
];
