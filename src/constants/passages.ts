export interface Passage {
  words: string[];
  question: string;
  options: string[];
  answer: number;
}

// ── Short passages (15-20 words) - used in early rounds ──────

const SHORT: Passage[] = [
  {
    words: 'The human brain uses about twenty percent of the body total energy despite being only two percent of body weight'.split(' '),
    question: 'What percentage of energy does the brain use?',
    options: ['Ten percent', 'Twenty percent', 'Thirty percent', 'Five percent'],
    answer: 1,
  },
  {
    words: 'Dolphins sleep with one eye open because only half of their brain rests at a time'.split(' '),
    question: 'How do dolphins sleep?',
    options: ['Fully awake', 'With one eye open', 'Upside down', 'In groups only'],
    answer: 1,
  },
  {
    words: 'Octopuses have three hearts and blue blood because they use copper instead of iron to carry oxygen'.split(' '),
    question: 'Why do octopuses have blue blood?',
    options: ['High salt diet', 'Copper carries oxygen', 'Cold water adaptation', 'Genetic mutation'],
    answer: 1,
  },
  {
    words: 'Trees communicate with each other through underground fungal networks that scientists call the wood wide web'.split(' '),
    question: 'What do scientists call tree communication networks?',
    options: ['Root link', 'Wood wide web', 'Forest net', 'Tree talk'],
    answer: 1,
  },
  {
    words: 'A group of flamingos is called a flamboyance and they get their pink color from eating shrimp and algae'.split(' '),
    question: 'What gives flamingos their pink color?',
    options: ['Genetics', 'Sunlight', 'Shrimp and algae', 'Water minerals'],
    answer: 2,
  },
  {
    words: 'Lightning strikes the Earth about one hundred times every second during thunderstorms around the world'.split(' '),
    question: 'How often does lightning strike the Earth?',
    options: ['Once per minute', 'Ten times per second', 'One hundred times per second', 'Once per hour'],
    answer: 2,
  },
  {
    words: 'Bananas are naturally radioactive because they contain high levels of potassium which includes the isotope potassium forty'.split(' '),
    question: 'Why are bananas radioactive?',
    options: ['They contain uranium', 'They contain potassium', 'They grow in volcanic soil', 'They absorb radiation'],
    answer: 1,
  },
  {
    words: 'The shortest war in history lasted only thirty eight minutes between Britain and Zanzibar in eighteen ninety six'.split(' '),
    question: 'How long did the shortest war last?',
    options: ['Two hours', 'Thirty eight minutes', 'One day', 'Fifteen minutes'],
    answer: 1,
  },
  {
    words: 'Sharks have been on Earth for over four hundred million years making them older than dinosaurs and trees'.split(' '),
    question: 'How old are sharks as a species?',
    options: ['One million years', 'Fifty million years', 'Four hundred million years', 'One billion years'],
    answer: 2,
  },
  {
    words: 'Honey bees must visit about two million flowers to make just one pound of honey for the hive'.split(' '),
    question: 'How many flowers are needed for one pound of honey?',
    options: ['One thousand', 'Fifty thousand', 'Two million', 'Ten million'],
    answer: 2,
  },
  {
    words: 'Your nose can remember about fifty thousand different scents and is most sensitive when you are young'.split(' '),
    question: 'How many scents can your nose remember?',
    options: ['One thousand', 'Fifty thousand', 'Five hundred', 'One million'],
    answer: 1,
  },
  {
    words: 'Venus is the only planet in our solar system that spins clockwise while all others spin counterclockwise'.split(' '),
    question: 'What is unique about how Venus spins?',
    options: ['It does not spin', 'It spins clockwise', 'It spins the fastest', 'It wobbles'],
    answer: 1,
  },
];

// ── Medium passages (20-30 words) - used in middle rounds ────

