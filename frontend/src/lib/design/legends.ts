/**
 * Editorial content for the Hall of Fame — curated by hand, not generated
 * from the database. Portraits and race photography are hotlinked from
 * Wikimedia (verified 2026-07-04). Championship counts here are all-time
 * career facts; the records section below the fold stays scoped to the
 * ingested era and says so.
 */

export interface Legend {
  ref: string; // driver_ref (all exist in the drivers table)
  name: string;
  epithet: string; // "The Rain Master"
  years: string;
  titles: number;
  nationality: string;
  bio: string; // one editorial sentence
  portrait: string;
  mono?: boolean; // render black & white
  eraData: boolean; // true → /drivers/{ref} has real stats; false → link out to Wikipedia
  wiki: string;
}

export const LEGENDS: Legend[] = [
  {
    ref: "fangio",
    name: "Juan Manuel Fangio",
    epithet: "El Maestro",
    years: "1950 – 1958",
    titles: 5,
    nationality: "Argentine",
    bio: "Five championships with four different teams — a feat no one has matched since.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Fangio_in_1955_%28cropped%29.jpg/500px-Fangio_in_1955_%28cropped%29.jpg",
    mono: true,
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Juan_Manuel_Fangio",
  },
  {
    ref: "clark",
    name: "Jim Clark",
    epithet: "The Natural",
    years: "1960 – 1968",
    titles: 2,
    nationality: "British",
    bio: "So smooth he made a Lotus dance. His rivals measured themselves against him alone.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Jim_Clark_in_1963_%28cropped%29.JPG/500px-Jim_Clark_in_1963_%28cropped%29.JPG",
    mono: true,
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Jim_Clark",
  },
  {
    ref: "stewart",
    name: "Jackie Stewart",
    epithet: "The Flying Scot",
    years: "1965 – 1973",
    titles: 3,
    nationality: "British",
    bio: "Three crowns in the deadliest era — then he spent a lifetime making the sport safer.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jackie_Stewart_at_the_2014_WEC_Silverstone_round.jpg/500px-Jackie_Stewart_at_the_2014_WEC_Silverstone_round.jpg",
    mono: true,
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Jackie_Stewart",
  },
  {
    ref: "lauda",
    name: "Niki Lauda",
    epithet: "The Comeback King",
    years: "1971 – 1985",
    titles: 3,
    nationality: "Austrian",
    bio: "Forty-two days after the fire at the Nürburgring, he was back in the car.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Lauda_at_1982_Dutch_Grand_Prix.jpg/500px-Lauda_at_1982_Dutch_Grand_Prix.jpg",
    mono: true,
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Niki_Lauda",
  },
  {
    ref: "prost",
    name: "Alain Prost",
    epithet: "The Professor",
    years: "1980 – 1993",
    titles: 4,
    nationality: "French",
    bio: "Won championships with his head as much as his hands — precision over drama, always.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Festival_automobile_international_2015_-_Photocall_-_065_%28cropped3%29.jpg/500px-Festival_automobile_international_2015_-_Photocall_-_065_%28cropped3%29.jpg",
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Alain_Prost",
  },
  {
    ref: "senna",
    name: "Ayrton Senna",
    epithet: "The Rain Master",
    years: "1984 – 1994",
    titles: 3,
    nationality: "Brazilian",
    bio: "Six wins around Monaco, untouchable in the wet, and gone far too soon.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/6/65/Ayrton_Senna_9_%28cropped%29.jpg",
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Ayrton_Senna",
  },
  {
    ref: "michael_schumacher",
    name: "Michael Schumacher",
    epithet: "The Ferrari Icon",
    years: "1991 – 2012",
    titles: 7,
    nationality: "German",
    bio: "Rebuilt Ferrari in his image and delivered five straight titles in red.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Ferrari_Vodafone_Schumacher_%282%29.jpg/960px-Ferrari_Vodafone_Schumacher_%282%29.jpg",
    eraData: false,
    wiki: "https://en.wikipedia.org/wiki/Michael_Schumacher",
  },
  {
    ref: "alonso",
    name: "Fernando Alonso",
    epithet: "El Nano",
    years: "2001 – present",
    titles: 2,
    nationality: "Spanish",
    bio: "Two decades in, still extracting more from a car than it has any right to give.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Alonso-68_%2824710447098%29.jpg/500px-Alonso-68_%2824710447098%29.jpg",
    eraData: true,
    wiki: "https://en.wikipedia.org/wiki/Fernando_Alonso",
  },
  {
    ref: "vettel",
    name: "Sebastian Vettel",
    epithet: "The Youngest Champion",
    years: "2007 – 2022",
    titles: 4,
    nationality: "German",
    bio: "Four consecutive titles before turning 27 — then grace in how he let them go.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg/500px-Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg",
    eraData: true,
    wiki: "https://en.wikipedia.org/wiki/Sebastian_Vettel",
  },
  {
    ref: "hamilton",
    name: "Lewis Hamilton",
    epithet: "The Seven-Time Champion",
    years: "2007 – present",
    titles: 7,
    nationality: "British",
    bio: "More wins and more poles than anyone in history, and still hungry in scarlet.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg",
    eraData: true,
    wiki: "https://en.wikipedia.org/wiki/Lewis_Hamilton",
  },
  {
    ref: "max_verstappen",
    name: "Max Verstappen",
    epithet: "The Flying Dutchman",
    years: "2015 – present",
    titles: 4,
    nationality: "Dutch",
    bio: "Youngest race winner ever, relentless at the front, and rewriting the record book.",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg",
    eraData: true,
    wiki: "https://en.wikipedia.org/wiki/Max_Verstappen",
  },
];

