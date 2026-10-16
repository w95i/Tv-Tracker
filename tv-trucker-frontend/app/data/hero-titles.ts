// Titles in the hero carousel. Generated from the TVTracker API (tvtracker.tv/api/v1/media) on 2026-10-15.
// Order is the fan, left to right; the "center" one starts hidden behind the phone.
// Backdrops: public/images/titles/<id>/backdrop.jpg (TMDB). Posters: the fan's own pictures.

export interface HeroTitleText {
  title: string;
  tagline: string;
  overview: string;
  genres: string[];
}

export interface HeroTitle {
  id: string;
  kind: "show" | "movie";
  tmdbId: number;
  poster: string;
  backdrop: string;
  certification: string | null;
  year: number | null;
  /** Shows that have ended or were canceled */
  endYear: number | null;
  /** Movies, in minutes */
  runtime: number | null;
  status: "returning" | "ended" | "canceled" | "inProduction" | null;
  wins: number | null;
  ratings: { app: number | null; appCount: number | null; imdb: number | null; imdbVotes: number | null; rottenTomatoes: number | null; metacritic: number | null };
  en: HeroTitleText;
  ar: HeroTitleText;
}

export const heroTitles: HeroTitle[] = [
  {
    "id": "house-of-the-dragon",
    "kind": "show",
    "tmdbId": 94997,
    "poster": "/images/posters/fan-left-4.jpg",
    "backdrop": "/images/titles/house-of-the-dragon/backdrop.jpg",
    "certification": "TV-MA",
    "year": 2022,
    "endYear": null,
    "runtime": null,
    "status": "returning",
    "wins": 23,
    "ratings": {
      "app": 7.2,
      "appCount": 459,
      "imdb": 8.2,
      "imdbVotes": 573641,
      "rottenTomatoes": null,
      "metacritic": null
    },
    "en": {
      "title": "House of the Dragon",
      "tagline": "Win or die.",
      "overview": "The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from such heights. In the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition by naming his daughter Rhaenyra heir to the Iron Throne. But when Viserys later fathers a son, the court is shocked when Rhaenyra retains her status as his heir, and seeds of division sow friction across the realm.",
      "genres": [
        "Sci-Fi & Fantasy",
        "Drama",
        "Action & Adventure"
      ]
    },
    "ar": {
      "title": "آل التنين",
      "tagline": "إمّا النصر... أو الموت.",
      "overview": "تدور الأحداث قبل 200 عام من أحداث مسلسل صراع العروش. حيث سيركز على تفاصيل عائلة \"آل تارغيريان\" ولمحات هامة في تاريخ العائلة التي حكمت ويستروس منذ زمن بعيد، وصولًا إلى رقصة التنانين والصراعات الداخلية في العائلة التي دمرت كل شيء وهددت بانقراض التنانين للأبد.",
      "genres": [
        "خيال علمي وفانتازيا",
        "دراما",
        "حركة ومغامرة"
      ]
    }
  },
  {
    "id": "the-boys",
    "kind": "show",
    "tmdbId": 76479,
    "poster": "/images/posters/fan-left-3.jpg",
    "backdrop": "/images/titles/the-boys/backdrop.jpg",
    "certification": "TV-MA",
    "year": 2019,
    "endYear": 2026,
    "runtime": null,
    "status": "ended",
    "wins": 31,
    "ratings": {
      "app": 6.8,
      "appCount": 487,
      "imdb": 8.5,
      "imdbVotes": 1030151,
      "rottenTomatoes": null,
      "metacritic": null
    },
    "en": {
      "title": "The Boys",
      "tagline": "Never meet your heroes.",
      "overview": "A group of vigilantes known informally as “The Boys” set out to take down corrupt superheroes with no more than blue-collar grit and a willingness to fight dirty.",
      "genres": [
        "Sci-Fi & Fantasy",
        "Action & Adventure"
      ]
    },
    "ar": {
      "title": "الرفاق",
      "tagline": "لا تلتقي أبطالك أبدًا.",
      "overview": "يعيش هيوي كامبل حياة هادئة إلى أن يفقد الشخص الذي يحبه في حادث مأساوي يتسبب فيه أحد الأبطال الخارقين، فيكتشف أن أصحاب القدرات الخارقة ليسوا أبطالًا مثاليين كما يعتقد الناس. يلتقي هيوي ببيلي بوتشر، الذي يقوده إلى مجموعة سرية تُعرف باسم الرفاق، مهمتها كشف فساد الأبطال الخارقين ومحاسبتهم. وفي الجهة الأخرى، يواجه هوملاندر ضغوطًا متزايدة للحفاظ على صورته المثالية أمام الجمهور. ومع تصاعد المواجهة بين الطرفين، تنكشف أسرار خطيرة تهدد بتغيير عالم الأبطال الخارقين بالكامل.",
      "genres": [
        "خيال علمي وفانتازيا",
        "حركة ومغامرة"
      ]
    }
  },
  {
    "id": "game-of-thrones",
    "kind": "show",
    "tmdbId": 1399,
    "poster": "/images/posters/fan-left-2.jpg",
    "backdrop": "/images/titles/game-of-thrones/backdrop.jpg",
    "certification": "TV-MA",
    "year": 2011,
    "endYear": 2019,
    "runtime": null,
    "status": "ended",
    "wins": 396,
    "ratings": {
      "app": 7.8,
      "appCount": 827,
      "imdb": 9.2,
      "imdbVotes": 2671155,
      "rottenTomatoes": null,
      "metacritic": null
    },
    "en": {
      "title": "Game of Thrones",
      "tagline": "Winter is coming.",
      "overview": "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond.",
      "genres": [
        "Sci-Fi & Fantasy",
        "Drama",
        "Action & Adventure"
      ]
    },
    "ar": {
      "title": "صراع العروش",
      "tagline": "الشتاء قادم.",
      "overview": "تتنافس سبع عائلات نبيلة للسيطرة على العرش الحديدي وحكم ممالك ويستروس، وسط مؤامرات سياسية وتحالفات متغيرة وحروب دامية تهدد بتغيير موازين القوى. وبينما ينخرط آل ستارك ولانستر وتارغاريان وغيرهم في صراع شرس على السلطة، يظهر تهديد قديم في أقصى الشمال مع اقتراب جيش الموتى من الجدار. وفي الوقت نفسه، تسعى دنيرس تارغاريان إلى استعادة العرش الذي تعتبره حقًا لعائلتها، فتبدأ رحلة طويلة لبناء قوتها وجيشها. ومع تصاعد الصراعات، يجد الجميع أنفسهم أمام معركة أكبر من مجرد صراع على الحكم.",
      "genres": [
        "خيال علمي وفانتازيا",
        "دراما",
        "حركة ومغامرة"
      ]
    }
  },
  {
    "id": "the-last-of-us",
    "kind": "show",
    "tmdbId": 100088,
    "poster": "/images/posters/fan-left-1.jpg",
    "backdrop": "/images/titles/the-last-of-us/backdrop.jpg",
    "certification": "TV-MA",
    "year": 2023,
    "endYear": null,
    "runtime": null,
    "status": "returning",
    "wins": 110,
    "ratings": {
      "app": 6.7,
      "appCount": 249,
      "imdb": 8.4,
      "imdbVotes": 749733,
      "rottenTomatoes": null,
      "metacritic": null
    },
    "en": {
      "title": "The Last of Us",
      "tagline": "Every path has a price.",
      "overview": "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey, as they both must traverse the United States and depend on each other for survival.",
      "genres": [
        "Drama"
      ]
    },
    "ar": {
      "title": "ما تبقى منا",
      "tagline": "عندما تضيع في الظلام، ابحث عن النور.",
      "overview": "تدور الأحداث حول جويل الذي فقد ابنته في أعقاب انهيار العالم أمام فايروس خطير يحول البشر إلى وحوش قاتلة، ليجد جويل نفسه مجبرًا على مساعدة إيلي البالغة من العمر 14 عامًا على الهروب من أيدي العصابات والموتى.",
      "genres": [
        "دراما"
      ]
    }
  },
  {
    "id": "silo",
    "kind": "show",
    "tmdbId": 125988,
    "poster": "/images/posters/fan-left-0.jpg",
    "backdrop": "/images/titles/silo/backdrop.jpg",
    "certification": "TV-MA",
    "year": 2023,
    "endYear": null,
    "runtime": null,
    "status": "returning",
    "wins": 5,
    "ratings": {
      "app": 7.6,
      "appCount": 278,
      "imdb": 8.1,
      "imdbVotes": 247661,
      "rottenTomatoes": null,
      "metacritic": null
    },
    "en": {
      "title": "Silo",
      "tagline": "The key to the future lies in the past.",
      "overview": "In a ruined and toxic future, thousands live in a giant silo deep underground. After its sheriff breaks a cardinal rule and residents die mysteriously, engineer Juliette starts to uncover shocking secrets and the truth about the silo.",
      "genres": [
        "Sci-Fi & Fantasy",
        "Drama"
      ]
    },
    "ar": {
      "title": "Silo",
      "tagline": "في الماضي تكمن الحقيقة.",
      "overview": "في مستقبل خرب وسامّ، يعيش آلاف الناس في صومعة ضخمة تحت الأرض. بعد أن يخرق مأمورهم قانونها الأساسي ويموت المواطنون بطرق غامضة، تبدأ المهندسة \"جولييت\" بكشف أسرار صادمة لتعرف الحقيقة عن الصومعة.",
      "genres": [
        "خيال علمي وفانتازيا",
        "دراما"
      ]
    }
  },
  {
    "id": "severance",
    "kind": "show",
    "tmdbId": 95396,
    "poster": "/images/posters/fan-center.jpg",
    "backdrop": "/images/titles/severance/backdrop.jpg",
    "certification": "TV-MA",
    "year": 2022,
    "endYear": null,
    "runtime": null,
    "status": "returning",
    "wins": 51,
    "ratings": {
      "app": 7.3,
      "appCount": 170,
      "imdb": 8.6,
      "imdbVotes": 410618,
      "rottenTomatoes": null,
      "metacritic": null
    },
    "en": {
      "title": "Severance",
      "tagline": "There's more to work than life.",
      "overview": "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
      "genres": [
        "Drama",
        "Mystery",
        "Sci-Fi & Fantasy"
      ]
    },
    "ar": {
      "title": "Severance",
      "tagline": "الحياة تنتهي والعمل لا ينتهي.",
      "overview": "يقود \"مارك\" فريقاً من عمّال المكاتب الذين قُسّمت ذكرياتهم جراحياً بين أعمالهم وحيواتهم الشخصية. حين يظهر زميل غامض خارج العمل، تبدأ رحلة لاكتشاف حقيقة وظائفهم.",
      "genres": [
        "دراما",
        "غموض",
        "خيال علمي وفانتازيا"
      ]
    }
  },
  {
    "id": "dune-part-two",
    "kind": "movie",
    "tmdbId": 693134,
    "poster": "/images/posters/fan-right-0.jpg",
    "backdrop": "/images/titles/dune-part-two/backdrop.jpg",
    "certification": "PG-13",
    "year": 2024,
    "endYear": null,
    "runtime": 167,
    "status": null,
    "wins": 126,
    "ratings": {
      "app": 7.7,
      "appCount": 41,
      "imdb": 8.4,
      "imdbVotes": 797737,
      "rottenTomatoes": 92,
      "metacritic": 79
    },
    "en": {
      "title": "Dune: Part Two",
      "tagline": "Long live the fighters.",
      "overview": "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, Paul endeavors to prevent a terrible future only he can foresee.",
      "genres": [
        "Science Fiction",
        "Adventure"
      ]
    },
    "ar": {
      "title": "كثيب: القسم الثاني",
      "tagline": "يحيا المحاربون",
      "overview": "تابع الرحلة الأسطورية لبول أتريدس وهو يتحد مع تشاني وفريمن أثناء وجوده في طريق حربي للانتقام من المتآمرين الذين دمروا عائلته. في مواجهة الاختيار بين حب حياته ومصير الكون المعروف ، يسعى بولس إلى منع مستقبل رهيب لا يستطيع التنبؤ به سواه.",
      "genres": [
        "خيال علمي",
        "مغامرة"
      ]
    }
  },
  {
    "id": "oppenheimer",
    "kind": "movie",
    "tmdbId": 872585,
    "poster": "/images/posters/fan-right-1.jpg",
    "backdrop": "/images/titles/oppenheimer/backdrop.jpg",
    "certification": "R",
    "year": 2023,
    "endYear": null,
    "runtime": 181,
    "status": null,
    "wins": 370,
    "ratings": {
      "app": 7.6,
      "appCount": 49,
      "imdb": 8.2,
      "imdbVotes": 1103487,
      "rottenTomatoes": 93,
      "metacritic": 90
    },
    "en": {
      "title": "Oppenheimer",
      "tagline": "The world forever changes.",
      "overview": "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
      "genres": [
        "Drama",
        "History"
      ]
    },
    "ar": {
      "title": "أوبنهايمر",
      "tagline": "قصة روبرت أوبنهايمر في تطوير القنبلة الذرية خلال الحرب العالمية",
      "overview": "فلم يحكي السيرة الذاتية وقصة العالم الأمريكي روبرت أوبنهايمر ودوره في تطوير القنبلة الذرية، وكيف غير مشروع مانهاتن من كل شيء في العالم.",
      "genres": [
        "دراما",
        "تاريخ"
      ]
    }
  },
  {
    "id": "interstellar",
    "kind": "movie",
    "tmdbId": 157336,
    "poster": "/images/posters/fan-right-2.jpg",
    "backdrop": "/images/titles/interstellar/backdrop.jpg",
    "certification": "PG-13",
    "year": 2014,
    "endYear": null,
    "runtime": 169,
    "status": null,
    "wins": 45,
    "ratings": {
      "app": 8.1,
      "appCount": 70,
      "imdb": 8.7,
      "imdbVotes": 2617722,
      "rottenTomatoes": 73,
      "metacritic": 74
    },
    "en": {
      "title": "Interstellar",
      "tagline": "Mankind was born on Earth. It was never meant to die here.",
      "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
      "genres": [
        "Adventure",
        "Drama",
        "Science Fiction"
      ]
    },
    "ar": {
      "title": "بين النجوم",
      "tagline": "ولدت البشرية على الأرض. لم يكن من المفترض أن يموت هنا.",
      "overview": "يعيش كوبر، رائد الفضاء السابق الذي يعمل مزارعًا، في مستقبل تعاني فيه الأرض من أزمات بيئية تهدد بقاء البشرية. عندما يكتشف وجود طريق غامض عبر الفضاء، ينضم إلى مهمة سرية لاستكشاف عوالم بعيدة يمكن أن توفر للبشرية فرصة جديدة للحياة. يسافر كوبر مع فريق من العلماء عبر ثقب دودي بالقرب من زحل، ويواجهون كواكب مجهولة وظروفًا قاسية تجعل مرور الوقت مختلفًا عن الأرض. وبينما يحاول كوبر إنقاذ مستقبل البشرية، يظل أكبر دافع له هو العودة إلى أطفاله، لتتحول رحلته إلى صراع بين العلم والوقت والحب.",
      "genres": [
        "مغامرة",
        "دراما",
        "خيال علمي"
      ]
    }
  },
  {
    "id": "past-lives",
    "kind": "movie",
    "tmdbId": 666277,
    "poster": "/images/posters/fan-right-3.jpg",
    "backdrop": "/images/titles/past-lives/backdrop.jpg",
    "certification": "PG-13",
    "year": 2023,
    "endYear": null,
    "runtime": 106,
    "status": null,
    "wins": 83,
    "ratings": {
      "app": 7.5,
      "appCount": 6,
      "imdb": 7.8,
      "imdbVotes": 178799,
      "rottenTomatoes": 95,
      "metacritic": 94
    },
    "en": {
      "title": "Past Lives",
      "tagline": "A heartrending modern romance that confronts notions of destiny, love, and the choices that make a life.",
      "overview": "After decades apart, childhood friends Nora and Hae Sung are reunited in New York for one fateful weekend as they confront notions of destiny, love, and the choices that make a life.",
      "genres": [
        "Drama",
        "Romance"
      ]
    },
    "ar": {
      "title": "الحيوات السابقة",
      "tagline": "A heartrending modern romance that confronts notions of destiny, love, and the choices that make a life.",
      "overview": "بعد أن فرقهما القدر قاربة الـ٢٠ عامًا، تجتمع \"نورا\" و\"هاي سونغ\" الصديقان المقربان منذ طفولتهما من جديد، ويجدان أنفسهما خلال أسبوع مصيري يواجهان خلاله مفاهيم الحب والقدر.",
      "genres": [
        "دراما",
        "رومنسية"
      ]
    }
  },
  {
    "id": "parasite",
    "kind": "movie",
    "tmdbId": 496243,
    "poster": "/images/posters/fan-right-4.jpg",
    "backdrop": "/images/titles/parasite/backdrop.jpg",
    "certification": "R",
    "year": 2019,
    "endYear": null,
    "runtime": 133,
    "status": null,
    "wins": 309,
    "ratings": {
      "app": 8,
      "appCount": 52,
      "imdb": 8.5,
      "imdbVotes": 1200817,
      "rottenTomatoes": 99,
      "metacritic": 97
    },
    "en": {
      "title": "Parasite",
      "tagline": "Act like you own the place.",
      "overview": "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
      "genres": [
        "Comedy",
        "Thriller",
        "Drama"
      ]
    },
    "ar": {
      "title": "طفيلي",
      "tagline": "تصرف وكأنك تملك المكان.",
      "overview": "تدور أحداث الفيلم حول عائلة عاطلة عن العمل، تُقيم داخل شقة فقيرة، تتغير حياتهم كُليًا عندما يلتحق الابن بوظيفة مدرس لابنة عائلة ثرية، وسرعان ما يصير جميع أفراد اﻷسرة الفقيرة عاملين لدى اﻷسرة الثرية إلى أن يتورطوا في حادث غير متوقع.",
      "genres": [
        "كوميديا",
        "إثارة",
        "دراما"
      ]
    }
  }
];