const MEDIUM: Passage[] = [
  {
    words: 'Honey never spoils and archaeologists have found three thousand year old honey in Egyptian tombs that was still perfectly edible when they opened the sealed jars'.split(' '),
    question: 'Where was ancient honey found?',
    options: ['Greek ruins', 'Roman vaults', 'Egyptian tombs', 'Chinese caves'],
    answer: 2,
  },
  {
    words: 'The speed of light is approximately three hundred thousand kilometers per second making it the fastest known phenomenon in the universe that nothing can exceed'.split(' '),
    question: 'What is the fastest thing in the universe?',
    options: ['Sound', 'Light', 'Gravity', 'Electricity'],
    answer: 1,
  },
  {
    words: 'Mars has the tallest mountain in our solar system called Olympus Mons which is nearly three times the height of Mount Everest and wider than the entire state of Arizona'.split(' '),
    question: 'How tall is Olympus Mons compared to Everest?',
    options: ['Same height', 'Twice as tall', 'Nearly three times', 'Ten times taller'],
    answer: 2,
  },
  {
    words: 'The Great Wall of China is not actually visible from space with the naked eye despite the popular myth that has been repeated for decades in textbooks'.split(' '),
    question: 'Can you see the Great Wall from space?',
    options: ['Yes clearly', 'Only with binoculars', 'Not with the naked eye', 'Only at night'],
    answer: 2,
  },
  {
    words: 'A single bolt of lightning contains enough energy to toast about one hundred thousand slices of bread but it only lasts for a fraction of a second'.split(' '),
    question: 'How many slices of bread could one lightning bolt toast?',
    options: ['One thousand', 'Ten thousand', 'One hundred thousand', 'One million'],
    answer: 2,
  },
  {
    words: 'Crows can recognize human faces and will remember people who have threatened them passing this knowledge down to their offspring across multiple generations'.split(' '),
    question: 'What can crows remember about humans?',
    options: ['Their voices', 'Their faces', 'Their clothing', 'Their cars'],
    answer: 1,
  },
  {
    words: 'The Amazon rainforest produces about twenty percent of the world oxygen supply and is home to more than ten percent of all species on Earth'.split(' '),
    question: 'How much of the world oxygen does the Amazon produce?',
    options: ['Five percent', 'Twenty percent', 'Fifty percent', 'Eighty percent'],
    answer: 1,
  },
  {
    words: 'Jellyfish have survived for over six hundred and fifty million years without brains hearts or bones making them one of the most ancient creatures alive today'.split(' '),
    question: 'What organs do jellyfish lack?',
    options: ['Eyes and ears', 'Brains and hearts', 'Skin and muscles', 'Lungs and liver'],
    answer: 1,
  },
  {
    words: 'Water can boil and freeze at the same time in a process called the triple point which occurs at a specific temperature and pressure combination'.split(' '),
    question: 'What is the triple point of water?',
    options: ['When water evaporates instantly', 'When it boils and freezes simultaneously', 'When ice melts underground', 'When steam condenses'],
    answer: 1,
  },
  {
    words: 'The inventor of the Pringles can was so proud of his creation that when he died his ashes were buried inside one of the iconic tubes'.split(' '),
    question: 'Where were the Pringles inventor ashes placed?',
    options: ['In a museum', 'In a Pringles can', 'In a time capsule', 'At the factory'],
    answer: 1,
  },
  {
    words: 'Astronauts grow up to two inches taller in space because the lack of gravity allows the spine to decompress and stretch out without the weight of the body'.split(' '),
    question: 'Why do astronauts grow taller in space?',
    options: ['More exercise', 'Better nutrition', 'Spine decompresses', 'Bone growth speeds up'],
    answer: 2,
  },
  {
    words: 'The tongue of a blue whale weighs as much as an elephant and its heart is so large that a small child could crawl through its arteries'.split(' '),
    question: 'How heavy is a blue whale tongue?',
    options: ['As much as a car', 'As much as an elephant', 'As much as a horse', 'As much as a bear'],
    answer: 1,
  },
];

// ── Long passages (30-45 words) - used in later rounds ───────