export interface Moment {
  title: string;
  year: string;
  line: string;
  photo: string;
  wiki: string;
}

export const MOMENTS: Moment[] = [
  {
    title: "Senna, Untouchable",
    year: "1991",
    line: "Streets or storms, it didn't matter — when Senna committed, the gap existed.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Ayrton_Senna_McLaren_MP4-6_1991_United_States.jpg/960px-Ayrton_Senna_McLaren_MP4-6_1991_United_States.jpg",
    wiki: "https://en.wikipedia.org/wiki/Ayrton_Senna",
  },
  {
    title: "The Seventh Crown",
    year: "2004",
    line: "Schumacher's final title — 13 wins in a season the rest of the grid barely saw him.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Michael_Schumacher_Ferrari_2004.jpg/960px-Michael_Schumacher_Ferrari_2004.jpg",
    wiki: "https://en.wikipedia.org/wiki/2004_Formula_One_World_Championship",
  },
  {
    title: "Lauda's Return",
    year: "1976",
    line: "Six weeks after last rites were read, he finished fourth at Monza. Enough said.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Niki_Lauda_1976_British_Grand_Prix.jpg/960px-Niki_Lauda_1976_British_Grand_Prix.jpg",
    wiki: "https://en.wikipedia.org/wiki/Niki_Lauda",
  },
  {
    title: "Prost vs Senna",
    year: "1988",
    line: "One team, two geniuses, fifteen wins from sixteen races — and a rivalry for the ages.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Honda_RACING_Gallery_1988_McLaren_MP4-4_Ayrton_Senna.jpg/960px-Honda_RACING_Gallery_1988_McLaren_MP4-4_Ayrton_Senna.jpg",
    wiki: "https://en.wikipedia.org/wiki/1988_Formula_One_World_Championship",
  },
  {
    title: "The Last Corner",
    year: "2008",
    line: "Hamilton's first championship, won at the final corner of the final lap in São Paulo.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Lewis_Hamilton%2C_McLaren_MP4-23_Mercedes-Benz.jpg/960px-Lewis_Hamilton%2C_McLaren_MP4-23_Mercedes-Benz.jpg",
    wiki: "https://en.wikipedia.org/wiki/2008_Brazilian_Grand_Prix",
  },
  {
    title: "A New Era Begins",
    year: "2021",
    line: "Verstappen's first crown, decided on the very last lap of the very last race.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Max_Verstappen_%28Austin_2021%29.jpg/960px-Max_Verstappen_%28Austin_2021%29.jpg",
    wiki: "https://en.wikipedia.org/wiki/2021_Abu_Dhabi_Grand_Prix",
  },
];

export const QUOTES = [
  {
    text: "If you no longer go for a gap that exists, you are no longer a racing driver.",
    author: "Ayrton Senna",
  },
  {
    text: "The secret is to win going as slowly as possible.",
    author: "Niki Lauda",
  },
];

export interface Decade {
  label: string;
  era: string;
  blurb: string;
  featured: string[]; // legend refs
}

export const DECADES: Decade[] = [
  { label: "1950s", era: "The Pioneers", blurb: "Front-engined monsters on public roads. Fangio takes five titles with four different teams and sets a bar that stands for half a century.", featured: ["fangio"] },
  { label: "1960s", era: "The Garagistes", blurb: "Britain's small constructors rewrite the rules. Jim Clark and Lotus make genius look effortless.", featured: ["clark"] },
  { label: "1970s", era: "Speed & Consequence", blurb: "Wings, slicks and terrible danger. Stewart fights for safety; Lauda walks through fire — literally — and returns.", featured: ["stewart", "lauda"] },
  { label: "1980s", era: "Turbo Titans", blurb: "1,400 horsepower in qualifying trim. Prost's precision against Senna's fury, together at McLaren, splits the sport in two.", featured: ["prost", "senna"] },
  { label: "1990s", era: "Science of Speed", blurb: "Active suspension, telemetry, tragedy at Imola. Schumacher emerges as the sport's next force of nature.", featured: ["senna", "michael_schumacher"] },
  { label: "2000s", era: "The Red Dynasty", blurb: "Ferrari and Schumacher win five straight. Then a 24-year-old Spaniard ends the reign.", featured: ["michael_schumacher", "alonso"] },
  { label: "2010s", era: "Hybrid Supremacy", blurb: "Vettel's four in a row for Red Bull, then Mercedes and Hamilton turn dominance into an art form.", featured: ["vettel", "hamilton"] },
  { label: "2020s", era: "The Changing of the Guard", blurb: "Verstappen against Hamilton in the closest fight in decades — and a new generation arriving fast.", featured: ["max_verstappen", "hamilton"] },
];

/** Mini portraits for record holders (drivers table headshots), keyed by ref. */
export const RECORD_PORTRAITS: Record<string, string> = {
  hamilton: "https://upload.wikimedia.org/wikipedia/commons/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg",
  max_verstappen: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg",
  rosberg: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Nico_Rosberg_2016.jpg/500px-Nico_Rosberg_2016.jpg",
  antonelli: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Kimi_Antonelli_at_the_2025_US_Grand_Prix_in_Austin%2C_TX_%28cropped%29.jpg/500px-Kimi_Antonelli_at_the_2025_US_Grand_Prix_in_Austin%2C_TX_%28cropped%29.jpg",
  bottas: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg/500px-Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg",
  leclerc: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg",
  norris: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg",
  perez: "https://upload.wikimedia.org/wikipedia/commons/5/55/2021_US_GP_driver_parade_%28cropped2%29.jpg",
  sainz: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg/500px-Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg",
  vettel: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg/500px-Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg",
};
