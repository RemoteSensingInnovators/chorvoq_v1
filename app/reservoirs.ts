export type ReservoirInfo = {
  id: string;
  name: string;
  shortName: string;
  region: string;
  coordinates: string;
  description: string;
  wikiUrl: string;
  wikiLang?: string;
  wikiTitle?: string;
  commonsQuery: string;
};

const allReservoirs: ReservoirInfo[] = [
  {
    id: "chorvoq",
    name: "Chorvoq Reservoir",
    shortName: "Chorvoq",
    region: "Tashkent Region",
    coordinates: "41.63° N · 70.03° E",
    description: "A mountain reservoir in the western Tian Shan, supplied by the Pskem, Chatkal and Ko‘ksuv rivers and widely used for hydropower, irrigation and recreation.",
    wikiUrl: "https://en.wikipedia.org/wiki/Lake_Charvak",
    wikiLang: "en",
    wikiTitle: "Lake_Charvak",
    commonsQuery: "Lake Charvak Uzbekistan",
  },
  {
    id: "andijon",
    name: "Andijon Reservoir",
    shortName: "Andijon",
    region: "Andijon Region",
    coordinates: "40.77° N · 73.14° E",
    description: "A major transboundary reservoir on the Kara Darya, supporting irrigation across the Fergana Valley and hydroelectric power generation.",
    wikiUrl: "https://en.wikipedia.org/wiki/Andijan_Reservoir",
    wikiLang: "en",
    wikiTitle: "Andijan_Reservoir",
    commonsQuery: "Andijan Reservoir Uzbekistan",
  },
  {
    id: "topalang",
    name: "To‘polang Reservoir",
    shortName: "To‘polang",
    region: "Surxondaryo Region",
    coordinates: "38.65° N · 67.81° E",
    description: "A highland reservoir on the To‘polangdaryo, created for irrigation, drinking-water supply and hydroelectric power in southern Uzbekistan.",
    wikiUrl: "https://ru.wikipedia.org/wiki/%D0%A2%D1%83%D0%BF%D0%B0%D0%BB%D0%B0%D0%BD%D0%B3%D1%81%D0%BA%D0%BE%D0%B5_%D0%B2%D0%BE%D0%B4%D0%BE%D1%85%D1%80%D0%B0%D0%BD%D0%B8%D0%BB%D0%B8%D1%89%D0%B5",
    wikiLang: "ru",
    wikiTitle: "Тупалангское_водохранилище",
    commonsQuery: "Topalang reservoir Uzbekistan",
  },
  {
    id: "kattakurgan",
    name: "Kattaqo‘rg‘on Reservoir",
    shortName: "Kattaqo‘rg‘on",
    region: "Samarqand Region",
    coordinates: "39.79° N · 66.25° E",
    description: "A large reservoir connected to the Zarafshon water system, central to irrigation and seasonal water regulation in the Samarqand region.",
    wikiUrl: "https://en.wikipedia.org/wiki/Kattakurgan_Reservoir",
    wikiLang: "en",
    wikiTitle: "Kattakurgan_Reservoir",
    commonsQuery: "Kattakurgan Reservoir Uzbekistan",
  },
  {
    id: "tuyabugiz",
    name: "Tuyabo‘g‘iz Reservoir",
    shortName: "Tuyabo‘g‘iz",
    region: "Tashkent Region",
    coordinates: "40.96° N · 69.34° E",
    description: "Also known as the Tashkent Sea, this reservoir on the Ohangaron River supplies irrigation water and provides a popular recreation landscape south of Tashkent.",
    wikiUrl: "https://en.wikipedia.org/wiki/Tuyabuguz_Reservoir",
    wikiLang: "en",
    wikiTitle: "Tuyabuguz_Reservoir",
    commonsQuery: "Tuyabuguz Reservoir Uzbekistan",
  },
  {
    id: "ohangaron",
    name: "Ohangaron Reservoir",
    shortName: "Ohangaron",
    region: "Tashkent Region",
    coordinates: "41.06° N · 70.25° E",
    description: "A compact mountain reservoir in the upper Ohangaron basin, used for regulating river flow and supporting water supply and irrigation.",
    wikiUrl: "https://en.wikipedia.org/w/index.php?search=Ohangaron+Reservoir+Uzbekistan",
    commonsQuery: "Ohangaron reservoir Uzbekistan",
  },
  {
    id: "hisorak",
    name: "Hisorak Reservoir",
    shortName: "Hisorak",
    region: "Qashqadaryo Region",
    coordinates: "39.02° N · 67.19° E",
    description: "A reservoir in the Hisor mountain foothills that supports irrigation, river regulation and energy infrastructure in the Qashqadaryo basin.",
    wikiUrl: "https://en.wikipedia.org/w/index.php?search=Hisorak+Reservoir+Uzbekistan",
    commonsQuery: "Hisorak reservoir Uzbekistan",
  },
  {
    id: "pachkamar",
    name: "Pachkamar Reservoir",
    shortName: "Pachkamar",
    region: "Qashqadaryo Region",
    coordinates: "38.53° N · 66.41° E",
    description: "An irrigation reservoir in southern Qashqadaryo, storing seasonal runoff for agriculture and settlements around the G‘uzor area.",
    wikiUrl: "https://en.wikipedia.org/w/index.php?search=Pachkamar+Reservoir+Uzbekistan",
    commonsQuery: "Pachkamar reservoir Uzbekistan",
  },
  {
    id: "chimkurgan",
    name: "Chimqo‘rg‘on Reservoir",
    shortName: "Chimqo‘rg‘on",
    region: "Qashqadaryo Region",
    coordinates: "38.95° N · 66.39° E",
    description: "A regional water-storage basin serving irrigated agriculture and seasonal flow management in the Qashqadaryo lowlands.",
    wikiUrl: "https://en.wikipedia.org/w/index.php?search=Chimkurgan+Reservoir+Uzbekistan",
    commonsQuery: "Chimkurgan reservoir Uzbekistan",
  },
  {
    id: "sardoba",
    name: "Sardoba Reservoir",
    shortName: "Sardoba",
    region: "Sirdaryo Region",
    coordinates: "40.35° N · 68.46° E",
    description: "A large off-channel water-storage facility in the Mirzacho‘l steppe, completed in 2017 and widely known for the 2020 dam failure.",
    wikiUrl: "https://en.wikipedia.org/wiki/Sardoba_Reservoir",
    wikiLang: "en",
    wikiTitle: "Sardoba_Reservoir",
    commonsQuery: "Sardoba Reservoir Uzbekistan",
  },
];

export const reservoirs: ReservoirInfo[] = allReservoirs.filter(item=>item.id==="chorvoq");
