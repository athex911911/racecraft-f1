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
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Michael_Schumacher_2010_Malaysia.jpg/960px-Michael_Schumacher_2010_Malaysia.jpg",
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

/* ---- Documentary chapters: one legend per full screen ---- */

export interface Stat {
  icon: "trophy" | "wins" | "poles" | "fl" | "podiums";
  value: string;
  label: string;
  sub?: string;
}

export interface Chapter {
  ref: string;
  first: string;
  last: string;
  epithet: string;
  era: string;
  eraTitle: string;
  years: string;
  nationality: string;
  titles: number;
  accent: string; // per-legend accent colour
  bio: string;
  standfirst: string; // bold editorial intro
  body: string[]; // article paragraphs
  portrait: string;
  action: string; // race/action photograph (their car)
  quote: string;
  stats: Stat[];
  eraData: boolean;
  wiki: string;
}

const byRef = (ref: string) => LEGENDS.find((l) => l.ref === ref)!;

export const CHAPTERS: Chapter[] = [
  {
    ref: "senna",
    first: "Ayrton",
    last: "Senna",
    epithet: "The Rain Master",
    accent: "#E8B54D",
    era: "The 1980s",
    eraTitle: "The Rise of a Legend",
    years: "1984 – 1994",
    nationality: "Brazilian",
    titles: 3,
    bio: "Mercurial, magnetic, untouchable in the wet. Ayrton Senna didn't just drive Formula One — he transcended it. Three titles, a rivalry that split the sport, and a mystique that has never faded.",
    standfirst:
      "He drove as if the car were an extension of his will, and raced as if the result were already written. Three decades on, Ayrton Senna remains the standard against which genius is measured.",
    body: [
      "There was the speed, and then there was everything else. In the wet at Donington in 1993 he passed four cars on the opening lap and simply vanished up the road, turning a grand prix into a private demonstration. The myth was never only about lap times — it was the intensity, the introspection, the sense of a man reaching for something beyond the sport.",
      "His rivalry with Alain Prost split Formula One down the middle and defined an era. Six victories through the walls of Monaco earned him a throne that has never truly been vacated. When he was lost at Imola in 1994, the sport changed forever: safer, more sombre, and forever aware of what it had been given, and what it had taken away.",
    ],
    portrait: byRef("senna").portrait,
    action: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Ayrton_Senna_McLaren_MP4-6_1991_United_States.jpg/1280px-Ayrton_Senna_McLaren_MP4-6_1991_United_States.jpg",
    quote: "If you no longer go for a gap that exists, you are no longer a racing driver.",
    stats: [
      { icon: "trophy", value: "3", label: "World Championships", sub: "1988, 1990, 1991" },
      { icon: "wins", value: "41", label: "Grand Prix Wins" },
      { icon: "poles", value: "65", label: "Pole Positions" },
      { icon: "fl", value: "19", label: "Fastest Laps" },
    ],
    eraData: false,
    wiki: byRef("senna").wiki,
  },
  {
    ref: "michael_schumacher",
    first: "Michael",
    last: "Schumacher",
    epithet: "The Ferrari Icon",
    accent: "#DC0000",
    era: "The 1990s",
    eraTitle: "The Ferrari Revolution",
    years: "1991 – 2012",
    nationality: "German",
    titles: 7,
    bio: "He arrived and rewrote what was possible. Michael Schumacher dragged Ferrari back to the summit and kept it there — five titles in a row, delivered with a relentlessness the sport had never seen.",
    standfirst:
      "He arrived with a reputation and left with the record books rewritten. Michael Schumacher didn't just win with Ferrari — he built a machine, in every sense, and made it invincible.",
    body: [
      "Before Schumacher, Ferrari had waited twenty-one years for a drivers' title. He ended the drought, then turned scarcity into surplus: five championships in a row between 2000 and 2004, a level of dominance the sport had never witnessed. He drove every lap of every session as though it were qualifying, and demanded the same of everyone around him.",
      "The numbers — ninety-one wins, sixty-eight poles, seven crowns — barely capture the relentlessness. He rebuilt a team in his own image: methodical, obsessive, unbreakable. Critics pointed to the ruthlessness; history points to the results. When he finally walked away, he left behind not just trophies, but a template every champion since has tried to follow.",
    ],
    portrait: byRef("michael_schumacher").portrait,
    action: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Michael_Schumacher_Ferrari_2004.jpg/1280px-Michael_Schumacher_Ferrari_2004.jpg",
    quote: "Once something is a passion, the motivation is there.",
    stats: [
      { icon: "trophy", value: "7", label: "World Championships", sub: "1994, 1995, 2000–2004" },
      { icon: "wins", value: "91", label: "Grand Prix Wins" },
      { icon: "poles", value: "68", label: "Pole Positions" },
      { icon: "fl", value: "77", label: "Fastest Laps" },
    ],
    eraData: false,
    wiki: byRef("michael_schumacher").wiki,
  },
  {
    ref: "hamilton",
    first: "Lewis",
    last: "Hamilton",
    epithet: "The Record Breaker",
    accent: "#00D2BE",
    era: "The 2010s",
    eraTitle: "The Hybrid Era",
    years: "2007 – present",
    nationality: "British",
    titles: 7,
    bio: "From a go-kart track in Stevenage to the top of every record book. Lewis Hamilton turned relentless excellence into an art form — and became the most successful driver the sport has ever seen.",
    standfirst:
      "From a council estate in Stevenage to the summit of every record that matters. Lewis Hamilton turned relentless self-belief into the most decorated career the sport has ever seen.",
    body: [
      "He won in his first season and never stopped. Where others peaked and faded, Hamilton kept finding another gear — reinventing himself through rule changes, teammates and eras, until the all-time records for wins and pole positions simply belonged to him. On his day, in the wet or under pressure, he remains untouchable.",
      "The legacy runs beyond the track. Hamilton used the biggest platform in motorsport to push the sport to look more like the world it races through. Seven titles tie the record; the influence is his alone. Now, in Ferrari red, he chases the number that would put him beyond everyone — an eighth.",
    ],
    portrait: byRef("hamilton").portrait,
    action: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Lewis_Hamilton%2C_McLaren_MP4-23_Mercedes-Benz.jpg/1280px-Lewis_Hamilton%2C_McLaren_MP4-23_Mercedes-Benz.jpg",
    quote: "Still I rise.",
    stats: [
      { icon: "trophy", value: "7", label: "World Championships", sub: "2008, 2014–15, 2017–20" },
      { icon: "wins", value: "105", label: "Grand Prix Wins" },
      { icon: "poles", value: "104", label: "Pole Positions" },
      { icon: "podiums", value: "202", label: "Podium Finishes" },
    ],
    eraData: true,
    wiki: byRef("hamilton").wiki,
  },
  {
    ref: "vettel",
    first: "Sebastian",
    last: "Vettel",
    epithet: "The Red Bull Reign",
    accent: "#5E8BD8",
    era: "The Red Bull Years",
    eraTitle: "Four in a Row",
    years: "2007 – 2022",
    nationality: "German",
    titles: 4,
    bio: "Four titles before most drivers find their feet. Sebastian Vettel and Red Bull owned the early 2010s with pole after pole — then he showed the grid how to lose, and lead, with grace.",
    standfirst:
      "Four titles before most drivers find their rhythm — then a second act defined by grace. Sebastian Vettel was the prodigy who grew into the sport's conscience.",
    body: [
      "In the early 2010s, Red Bull and Vettel were a metronome of dominance: pole, lights, gone. Four consecutive championships, the last sealed with nine straight wins, made him the youngest quadruple champion in history. He drove with a joy that spilled over the radio, naming his cars and celebrating like a fan who couldn't believe his luck.",
      "When the winning slowed, the man grew. Vettel became a statesman of the paddock — thoughtful, principled, unafraid to speak. He lost with the same dignity he had won with, and left the sport better than he found it. Fifty-three victories tell one story; the respect of everyone he raced tells a richer one.",
    ],
    portrait: byRef("vettel").portrait,
    action: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Formula_One_Grand_Prix_Singapore_2013_-_Sebastian_Vettel_in_Red_Bull_Renault_1.jpg/1280px-Formula_One_Grand_Prix_Singapore_2013_-_Sebastian_Vettel_in_Red_Bull_Renault_1.jpg",
    quote: "In the end, you always race against yourself.",
    stats: [
      { icon: "trophy", value: "4", label: "World Championships", sub: "2010–2013" },
      { icon: "wins", value: "53", label: "Grand Prix Wins" },
      { icon: "poles", value: "57", label: "Pole Positions" },
      { icon: "fl", value: "38", label: "Fastest Laps" },
    ],
    eraData: true,
    wiki: byRef("vettel").wiki,
  },
  {
    ref: "alonso",
    first: "Fernando",
    last: "Alonso",
    epithet: "The Relentless One",
    accent: "#E6A817",
    era: "The 2000s",
    eraTitle: "Ending the Dynasty",
    years: "2001 – present",
    nationality: "Spanish",
    titles: 2,
    bio: "Two decades at the sharp end, extracting the impossible from every car he has touched. Fernando Alonso ended Ferrari's reign as the sport's youngest champion — and is still the benchmark for racing intelligence.",
    standfirst:
      "Two titles, two decades, and a competitive fire that refuses to cool. Fernando Alonso is the benchmark against which racecraft itself is measured.",
    body: [
      "In 2005, a twenty-four-year-old Spaniard did what no one had managed: he ended Schumacher and Ferrari's reign, and did it again the year after. It should have been the beginning of a dynasty. Instead it became the opening chapter of the sport's great what-if — a career of brilliance often spent in cars unworthy of it.",
      "And still he stays, because the alternative is unthinkable to him. More than twenty seasons in, Alonso remains a reference point for wheel-to-wheel genius, dragging results from machinery that has no business delivering them. The titles number two; the talent has always suggested far more.",
    ],
    portrait: byRef("alonso").portrait,
    action: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Fernando_Alonso_-_Renault_R26_-_Monaco_Grand_Prix_2006.jpg/1280px-Fernando_Alonso_-_Renault_R26_-_Monaco_Grand_Prix_2006.jpg",
    quote: "I race to win, not to take part.",
    stats: [
      { icon: "trophy", value: "2", label: "World Championships", sub: "2005, 2006" },
      { icon: "wins", value: "32", label: "Grand Prix Wins" },
      { icon: "poles", value: "22", label: "Pole Positions" },
      { icon: "podiums", value: "106", label: "Podium Finishes" },
    ],
    eraData: true,
    wiki: byRef("alonso").wiki,
  },
  {
    ref: "max_verstappen",
    first: "Max",
    last: "Verstappen",
    epithet: "The New Generation",
    accent: "#E10600",
    era: "The 2020s",
    eraTitle: "The Changing of the Guard",
    years: "2015 – present",
    nationality: "Dutch",
    titles: 4,
    bio: "Fearless from the very first lap. Max Verstappen became the youngest race winner in history, then turned raw speed into total domination — and he is only getting started.",
    standfirst:
      "Fearless from his very first lap, ruthless ever since. Max Verstappen turned raw, generational speed into total domination — and he is only getting started.",
    body: [
      "He became the youngest race winner in history on his Red Bull debut, and spent the years since making the extraordinary look routine. The 2021 title, decided on the final lap of the final race, announced a new era. What followed was a demonstration: nineteen wins in a single season, records tumbling, a driver operating in a category of his own.",
      "There is no wasted motion, no obvious weakness — just speed, aggression and an almost unnerving certainty. Rivals talk of racing for second. At an age when many are still learning, Verstappen is already among the most complete drivers the sport has produced, and the record book is his to fill.",
    ],
    portrait: byRef("max_verstappen").portrait,
    action: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Max_Verstappen_%28Austin_2021%29.jpg/1280px-Max_Verstappen_%28Austin_2021%29.jpg",
    quote: "You have to risk it to get the biscuit.",
    stats: [
      { icon: "trophy", value: "4", label: "World Championships", sub: "2021–2024" },
      { icon: "wins", value: "63", label: "Grand Prix Wins" },
      { icon: "poles", value: "44", label: "Pole Positions" },
      { icon: "podiums", value: "112", label: "Podium Finishes" },
    ],
    eraData: true,
    wiki: byRef("max_verstappen").wiki,
  },
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
