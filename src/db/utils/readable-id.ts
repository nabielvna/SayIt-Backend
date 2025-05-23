export function generateReadableId() {
  // 200+ adjectives - descriptive and diverse
  const adjectives = [
    // Colors
    "amber",
    "azure",
    "beige",
    "black",
    "blue",
    "brown",
    "crimson",
    "cyan",
    "emerald",
    "fuchsia",
    "gold",
    "gray",
    "green",
    "indigo",
    "ivory",
    "jade",
    "lavender",
    "lime",
    "magenta",
    "maroon",
    "navy",
    "olive",
    "orange",
    "pink",
    "purple",
    "red",
    "rose",
    "ruby",
    "sapphire",
    "scarlet",
    "silver",
    "teal",
    "turquoise",
    "violet",
    "white",
    "yellow",

    // Qualities
    "able",
    "agile",
    "alert",
    "alive",
    "amused",
    "ancient",
    "annual",
    "arctic",
    "arid",
    "aromatic",
    "atomic",
    "autumn",
    "awake",
    "aware",
    "balanced",
    "bold",
    "brave",
    "brief",
    "bright",
    "broad",
    "busy",
    "calm",
    "careful",
    "cheerful",
    "chief",
    "classic",
    "clean",
    "clear",
    "clever",
    "coastal",
    "colossal",
    "comic",
    "cool",
    "cosmic",
    "crisp",
    "cubic",
    "curious",
    "curved",
    "cute",
    "dapper",
    "dark",
    "dazzling",
    "deep",
    "delicate",
    "dense",
    "digital",
    "direct",
    "divine",
    "double",
    "down",
    "dry",
    "dual",
    "dutiful",
    "dynamic",
    "eager",
    "early",
    "eastern",
    "easy",
    "elegant",
    "elite",
    "endless",
    "energetic",
    "entire",
    "equal",
    "exact",
    "exotic",
    "expert",
    "express",
    "faint",
    "fair",
    "fancy",
    "far",
    "fast",
    "fierce",
    "fine",
    "firm",
    "first",
    "fit",
    "floral",
    "flowing",
    "fluent",
    "flying",
    "formal",
    "fragrant",
    "free",
    "fresh",
    "friendly",
    "full",
    "fun",
    "funny",
    "fuzzy",
    "gentle",
    "gifted",
    "gigantic",
    "glad",
    "glassy",
    "glowing",
    "good",
    "graceful",
    "grand",
    "great",
    "green",
    "growing",
    "happy",
    "harmonic",
    "healthy",
    "heavy",
    "helpful",
    "hidden",
    "high",
    "hollow",
    "honest",
    "humble",
    "hungry",
    "icy",
    "ideal",
    "immense",
    "infinite",
    "inner",
    "intense",
    "iron",
    "jolly",
    "joyful",
    "jubilant",
    "jumbo",
    "keen",
    "kind",
    "large",
    "lasting",
    "latest",
    "leafy",
    "light",
    "likely",
    "lively",
    "logical",
    "loud",
    "lovely",
    "loyal",
    "lucky",
    "lunar",
    "lush",
    "magic",
    "majestic",
    "mammoth",
    "merry",
    "mighty",
    "mindful",
    "mini",
    "modern",
    "modest",
    "moral",
    "musical",
    "narrow",
    "natural",
    "neat",
    "new",
    "nice",
    "noble",
    "normal",
    "north",
    "notable",
    "novel",
    "odd",
    "optimal",
    "orange",
    "organic",
    "outer",
    "patient",
    "peaceful",
    "perfect",
    "petite",
    "playful",
    "pleased",
    "poetic",
    "polite",
    "popular",
    "positive",
    "precious",
    "precise",
    "pretty",
    "prime",
    "pristine",
    "proud",
    "pure",
    "quick",
    "quiet",
    "rare",
    "rapid",
    "ready",
    "real",
    "regal",
    "rich",
    "right",
    "robust",
    "royal",
    "rural",
    "rustic",
    "sacred",
    "safe",
    "salty",
    "sandy",
    "scenic",
    "secret",
    "serene",
    "sharp",
    "shiny",
    "silent",
    "silky",
    "silver",
    "simple",
    "skilled",
    "sleek",
    "small",
    "smart",
    "smooth",
    "snowy",
    "social",
    "soft",
    "solar",
    "solid",
    "sonic",
    "sound",
    "south",
    "special",
    "spicy",
    "spiral",
    "stable",
    "stark",
    "steady",
    "stellar",
    "still",
    "strong",
    "sturdy",
    "subtle",
    "sunny",
    "super",
    "sweet",
    "swift",
    "tactful",
    "talented",
    "tall",
    "tender",
    "thick",
    "thin",
    "thorough",
    "tidy",
    "tight",
    "timely",
    "tiny",
    "top",
    "tough",
    "tranquil",
    "true",
    "trusted",
    "twin",
    "unique",
    "urban",
    "useful",
    "usual",
    "valiant",
    "valued",
    "vast",
    "vibrant",
    "victorious",
    "vigilant",
    "virtual",
    "vital",
    "vivid",
    "vocal",
    "warm",
    "watchful",
    "wealthy",
    "western",
    "whole",
    "wide",
    "wild",
    "windy",
    "wise",
    "witty",
    "wonderful",
    "worthy",
    "young",
    "zealous",
    "zesty",
  ];

  // 200+ nouns - diverse categories for greater uniqueness
  const nouns = [
    // Animals
    "ant",
    "ape",
    "bat",
    "bear",
    "bee",
    "bird",
    "bison",
    "boar",
    "buck",
    "bull",
    "camel",
    "cat",
    "cheetah",
    "chicken",
    "chimp",
    "clam",
    "cobra",
    "coyote",
    "crab",
    "crane",
    "crow",
    "deer",
    "dog",
    "dolphin",
    "dove",
    "duck",
    "eagle",
    "eel",
    "elk",
    "emu",
    "falcon",
    "ferret",
    "finch",
    "fish",
    "flamingo",
    "fly",
    "fox",
    "frog",
    "gator",
    "gecko",
    "goat",
    "goose",
    "gopher",
    "hawk",
    "heron",
    "horse",
    "hound",
    "hyena",
    "ibex",
    "ibis",
    "jackal",
    "jaguar",
    "koala",
    "koi",
    "leopard",
    "lion",
    "lizard",
    "llama",
    "lobster",
    "lynx",
    "mole",
    "monkey",
    "moose",
    "moth",
    "mouse",
    "mule",
    "newt",
    "orca",
    "otter",
    "owl",
    "panda",
    "panther",
    "parrot",
    "pelican",
    "penguin",
    "pigeon",
    "pike",
    "pony",
    "puma",
    "python",
    "quail",
    "rabbit",
    "ram",
    "raven",
    "rhino",
    "robin",
    "salmon",
    "seal",
    "shark",
    "sheep",
    "shrimp",
    "sloth",
    "snail",
    "snake",
    "sparrow",
    "spider",
    "squid",
    "squirrel",
    "stork",
    "swan",
    "tiger",
    "toad",
    "trout",
    "turkey",
    "turtle",
    "viper",
    "walrus",
    "wasp",
    "weasel",
    "whale",
    "wolf",
    "wombat",
    "yak",
    "zebra",

    // Nature
    "alba",
    "alps",
    "arch",
    "aurora",
    "autumn",
    "avalanche",
    "basin",
    "bay",
    "beach",
    "bluff",
    "bog",
    "brook",
    "butte",
    "canyon",
    "cave",
    "cliff",
    "cloud",
    "coast",
    "comet",
    "coral",
    "crater",
    "creek",
    "crest",
    "crystal",
    "dawn",
    "delta",
    "desert",
    "dew",
    "dune",
    "earth",
    "eclipse",
    "elm",
    "estuary",
    "fjord",
    "flare",
    "flood",
    "flower",
    "fog",
    "forest",
    "frost",
    "geyser",
    "glacier",
    "glade",
    "glen",
    "glow",
    "gorge",
    "grass",
    "grove",
    "harbor",
    "hill",
    "horizon",
    "iceberg",
    "island",
    "jungle",
    "lagoon",
    "lake",
    "lava",
    "leaf",
    "ledge",
    "light",
    "lotus",
    "magma",
    "marsh",
    "meadow",
    "mesa",
    "meteor",
    "mist",
    "moon",
    "mountain",
    "oasis",
    "ocean",
    "orbit",
    "palm",
    "peak",
    "pebble",
    "pine",
    "planet",
    "plateau",
    "pond",
    "prairie",
    "prism",
    "quartz",
    "rain",
    "rainbow",
    "reef",
    "ridge",
    "river",
    "rock",
    "rose",
    "sand",
    "sea",
    "shore",
    "sky",
    "snow",
    "spark",
    "spring",
    "star",
    "stone",
    "storm",
    "stream",
    "summer",
    "summit",
    "sun",
    "sunbeam",
    "swamp",
    "thunder",
    "tide",
    "tornado",
    "tree",
    "tundra",
    "valley",
    "vista",
    "volcano",
    "water",
    "wave",
    "wind",
    "winter",
  ];

  // Generate a six-digit number (000000-999999)
  const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

  // Randomly select one adjective and one noun
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  // Combine to form the readable ID
  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
}
