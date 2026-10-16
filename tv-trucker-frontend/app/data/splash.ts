// The intro splash: famous characters flip past like comic pages (images only), then the brand.
// Stills are TMDB backdrops (via tvtracker.tv/api/v1/media), baked to the amber comic tint (+ a motion-blurred
// copy for the flip) so the browser only moves pictures — no filters at run time.

export interface SplashCharacter {
  id: string;
  image: string;
  blur: string;
  kind: "show" | "movie";
  en: { character: string; title: string };
  ar: { character: string };
}

export const splashCharacters: SplashCharacter[] = [
  {
    "id": "joker",
    "image": "/images/splash/joker.jpg",
    "blur": "/images/splash/joker-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "The Joker",
      "title": "The Dark Knight"
    },
    "ar": {
      "character": "الجوكر"
    }
  },
  {
    "id": "walter-white",
    "image": "/images/splash/walter-white.jpg",
    "blur": "/images/splash/walter-white-blur.jpg",
    "kind": "show",
    "en": {
      "character": "Walter White",
      "title": "Breaking Bad"
    },
    "ar": {
      "character": "والتر وايت"
    }
  },
  {
    "id": "iron-man",
    "image": "/images/splash/iron-man.jpg",
    "blur": "/images/splash/iron-man-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Iron Man",
      "title": "Iron Man"
    },
    "ar": {
      "character": "الرجل الحديدي"
    }
  },
  {
    "id": "wednesday",
    "image": "/images/splash/wednesday.jpg",
    "blur": "/images/splash/wednesday-blur.jpg",
    "kind": "show",
    "en": {
      "character": "Wednesday Addams",
      "title": "Wednesday"
    },
    "ar": {
      "character": "وينزداي آدامز"
    }
  },
  {
    "id": "darth-vader",
    "image": "/images/splash/darth-vader.jpg",
    "blur": "/images/splash/darth-vader-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Darth Vader",
      "title": "The Empire Strikes Back"
    },
    "ar": {
      "character": "دارث فيدر"
    }
  },
  {
    "id": "neo",
    "image": "/images/splash/neo.jpg",
    "blur": "/images/splash/neo-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Neo",
      "title": "The Matrix"
    },
    "ar": {
      "character": "نيو"
    }
  },
  {
    "id": "daenerys",
    "image": "/images/splash/daenerys.jpg",
    "blur": "/images/splash/daenerys-blur.jpg",
    "kind": "show",
    "en": {
      "character": "Daenerys Targaryen",
      "title": "Game of Thrones"
    },
    "ar": {
      "character": "دينيريس تارغيريان"
    }
  },
  {
    "id": "john-wick",
    "image": "/images/splash/john-wick.jpg",
    "blur": "/images/splash/john-wick-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "John Wick",
      "title": "John Wick"
    },
    "ar": {
      "character": "جون ويك"
    }
  },
  {
    "id": "spider-man",
    "image": "/images/splash/spider-man.jpg",
    "blur": "/images/splash/spider-man-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Spider-Man",
      "title": "Spider-Man: No Way Home"
    },
    "ar": {
      "character": "سبايدر مان"
    }
  },
  {
    "id": "tommy-shelby",
    "image": "/images/splash/tommy-shelby.jpg",
    "blur": "/images/splash/tommy-shelby-blur.jpg",
    "kind": "show",
    "en": {
      "character": "Tommy Shelby",
      "title": "Peaky Blinders"
    },
    "ar": {
      "character": "تومي شيلبي"
    }
  },
  {
    "id": "harry-potter",
    "image": "/images/splash/harry-potter.jpg",
    "blur": "/images/splash/harry-potter-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Harry Potter",
      "title": "Harry Potter and the Philosopher's Stone"
    },
    "ar": {
      "character": "هاري بوتر"
    }
  },
  {
    "id": "deadpool",
    "image": "/images/splash/deadpool.jpg",
    "blur": "/images/splash/deadpool-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Deadpool",
      "title": "Deadpool"
    },
    "ar": {
      "character": "ديدبول"
    }
  },
  {
    "id": "mandalorian",
    "image": "/images/splash/mandalorian.jpg",
    "blur": "/images/splash/mandalorian-blur.jpg",
    "kind": "show",
    "en": {
      "character": "The Mandalorian",
      "title": "The Mandalorian"
    },
    "ar": {
      "character": "الماندالوريان"
    }
  },
  {
    "id": "indiana-jones",
    "image": "/images/splash/indiana-jones.jpg",
    "blur": "/images/splash/indiana-jones-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Indiana Jones",
      "title": "Raiders of the Lost Ark"
    },
    "ar": {
      "character": "إنديانا جونز"
    }
  },
  {
    "id": "wolverine",
    "image": "/images/splash/wolverine.jpg",
    "blur": "/images/splash/wolverine-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Wolverine",
      "title": "Logan"
    },
    "ar": {
      "character": "وولفرين"
    }
  },
  {
    "id": "batman",
    "image": "/images/splash/batman.jpg",
    "blur": "/images/splash/batman-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "The Batman",
      "title": "The Batman"
    },
    "ar": {
      "character": "باتمان"
    }
  },
  {
    "id": "terminator",
    "image": "/images/splash/terminator.jpg",
    "blur": "/images/splash/terminator-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "The Terminator",
      "title": "Terminator 2: Judgment Day"
    },
    "ar": {
      "character": "المدمّر"
    }
  },
  {
    "id": "paul-atreides",
    "image": "/images/splash/paul-atreides.jpg",
    "blur": "/images/splash/paul-atreides-blur.jpg",
    "kind": "movie",
    "en": {
      "character": "Paul Atreides",
      "title": "Dune: Part Two"
    },
    "ar": {
      "character": "بول أتريديس"
    }
  }
];