const LONG: Passage[] = [
  {
    words: 'The human body contains about sixty thousand miles of blood vessels which is enough to wrap around the Earth more than twice and the heart pumps blood through this entire network roughly once every minute'.split(' '),
    question: 'How far do blood vessels stretch?',
    options: ['One thousand miles', 'Ten thousand miles', 'Sixty thousand miles', 'One million miles'],
    answer: 2,
  },
  {
    words: 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza which was already over two thousand years old when she became the ruler of Egypt'.split(' '),
    question: 'What was already ancient when Cleopatra ruled?',
    options: ['The Colosseum', 'The Great Pyramid', 'The Parthenon', 'Stonehenge'],
    answer: 1,
  },
  {
    words: 'A teaspoon of neutron star material would weigh about six billion tons on Earth because neutron stars are so incredibly dense that their atoms have been crushed together by the force of their own gravity'.split(' '),
    question: 'How much would a teaspoon of neutron star weigh?',
    options: ['One million tons', 'Six billion tons', 'One hundred tons', 'One trillion tons'],
    answer: 1,
  },
  {
    words: 'There are more possible iterations of a game of chess than there are atoms in the known observable universe which is why no computer has ever solved chess completely despite decades of research'.split(' '),
    question: 'How do chess iterations compare to atoms in the universe?',
    options: ['Fewer iterations', 'About the same', 'More iterations', 'Cannot be compared'],
    answer: 2,
  },
  {
    words: 'Sea otters hold hands while sleeping to prevent themselves from drifting apart in ocean currents and they also wrap themselves in kelp to anchor in place during the night'.split(' '),
    question: 'Why do sea otters hold hands while sleeping?',
    options: ['To stay warm', 'To prevent drifting apart', 'To protect from predators', 'To communicate'],
    answer: 1,
  },
  {
    words: 'The Sahara Desert is expanding southward at a rate of about thirty miles per year and it was actually a lush green landscape with rivers and lakes just six thousand years ago'.split(' '),
    question: 'What was the Sahara like six thousand years ago?',
    options: ['Frozen tundra', 'Lush and green', 'Rocky mountains', 'Same as today'],
    answer: 1,
  },
  {
    words: 'Butterflies taste with their feet which helps them identify plants to lay eggs on and they can detect the chemicals on leaf surfaces simply by landing on them and walking around'.split(' '),
    question: 'How do butterflies taste things?',
    options: ['With their antennae', 'With their wings', 'With their feet', 'With their eyes'],
    answer: 2,
  },
  {
    words: 'The oldest known living tree is a bristlecone pine named Methuselah which is over four thousand eight hundred years old and still growing in the White Mountains of California today'.split(' '),
    question: 'How old is the Methuselah tree?',
    options: ['One thousand years', 'Two thousand years', 'Over four thousand years', 'Ten thousand years'],
    answer: 2,
  },
  {
    words: 'Oxford University is so old that it predates the Aztec Empire by at least two hundred years with teaching beginning there as early as ten sixty six right after the Norman conquest of England'.split(' '),
    question: 'Which is older, Oxford or the Aztec Empire?',
    options: ['The Aztec Empire', 'Oxford University', 'They started the same year', 'Neither is very old'],
    answer: 1,
  },
  {
    words: 'Tardigrades are microscopic animals that can survive in the vacuum of space extreme radiation temperatures near absolute zero and pressures six times greater than the deepest ocean trenches on Earth'.split(' '),
    question: 'What can tardigrades survive?',
    options: ['Only extreme cold', 'Only deep water', 'Space radiation and extreme conditions', 'Only high temperatures'],
    answer: 2,
  },
  {
    words: 'The total weight of all ants on Earth is estimated to be roughly equal to the total weight of all humans which is remarkable given that each individual ant weighs less than a grain of rice'.split(' '),
    question: 'How does total ant weight compare to human weight?',
    options: ['Much less', 'Roughly equal', 'Ten times more', 'One hundred times less'],
    answer: 1,
  },
  {
    words: 'Your brain generates enough electrical activity while you are awake to power a small light bulb and it processes information faster than any supercomputer ever built by human engineers'.split(' '),
    question: 'What could your brain electrical activity power?',
    options: ['A television', 'A small light bulb', 'A refrigerator', 'A car engine'],
    answer: 1,
  },
];

/** Get shuffled passages for a game: 2 short, 2 medium, 2 long */
export function getGamePassages(): Passage[] {
  const pick = (pool: Passage[], n: number) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  };
  return [...pick(SHORT, 2), ...pick(MEDIUM, 2), ...pick(LONG, 2)];
}
