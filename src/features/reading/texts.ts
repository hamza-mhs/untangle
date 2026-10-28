/**
 * Read-aloud texts (pack 2 SPEC §4). Public domain only, shipped in the bundle, tagged by genre,
 * never fetched at runtime. Each text carries three key-idea keyword sets for the spoken summary
 * (OxSummary): matching is on-device keyword overlap, no LLM, no network.
 *
 * English content. TODO(content): proof-read each page against a scanned public-domain edition
 * before launch; these are working copies.
 */

export const GENRES = ['stoic', 'stories', 'nature', 'poetry', 'science'] as const;
export type Genre = (typeof GENRES)[number];

export type KeyIdea = { label: string; words: readonly string[] };

export type ReadingText = {
  id: string;
  genre: Genre;
  source: string;
  author: string;
  pages: readonly string[];
  keyIdeas: readonly [KeyIdea, KeyIdea, KeyIdea];
};

export const TEXTS: readonly ReadingText[] = [
  {
    id: 'meditations-4',
    genre: 'stoic',
    source: 'Meditations · Book IV',
    author: 'Marcus Aurelius',
    pages: [
      'Men seek retreats for themselves, houses in the country, sea-shores, and mountains; and thou too art wont to desire such things very much.',
      'But this is altogether a mark of the most common sort of men, for it is in thy power whenever thou shalt choose to retire into thyself.',
      'For nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul.',
      'And I affirm that tranquillity is nothing else than the good ordering of the mind.',
      'Constantly then give to thyself this retreat, and renew thyself; and let thy principles be brief and fundamental.',
      'Take away thy opinion, and then there is taken away the complaint, I have been harmed. Take away the complaint, and the harm is taken away.',
      'Do not act as if thou wert going to live ten thousand years. While thou livest, while it is in thy power, be good.',
      'How much trouble he avoids who does not look to see what his neighbour says or does or thinks, but only to what he does himself.',
      'Think of the universe of matter, of which thou hast a very small portion, and of universal time, of which a short interval has been given thee.',
      'Be like the promontory against which the waves continually break, but it stands firm and tames the fury of the water around it.',
    ],
    keyIdeas: [
      {
        label: 'Escaping somewhere',
        words: ['retreat', 'escape', 'country', 'sea', 'mountain', 'away', 'holiday', 'house'],
      },
      {
        label: 'Any time you choose',
        words: ['whenever', 'choose', 'power', 'anytime', 'any time', 'always', 'can'],
      },
      {
        label: 'Into yourself',
        words: ['yourself', 'mind', 'soul', 'inside', 'within', 'thyself', 'own'],
      },
    ],
  },
  {
    id: 'north-wind-sun',
    genre: 'stories',
    source: "Aesop's Fables",
    author: 'Aesop',
    pages: [
      'The North Wind and the Sun had a quarrel about which of them was the stronger.',
      'While they were disputing with much heat and bluster, a traveller passed along the road wrapped in a cloak.',
      'Let us agree, said the Sun, that he is the stronger who can strip that traveller of his cloak.',
      'Very well, growled the North Wind, and at once sent a cold, howling blast against the traveller.',
      'With the first gust of wind the ends of the cloak whipped about his body. But he wrapped it closely around him.',
      'The harder the Wind blew, the tighter he held it to him. The North Wind tore angrily at the cloak, but all his efforts were in vain.',
      'Then the Sun began to shine. At first his beams were gentle, and in the pleasant warmth the traveller unfastened his cloak.',
      'The Sun shone brighter and brighter. The man took off his cap and mopped his brow, and at last threw off his cloak altogether.',
      'He sat down in the shade of a tree by the roadside to rest. The North Wind had to admit that the Sun had won.',
      'Gentleness and kind persuasion win where force and bluster fail.',
    ],
    keyIdeas: [
      {
        label: 'Wind against sun',
        words: ['wind', 'sun', 'contest', 'competition', 'stronger', 'quarrel', 'bet'],
      },
      {
        label: 'Taking off the cloak',
        words: ['cloak', 'coat', 'traveller', 'traveler', 'jacket', 'off'],
      },
      {
        label: 'Gentle beats force',
        words: ['gentle', 'kind', 'kindness', 'persuasion', 'force', 'warmth', 'warm', 'soft'],
      },
    ],
  },
  {
    id: 'walden',
    genre: 'nature',
    source: 'Walden · Where I Lived',
    author: 'Henry David Thoreau',
    pages: [
      'I went to the woods because I wished to live deliberately, to front only the essential facts of life.',
      'I wanted to see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
      'I did not wish to live what was not life, living is so dear; nor did I wish to practise resignation, unless it was quite necessary.',
      'I wanted to live deep and suck out all the marrow of life.',
      'Our life is frittered away by detail. An honest man has hardly need to count more than his ten fingers.',
      'Simplicity, simplicity, simplicity! I say, let your affairs be as two or three, and not a hundred or a thousand.',
      'Let us spend one day as deliberately as Nature, and not be thrown off the track by every nutshell and mosquito wing that falls on the rails.',
      'Time is but the stream I go a-fishing in. I drink at it; but while I drink I see the sandy bottom and detect how shallow it is.',
      'Its thin current slides away, but eternity remains.',
      'I would drink deeper; fish in the sky, whose bottom is pebbly with stars.',
    ],
    keyIdeas: [
      {
        label: 'Living on purpose',
        words: ['deliberately', 'purpose', 'intention', 'intentionally', 'essential', 'woods'],
      },
      {
        label: 'Keep it simple',
        words: ['simple', 'simplicity', 'less', 'fewer', 'detail', 'details'],
      },
      {
        label: 'Time slips away',
        words: ['time', 'stream', 'passes', 'away', 'slides', 'current', 'river'],
      },
    ],
  },
  {
    id: 'daffodils',
    genre: 'poetry',
    source: 'I Wandered Lonely as a Cloud',
    author: 'William Wordsworth',
    pages: [
      'I wandered lonely as a cloud that floats on high over vales and hills, when all at once I saw a crowd, a host, of golden daffodils;',
      'beside the lake, beneath the trees, fluttering and dancing in the breeze.',
      'Continuous as the stars that shine and twinkle on the milky way, they stretched in never-ending line along the margin of a bay:',
      'ten thousand saw I at a glance, tossing their heads in sprightly dance.',
      'The waves beside them danced; but they out-did the sparkling waves in glee: a poet could not but be gay, in such a jocund company:',
      'I gazed and gazed but little thought what wealth the show to me had brought:',
      'for oft, when on my couch I lie in vacant or in pensive mood, they flash upon that inward eye which is the bliss of solitude;',
      'and then my heart with pleasure fills, and dances with the daffodils.',
    ],
    keyIdeas: [
      {
        label: 'A field of daffodils',
        words: ['daffodil', 'daffodils', 'flower', 'flowers', 'golden', 'yellow'],
      },
      {
        label: 'Dancing in the breeze',
        words: ['dance', 'dancing', 'danced', 'breeze', 'wind', 'waves'],
      },
      {
        label: 'Remembered later',
        words: ['remember', 'memory', 'later', 'couch', 'solitude', 'inward', 'mind'],
      },
    ],
  },
  {
    id: 'entangled-bank',
    genre: 'science',
    source: 'On the Origin of Species · Conclusion',
    author: 'Charles Darwin',
    pages: [
      'It is interesting to contemplate an entangled bank, clothed with many plants of many kinds,',
      'with birds singing on the bushes, with various insects flitting about, and with worms crawling through the damp earth,',
      'and to reflect that these elaborately constructed forms, so different from each other, and dependent on each other in so complex a manner,',
      'have all been produced by laws acting around us.',
      'Thus, from the war of nature, from famine and death, the most exalted object which we are capable of conceiving directly follows.',
      'There is grandeur in this view of life, with its several powers, having been originally breathed into a few forms or into one;',
      'and that, whilst this planet has gone cycling on according to the fixed law of gravity,',
      'from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.',
    ],
    keyIdeas: [
      {
        label: 'A crowded riverbank',
        words: ['bank', 'plants', 'birds', 'insects', 'worms', 'riverbank', 'nature'],
      },
      { label: 'Laws behind it all', words: ['law', 'laws', 'produced', 'rules', 'gravity'] },
      {
        label: 'Endless forms',
        words: ['endless', 'forms', 'evolved', 'evolution', 'beautiful', 'wonderful', 'species'],
      },
    ],
  },
];

export function textById(id: string | undefined): ReadingText | undefined {
  return TEXTS.find((x) => x.id === id);
}

export function textsFor(genre: Genre): ReadingText[] {
  return TEXTS.filter((x) => x.genre === genre);
}

const WORDS_PER_MINUTE = 130;

export function wordCount(text: ReadingText): number {
  return text.pages.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
}

/** "≈ 4 min aloud". */
export function minutesAloud(text: ReadingText): number {
  return Math.max(1, Math.round(wordCount(text) / WORDS_PER_MINUTE));
}
