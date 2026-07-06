/**
 * Curated editorial imagery (hotlinked from Wikimedia, verified 2026-07-03).
 * Static constants only — the app never calls third-party APIs at runtime.
 */

/** Hero backdrop: Red Bull RB19 at speed, Austria 2023 (16:9, 1920px). */
export const HERO_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/FIA_F1_Austria_2023_Nr._1_%281%29.jpg/1920px-FIA_F1_Austria_2023_Nr._1_%281%29.jpg";

/* Alternates, if the mood ever needs changing:
 * McLaren MCL38, Zandvoort 2024:
 *   https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3805_by_Stepro.jpg/1920px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3805_by_Stepro.jpg
 * Ferrari SF-24, China 2024:
 *   https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Carlos_Sainz_Chinese_GP_2024.jpg/1920px-Carlos_Sainz_Chinese_GP_2024.jpg
 */

/**
 * Circuit track-layout art keyed by Ergast/Jolpica circuit_ref. Rendered as a
 * decorative white-line backdrop (inverted + masked). Circuits whose Wikipedia
 * lead image is a logo rather than a map are deliberately absent — the UI
 * degrades gracefully without one.
 */
export const CIRCUIT_IMAGES: Record<string, string> = {
  zandvoort: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Zandvoort_Circuit.png/1280px-Zandvoort_Circuit.png",
  albert_park: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Albert_Park_Circuit_2021.svg/1280px-Albert_Park_Circuit_2021.svg.png",
  nurburgring: "https://upload.wikimedia.org/wikipedia/en/thumb/4/49/Nurburgring.svg/1280px-Nurburgring.svg.png",
  ricard: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Le_Castellet_2019_all_layouts.svg/1280px-Le_Castellet_2019_all_layouts.svg.png",
  silverstone: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Silverstone_Circuit_2020.png/1280px-Silverstone_Circuit_2020.png",
  catalunya: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Circuit_de_Catalunya_moto_2021.svg/1280px-Circuit_de_Catalunya_moto_2021.svg.png",
  hungaroring: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hungaroring.svg/1280px-Hungaroring.svg.png",
  monaco: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Monte_Carlo_Formula_1_track_map.svg/1280px-Monte_Carlo_Formula_1_track_map.svg.png",
  suzuka: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Suzuka_circuit_map--2005.svg/1280px-Suzuka_circuit_map--2005.svg.png",
  imola: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Imola_2009.svg/1280px-Imola_2009.svg.png",
  villeneuve: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/%C3%8Ele_Notre-Dame_%28Circuit_Gilles_Villeneuve%29.svg/1280px-%C3%8Ele_Notre-Dame_%28Circuit_Gilles_Villeneuve%29.svg.png",
  hockenheimring: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Hockenheim2012.svg/1280px-Hockenheim2012.svg.png",
  spa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Spa-Francorchamps_of_Belgium.svg/1280px-Spa-Francorchamps_of_Belgium.svg.png",
  shanghai: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Shanghai_International_Racing_Circuit_track_map.svg/1280px-Shanghai_International_Racing_Circuit_track_map.svg.png",
  interlagos: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_%28AKA_Interlagos%29_track_map.svg/1280px-Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_%28AKA_Interlagos%29_track_map.svg.png",
  istanbul: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Istanbul_park.svg/1280px-Istanbul_park.svg.png",
  rodriguez: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg/1280px-Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg.png",
  losail: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Lusail_International_Circuit_2023.svg/1280px-Lusail_International_Circuit_2023.svg.png",
  mugello: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Mugello_Racing_Circuit_track_map_15_turns.svg/1280px-Mugello_Racing_Circuit_track_map_15_turns.svg.png",
  yas_marina: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Yas_Marina_Circuit.png/1280px-Yas_Marina_Circuit.png",
  marina_bay: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Marina_Bay_circuit_2023.svg/1280px-Marina_Bay_circuit_2023.svg.png",
  portimao: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Aut%C3%B3dromo_do_Algarve_F1_Sectors.svg/1280px-Aut%C3%B3dromo_do_Algarve_F1_Sectors.svg.png",
  vegas: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/2023_Las_Vegas_street_circuit.svg/1280px-2023_Las_Vegas_street_circuit.svg.png",
  americas: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Austin_circuit.svg/1280px-Austin_circuit.svg.png",
  sochi: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Sirius_track.jpg",
  baku: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Baku_Formula_One_circuit_map.svg/1280px-Baku_Formula_One_circuit_map.svg.png",
  madring: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Madring_%282026%29.svg/1280px-Madring_%282026%29.svg.png",
};

/**
 * Real photography of the tracks — mostly aerial "SkySat" shots (Wikimedia,
 * verified 2026-07-04), keyed by circuit_ref. Used as the hero imagery on
 * circuit cards / detail and the dashboard's next-race card. Circuits without
 * a good free photo (e.g. Las Vegas street circuit, the new Madring) are
 * intentionally absent and degrade to the track-layout art.
 */
