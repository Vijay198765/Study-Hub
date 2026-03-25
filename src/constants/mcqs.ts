import { QuizQuestion } from '../types';

export const DEFAULT_MCQS: Record<string, QuizQuestion[]> = {
  'Science': [
    {
      id: 's1',
      question: "Which gas is essential for photosynthesis?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      correctAnswer: 1
    },
    {
      id: 's2',
      question: "What is the SI unit of power?",
      options: ["Joule", "Newton", "Watt", "Pascal"],
      correctAnswer: 2
    },
    {
      id: 's3',
      question: "Which part of the human brain is responsible for balance and coordination?",
      options: ["Cerebrum", "Cerebellum", "Medulla Oblongata", "Hypothalamus"],
      correctAnswer: 1
    },
    {
      id: 's4',
      question: "What is the chemical formula of common salt?",
      options: ["NaCl", "KCl", "MgCl2", "CaCl2"],
      correctAnswer: 0
    },
    {
      id: 's5',
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1
    },
    {
      id: 's6',
      question: "What is the process of conversion of solid directly into gas called?",
      options: ["Evaporation", "Condensation", "Sublimation", "Fusion"],
      correctAnswer: 2
    },
    {
      id: 's7',
      question: "Which vitamin is synthesized in the human body in the presence of sunlight?",
      options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
      correctAnswer: 3
    },
    {
      id: 's8',
      question: "What is the pH value of pure water?",
      options: ["0", "7", "14", "1"],
      correctAnswer: 1
    },
    {
      id: 's9',
      question: "Which element is the most abundant in the Earth's crust?",
      options: ["Iron", "Silicon", "Oxygen", "Aluminum"],
      correctAnswer: 2
    },
    {
      id: 's10',
      question: "What is the unit of electric current?",
      options: ["Volt", "Ohm", "Ampere", "Watt"],
      correctAnswer: 2
    }
  ],
  'Math': [
    {
      id: 'm1',
      question: "What is the value of (2^3) * (2^2)?",
      options: ["2^5", "2^6", "4^5", "4^6"],
      correctAnswer: 0
    },
    {
      id: 'm2',
      question: "The sum of the angles of a triangle is:",
      options: ["90°", "180°", "270°", "360°"],
      correctAnswer: 1
    },
    {
      id: 'm3',
      question: "What is the square root of 625?",
      options: ["15", "25", "35", "45"],
      correctAnswer: 1
    },
    {
      id: 'm4',
      question: "If 3x + 5 = 20, what is the value of x?",
      options: ["3", "5", "7", "15"],
      correctAnswer: 1
    },
    {
      id: 'm5',
      question: "What is the area of a circle with radius 7 units? (Take π = 22/7)",
      options: ["44 sq units", "154 sq units", "196 sq units", "616 sq units"],
      correctAnswer: 1
    },
    {
      id: 'm6',
      question: "The probability of an impossible event is:",
      options: ["0", "0.5", "1", "-1"],
      correctAnswer: 0
    },
    {
      id: 'm7',
      question: "What is the HCF of 12 and 18?",
      options: ["2", "3", "6", "12"],
      correctAnswer: 2
    },
    {
      id: 'm8',
      question: "The value of sin 30° is:",
      options: ["0", "1/2", "√3/2", "1"],
      correctAnswer: 1
    },
    {
      id: 'm9',
      question: "If the side of a cube is 4 cm, its volume is:",
      options: ["16 cm³", "32 cm³", "64 cm³", "96 cm³"],
      correctAnswer: 2
    },
    {
      id: 'm10',
      question: "What is the median of the data: 2, 4, 6, 8, 10?",
      options: ["4", "5", "6", "8"],
      correctAnswer: 2
    }
  ],
  'History': [
    {
      id: 'h1',
      question: "Who was the first Prime Minister of Independent India?",
      options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "Dr. B.R. Ambedkar"],
      correctAnswer: 1
    },
    {
      id: 'h2',
      question: "The 'Quit India Movement' was launched in the year:",
      options: ["1920", "1930", "1942", "1947"],
      correctAnswer: 2
    },
    {
      id: 'h3',
      question: "Who is known as the 'Iron Man of India'?",
      options: ["Subhas Chandra Bose", "Sardar Vallabhbhai Patel", "Lala Lajpat Rai", "Bhagat Singh"],
      correctAnswer: 1
    },
    {
      id: 'h4',
      question: "The First World War started in which year?",
      options: ["1912", "1914", "1918", "1939"],
      correctAnswer: 1
    },
    {
      id: 'h5',
      question: "Who founded the Mughal Empire in India?",
      options: ["Akbar", "Babur", "Humayun", "Shah Jahan"],
      correctAnswer: 1
    },
    {
      id: 'h6',
      question: "The Jallianwala Bagh massacre took place in:",
      options: ["1915", "1919", "1921", "1923"],
      correctAnswer: 1
    },
    {
      id: 'h7',
      question: "Who was the last Mughal Emperor?",
      options: ["Aurangzeb", "Bahadur Shah Zafar", "Shah Alam II", "Akbar II"],
      correctAnswer: 1
    },
    {
      id: 'h8',
      question: "The Battle of Plassey was fought in:",
      options: ["1757", "1764", "1857", "1761"],
      correctAnswer: 0
    },
    {
      id: 'h9',
      question: "Who was the first woman Prime Minister of India?",
      options: ["Sarojini Naidu", "Indira Gandhi", "Pratibha Patil", "Sushma Swaraj"],
      correctAnswer: 1
    },
    {
      id: 'h10',
      question: "The French Revolution began in:",
      options: ["1776", "1789", "1799", "1804"],
      correctAnswer: 1
    }
  ],
  'Geography': [
    {
      id: 'g1',
      question: "Which is the longest river in the world?",
      options: ["Amazon", "Nile", "Ganga", "Mississippi"],
      correctAnswer: 1
    },
    {
      id: 'g2',
      question: "Which is the smallest continent in the world?",
      options: ["Europe", "Antarctica", "Australia", "South America"],
      correctAnswer: 2
    },
    {
      id: 'g3',
      question: "Which planet is known as the 'Blue Planet'?",
      options: ["Venus", "Earth", "Mars", "Neptune"],
      correctAnswer: 1
    },
    {
      id: 'g4',
      question: "Which is the largest ocean in the world?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: 3
    },
    {
      id: 'g5',
      question: "Mount Everest is located in which country?",
      options: ["India", "China", "Nepal", "Bhutan"],
      correctAnswer: 2
    },
    {
      id: 'g6',
      question: "Which line divides India into two almost equal parts?",
      options: ["Equator", "Tropic of Cancer", "Tropic of Capricorn", "Arctic Circle"],
      correctAnswer: 1
    },
    {
      id: 'g7',
      question: "Which is the largest desert in the world?",
      options: ["Sahara", "Gobi", "Thar", "Antarctic Desert"],
      correctAnswer: 3
    },
    {
      id: 'g8',
      question: "The layer of atmosphere closest to the Earth's surface is:",
      options: ["Stratosphere", "Mesosphere", "Troposphere", "Exosphere"],
      correctAnswer: 2
    },
    {
      id: 'g9',
      question: "Which state in India has the longest coastline?",
      options: ["Maharashtra", "Tamil Nadu", "Gujarat", "Andhra Pradesh"],
      correctAnswer: 2
    },
    {
      id: 'g10',
      question: "What is the capital of Japan?",
      options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
      correctAnswer: 2
    }
  ],
  'Civics': [
    {
      id: 'c1',
      question: "The Indian Constitution was adopted on:",
      options: ["15th August 1947", "26th January 1950", "26th November 1949", "2nd October 1948"],
      correctAnswer: 2
    },
    {
      id: 'c2',
      question: "The head of the Gram Panchayat is called:",
      options: ["Sarpanch", "Mayor", "Collector", "Tehsildar"],
      correctAnswer: 0
    },
    {
      id: 'c3',
      question: "Who is known as the 'Father of the Indian Constitution'?",
      options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B.R. Ambedkar", "Rajendra Prasad"],
      correctAnswer: 2
    },
    {
      id: 'c4',
      question: "The minimum age for voting in India is:",
      options: ["16 years", "18 years", "21 years", "25 years"],
      correctAnswer: 1
    },
    {
      id: 'c5',
      question: "The Rajya Sabha is also known as:",
      options: ["Lower House", "Upper House", "People's House", "State Assembly"],
      correctAnswer: 1
    },
    {
      id: 'c6',
      question: "How many Fundamental Rights are guaranteed by the Indian Constitution?",
      options: ["5", "6", "7", "10"],
      correctAnswer: 1
    },
    {
      id: 'c7',
      question: "The President of India is elected for a term of:",
      options: ["4 years", "5 years", "6 years", "Life"],
      correctAnswer: 1
    },
    {
      id: 'c8',
      question: "Who is the presiding officer of the Lok Sabha?",
      options: ["President", "Vice President", "Prime Minister", "Speaker"],
      correctAnswer: 3
    },
    {
      id: 'c9',
      question: "Which organ of the government makes laws?",
      options: ["Executive", "Judiciary", "Legislature", "Media"],
      correctAnswer: 2
    },
    {
      id: 'c10',
      question: "The Supreme Court of India is located in:",
      options: ["Mumbai", "Kolkata", "Chennai", "New Delhi"],
      correctAnswer: 3
    }
  ],
  'Economics': [
    {
      id: 'e1',
      question: "Which sector is also known as the service sector?",
      options: ["Primary", "Secondary", "Tertiary", "Quaternary"],
      correctAnswer: 2
    },
    {
      id: 'e2',
      question: "What is the full form of GDP?",
      options: ["Gross Domestic Product", "General Domestic Product", "Gross Development Plan", "Global Development Product"],
      correctAnswer: 0
    },
    {
      id: 'e3',
      question: "Which bank is known as the 'Banker's Bank' in India?",
      options: ["SBI", "HDFC", "RBI", "ICICI"],
      correctAnswer: 2
    },
    {
      id: 'e4',
      question: "The process of rapid integration between countries is called:",
      options: ["Liberalization", "Privatization", "Globalization", "Nationalization"],
      correctAnswer: 2
    },
    {
      id: 'e5',
      question: "Which of the following is a formal source of credit?",
      options: ["Moneylenders", "Friends", "Banks", "Relatives"],
      correctAnswer: 2
    },
    {
      id: 'e6',
      question: "What is the main aim of the MGNREGA 2005?",
      options: ["Education", "Health", "Employment", "Housing"],
      correctAnswer: 2
    },
    {
      id: 'e7',
      question: "Currency notes in India are issued by:",
      options: ["Finance Ministry", "State Bank of India", "Reserve Bank of India", "NITI Aayog"],
      correctAnswer: 2
    },
    {
      id: 'e8',
      question: "A situation where more people are employed than required is called:",
      options: ["Unemployment", "Seasonal Unemployment", "Disguised Unemployment", "Structural Unemployment"],
      correctAnswer: 2
    },
    {
      id: 'e9',
      question: "Which organization monitors the banks in India?",
      options: ["SEBI", "RBI", "SIDBI", "NABARD"],
      correctAnswer: 1
    },
    {
      id: 'e10',
      question: "The Consumer Protection Act (COPRA) was enacted in:",
      options: ["1980", "1986", "1991", "2005"],
      correctAnswer: 1
    }
  ]
};