export const CIRCUIT_PHOTOS: Record<string, string> = {
  red_bull_ring: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Red_Bull_Ring%2C_April_18%2C_2018_SkySat.jpg/1280px-Red_Bull_Ring%2C_April_18%2C_2018_SkySat.jpg",
  catalunya: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Circuit_de_Barcelona-Catalunya%2C_April_19%2C_2018_SkySat.jpg/1280px-Circuit_de_Barcelona-Catalunya%2C_April_19%2C_2018_SkySat.jpg",
  silverstone: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Silverstone_Racing_Circuit.jpg/1280px-Silverstone_Racing_Circuit.jpg",
  monza: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Autodromo_Nazionale_Monza%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg/1280px-Autodromo_Nazionale_Monza%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg",
  monaco: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Circuit_de_Monaco%2C_April_1%2C_2018_SkySat_%28cropped%29.jpg",
  spa: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Circuit_de_Spa-Francorchamps%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg/1280px-Circuit_de_Spa-Francorchamps%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg",
  hungaroring: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Hungaroring%2C_April_28%2C_2018_SkySat.jpg/1280px-Hungaroring%2C_April_28%2C_2018_SkySat.jpg",
  albert_park: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Melbourne_Grand_Prix_Circuit%2C_March_22%2C_2018_SkySat_%28cropped%29.jpg/1280px-Melbourne_Grand_Prix_Circuit%2C_March_22%2C_2018_SkySat_%28cropped%29.jpg",
  villeneuve: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Circuit_Gilles-Villeneuve%2C_May_29%2C_2018_SkySat.jpg/1280px-Circuit_Gilles-Villeneuve%2C_May_29%2C_2018_SkySat.jpg",
  yas_marina: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/North_Grandstand_at_the_Yas_Marina_circuit_in_Abu_Dhabi.jpg/1280px-North_Grandstand_at_the_Yas_Marina_circuit_in_Abu_Dhabi.jpg",
  rodriguez: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez%2C_June_4%2C_2018_SkySat.jpg/1280px-Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez%2C_June_4%2C_2018_SkySat.jpg",
  interlagos: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Vista_a%C3%A9rea_del_Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_05.jpg/1280px-Vista_a%C3%A9rea_del_Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_05.jpg",
  americas: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Circuit_of_the_Americas_aerial_view_from_WN4430.jpg/1280px-Circuit_of_the_Americas_aerial_view_from_WN4430.jpg",
  marina_bay: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Marina_Bay_Street_Circuit%2C_May_8%2C_2018_SkySat.jpg/1280px-Marina_Bay_Street_Circuit%2C_May_8%2C_2018_SkySat.jpg",
  suzuka: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Suzuka_Circuit_Aerial_photograph_1987.jpg/1280px-Suzuka_Circuit_Aerial_photograph_1987.jpg",
  baku: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Baku_City_Circuit%2C_April_9%2C_2018_SkySat.jpg/1280px-Baku_City_Circuit%2C_April_9%2C_2018_SkySat.jpg",
  shanghai: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Shanghai_International_Circuit%2C_April_7%2C_2018_SkySat.jpg/1280px-Shanghai_International_Circuit%2C_April_7%2C_2018_SkySat.jpg",
  zandvoort: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Circuit_Park_Zandvoort_aerial_photo.jpg/1280px-Circuit_Park_Zandvoort_aerial_photo.jpg",
  miami: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Start_of_the_Porsche_Sprint_Challenge_North_America_at_the_F1_Miami_GP_-_2022.jpg/1280px-Start_of_the_Porsche_Sprint_Challenge_North_America_at_the_F1_Miami_GP_-_2022.jpg",
  losail: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/WTCC_2016%2C_Qatar.jpg/1280px-WTCC_2016%2C_Qatar.jpg",
};

/**
 * Short, muted, hotlinked video clips keyed by Ergast/Jolpica driver_ref, used
 * as living portrait tiles (e.g. the Compare page). Free per-driver footage
 * barely exists — Wikimedia Commons only has a handful of clips — so this map
 * is intentionally sparse. Any driver_ref NOT present here falls back to a
 * cinematic still (their headshot with a slow pan). To add a driver, drop in a
 * direct .webm/.mp4 URL; the DriverVideoTile handles the rest automatically.
 */
export const DRIVER_VIDEOS: Record<string, string> = {
  // Max Verstappen — Red Bull Fan Zone, Melbourne 2024 (Wikimedia Commons, CC).
  max_verstappen:
    "https://upload.wikimedia.org/wikipedia/commons/4/47/Max_Verstappen_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7670%29.webm",
};

