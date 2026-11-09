import {liveAdditionalChannels} from './liveAdditionalChannels.js';
// Published English WS_DDL Blogger catalogue; artwork sized for TV.
const baseCatalogue=[
  {
    "number": 302,
    "title": "A&E USA",
    "logo": "assets/channel-logos/302.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/kVXQITt.png"
  },
  {
    "number": 51,
    "title": "ABC USA",
    "logo": "assets/channel-logos/51.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/wDyNSvx.png"
  },
  {
    "number": 766,
    "title": "ABCNY USA",
    "logo": "assets/channel-logos/766.png",
    "categories": [
      "news",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/17DKDEX.png"
  },
  {
    "number": 664,
    "title": "ACC Network USA",
    "logo": "assets/channel-logos/664.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/C8R4RPm.png"
  },
  {
    "number": 295,
    "title": "Adult Swim",
    "logo": "assets/channel-logos/295.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/cBoccvg.png"
  },
  {
    "number": 303,
    "title": "AMC USA",
    "logo": "assets/channel-logos/303.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/uio2v5E.png"
  },
  {
    "number": 370,
    "title": "Astro Cricket",
    "logo": "assets/channel-logos/370.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/2PSXT09.png"
  },
  {
    "number": 123,
    "title": "Astro SuperSport 1",
    "logo": "assets/channel-logos/123.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/44VJNpa.png"
  },
  {
    "number": 124,
    "title": "Astro SuperSport 2",
    "logo": "assets/channel-logos/124.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/vGUJ3SF.png"
  },
  {
    "number": 125,
    "title": "Astro SuperSport 3",
    "logo": "assets/channel-logos/125.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/gDKZnEw.png"
  },
  {
    "number": 126,
    "title": "Astro SuperSport 4",
    "logo": "assets/channel-logos/126.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/qZG0upY.png"
  },
  {
    "number": 742,
    "title": "AXS TV USA",
    "logo": "assets/channel-logos/742.png",
    "categories": [
      "entertainment",
      "music"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "music",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Empnng8.png"
  },
  {
    "number": 305,
    "title": "BBC America (BBCA)",
    "logo": "assets/channel-logos/305.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Ef2RRrb.png"
  },
  {
    "number": 359,
    "title": "BBC Four UK",
    "logo": "assets/channel-logos/359.png",
    "categories": [
      "popular",
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ngFw35A.png"
  },
  {
    "number": 349,
    "title": "BBC News",
    "logo": "assets/channel-logos/349.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/0Ox02XU.png"
  },
  {
    "number": 356,
    "title": "BBC One UK",
    "logo": "assets/channel-logos/356.png",
    "categories": [
      "popular",
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/zMG0RZo.png"
  },
  {
    "number": 358,
    "title": "BBC Three UK",
    "logo": "assets/channel-logos/358.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Gi3YplO.png"
  },
  {
    "number": 357,
    "title": "BBC Two UK",
    "logo": "assets/channel-logos/357.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/UG9SF7s.png"
  },
  {
    "number": 491,
    "title": "beIN SPORTS Australia 1",
    "logo": "assets/channel-logos/491.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jKLP1PE.png"
  },
  {
    "number": 492,
    "title": "beIN Sports Australia 2",
    "logo": "assets/channel-logos/492.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/DeueEoB.png"
  },
  {
    "number": 493,
    "title": "beIN Sports Australia 3",
    "logo": "assets/channel-logos/493.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/K49Ob4C.png"
  },
  {
    "number": 61,
    "title": "beIN Sports MENA English 1",
    "logo": "assets/channel-logos/61.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/bATE7dm.png"
  },
  {
    "number": 90,
    "title": "beIN Sports MENA English 2",
    "logo": "assets/channel-logos/90.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/WMLE6zr.png"
  },
  {
    "number": 425,
    "title": "beIN Sports USA",
    "logo": "assets/channel-logos/425.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/0DiqFh6.jpeg"
  },
  {
    "number": 306,
    "title": "BET USA",
    "logo": "assets/channel-logos/306.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/JDnFVRm.png"
  },
  {
    "number": 397,
    "title": "BIG TEN Network (BTN USA)",
    "logo": "assets/channel-logos/397.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/s0XqhAP.png"
  },
  {
    "number": 648,
    "title": "Boomerang",
    "logo": "assets/channel-logos/648.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Rh9Q3Xt.png"
  },
  {
    "number": 307,
    "title": "Bravo USA",
    "logo": "assets/channel-logos/307.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/DwCGqLA.png"
  },
  {
    "number": 750,
    "title": "C SPAN 1",
    "logo": "assets/channel-logos/750.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/5hCaNLE.png"
  },
  {
    "number": 273,
    "title": "Canal+ Formula 1",
    "logo": "assets/channel-logos/273.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/eftaRma.png"
  },
  {
    "number": 339,
    "title": "Cartoon Network",
    "logo": "assets/channel-logos/339.png",
    "categories": [
      "popular",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/OWDaAe7.png"
  },
  {
    "number": 832,
    "title": "CBC CA",
    "logo": "assets/channel-logos/832.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/fAlgei7.png"
  },
  {
    "number": 308,
    "title": "CBS Sports Network (CBSSN)",
    "logo": "assets/channel-logos/308.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/SWaQpdl.png"
  },
  {
    "number": 52,
    "title": "CBS USA",
    "logo": "assets/channel-logos/52.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Q842dJ7.png"
  },
  {
    "number": 767,
    "title": "CBSNY USA",
    "logo": "assets/channel-logos/767.png",
    "categories": [
      "news",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/cgshz3J.png"
  },
  {
    "number": 354,
    "title": "Channel 4 UK",
    "logo": "assets/channel-logos/354.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/nCIjpyE.png"
  },
  {
    "number": 355,
    "title": "Channel 5 UK",
    "logo": "assets/channel-logos/355.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/OTeAt9a.png"
  },
  {
    "number": 374,
    "title": "Cinemax USA",
    "logo": "assets/channel-logos/374.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/3Nheb4G.png.png"
  },
  {
    "number": 715,
    "title": "Cleo TV",
    "logo": "assets/channel-logos/715.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Ka6ZlUH.png"
  },
  {
    "number": 345,
    "title": "CNN.us",
    "logo": "assets/channel-logos/345.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jrOqR9M.png"
  },
  {
    "number": 310,
    "title": "Comedy Central",
    "logo": "assets/channel-logos/310.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/2Xme3TN.png"
  },
  {
    "number": 696,
    "title": "Comet USA",
    "logo": "assets/channel-logos/696.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ZWAHbGV.png"
  },
  {
    "number": 281,
    "title": "Court TV USA",
    "logo": "assets/channel-logos/281.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/86ZeGZm.png"
  },
  {
    "number": 748,
    "title": "COZI TV USA",
    "logo": "assets/channel-logos/748.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/bFUGBUl.png"
  },
  {
    "number": 669,
    "title": "Crime & Investigation USA",
    "logo": "assets/channel-logos/669.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/mPb1Xqb.png"
  },
  {
    "number": 838,
    "title": "CTV 2 Canada",
    "logo": "assets/channel-logos/838.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/VGkyIO7.png"
  },
  {
    "number": 602,
    "title": "CTV Canada",
    "logo": "assets/channel-logos/602.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/UxCnBNE.png"
  },
  {
    "number": 280,
    "title": "CW PIX 11 USA",
    "logo": "assets/channel-logos/280.png",
    "categories": [
      "news",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/aCfCkLL.png"
  },
  {
    "number": 300,
    "title": "CW USA",
    "logo": "assets/channel-logos/300.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/kjMWITO.png"
  },
  {
    "number": 348,
    "title": "Dave",
    "logo": "assets/channel-logos/348.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/5UhAO7e.png"
  },
  {
    "number": 230,
    "title": "DAZN 1 UK",
    "logo": "assets/channel-logos/230.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/e7mglLs.png"
  },
  {
    "number": 651,
    "title": "Destination America",
    "logo": "assets/channel-logos/651.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/AeZYx8T.png"
  },
  {
    "number": 313,
    "title": "Discovery Channel",
    "logo": "assets/channel-logos/313.png",
    "categories": [
      "popular",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/i56i4cr.png"
  },
  {
    "number": 657,
    "title": "Discovery Family",
    "logo": "assets/channel-logos/657.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Wz2PCmF.png"
  },
  {
    "number": 311,
    "title": "Discovery Life Channel",
    "logo": "assets/channel-logos/311.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/3XZrg7d.png"
  },
  {
    "number": 285,
    "title": "Discovery Velocity CA",
    "logo": "assets/channel-logos/285.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/vp5HHvB.png"
  },
  {
    "number": 312,
    "title": "Disney Channel USA",
    "logo": "assets/channel-logos/312.png",
    "categories": [
      "popular",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/BGkCPfY.png"
  },
  {
    "number": 652,
    "title": "Disney JR",
    "logo": "assets/channel-logos/652.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/WaVEINF.png"
  },
  {
    "number": 314,
    "title": "Disney XD",
    "logo": "assets/channel-logos/314.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/SOEJ5jS.png"
  },
  {
    "number": 315,
    "title": "E! Entertainment Television",
    "logo": "assets/channel-logos/315.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/nxicXAm.png"
  },
  {
    "number": 363,
    "title": "E4",
    "logo": "assets/channel-logos/363.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/DUoJAaP.png"
  },
  {
    "number": 44,
    "title": "ESPN USA",
    "logo": "assets/channel-logos/44.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/qBSCUNH.png"
  },
  {
    "number": 167,
    "title": "ESPN+ USA",
    "logo": "assets/channel-logos/167.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/RX8yX2J.png"
  },
  {
    "number": 45,
    "title": "ESPN2 USA",
    "logo": "assets/channel-logos/45.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/tfBYiMJ.png"
  },
  {
    "number": 288,
    "title": "ESPNews",
    "logo": "assets/channel-logos/288.png",
    "categories": [
      "news",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/xIpGjpz.png"
  },
  {
    "number": 316,
    "title": "ESPNU USA",
    "logo": "assets/channel-logos/316.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/MteFy2o.png"
  },
  {
    "number": 41,
    "title": "EuroSport 1 UK",
    "logo": "assets/channel-logos/41.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/M5Kg4AI.png"
  },
  {
    "number": 42,
    "title": "EuroSport 2 UK",
    "logo": "assets/channel-logos/42.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/H2iiS6X.png"
  },
  {
    "number": 751,
    "title": "FETV - Family Entertainment Television",
    "logo": "assets/channel-logos/751.png",
    "categories": [
      "entertainment",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/fiWJO4Q.png"
  },
  {
    "number": 757,
    "title": "Fight Network",
    "logo": "assets/channel-logos/757.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/V0kBRks.png"
  },
  {
    "number": 688,
    "title": "Film4 UK",
    "logo": "assets/channel-logos/688.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/qgQRdgo.png"
  },
  {
    "number": 297,
    "title": "Fox Business",
    "logo": "assets/channel-logos/297.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/yIXsnja.png"
  },
  {
    "number": 369,
    "title": "Fox Cricket",
    "logo": "assets/channel-logos/369.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/tvbcdYl.png"
  },
  {
    "number": 347,
    "title": "FOX News",
    "logo": "assets/channel-logos/347.png",
    "categories": [
      "popular",
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/BceQr4S.png"
  },
  {
    "number": 756,
    "title": "FOX Soccer Plus",
    "logo": "assets/channel-logos/756.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/S2A3ehU.png"
  },
  {
    "number": 39,
    "title": "Fox Sports 1 USA",
    "logo": "assets/channel-logos/39.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Vw5TkaL.png"
  },
  {
    "number": 758,
    "title": "Fox Sports 2 USA",
    "logo": "assets/channel-logos/758.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/gRdUHLn.png"
  },
  {
    "number": 820,
    "title": "FOX Sports 502 AU",
    "logo": "assets/channel-logos/820.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/MpA3tyQ.png"
  },
  {
    "number": 821,
    "title": "FOX Sports 503 AU",
    "logo": "assets/channel-logos/821.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/DFzK0q6.png"
  },
  {
    "number": 822,
    "title": "FOX Sports 504 AU",
    "logo": "assets/channel-logos/822.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/GxDYsXh.png"
  },
  {
    "number": 823,
    "title": "FOX Sports 505 AU",
    "logo": "assets/channel-logos/823.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/pVWHwl2.png"
  },
  {
    "number": 824,
    "title": "FOX Sports 506 AU",
    "logo": "assets/channel-logos/824.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/r2X1UiS.png"
  },
  {
    "number": 825,
    "title": "FOX Sports 507 AU",
    "logo": "assets/channel-logos/825.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/swOpz2i.png"
  },
  {
    "number": 54,
    "title": "FOX USA",
    "logo": "assets/channel-logos/54.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/6L8qdX0.png"
  },
  {
    "number": 775,
    "title": "Fox Weather",
    "logo": "assets/channel-logos/775.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/b8EjnRp.png"
  },
  {
    "number": 768,
    "title": "FOXNY USA",
    "logo": "assets/channel-logos/768.png",
    "categories": [
      "news",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/2QZPbjj.png"
  },
  {
    "number": 301,
    "title": "Freeform",
    "logo": "assets/channel-logos/301.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/9MMsh24.png"
  },
  {
    "number": 279,
    "title": "FUSE TV USA",
    "logo": "assets/channel-logos/279.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/bRMCEel.png"
  },
  {
    "number": 381,
    "title": "FX Movie Channel",
    "logo": "assets/channel-logos/381.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ihX4Wby.png"
  },
  {
    "number": 317,
    "title": "FX USA",
    "logo": "assets/channel-logos/317.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/lPPn6pm.png"
  },
  {
    "number": 298,
    "title": "FXX USA",
    "logo": "assets/channel-logos/298.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/GGM7iOq.png"
  },
  {
    "number": 665,
    "title": "FYI",
    "logo": "assets/channel-logos/665.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Lt1HvMA.png"
  },
  {
    "number": 319,
    "title": "Game Show Network",
    "logo": "assets/channel-logos/319.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/hNQHl8b.png"
  },
  {
    "number": 836,
    "title": "Global CA",
    "logo": "assets/channel-logos/836.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/L8KLyIC.png"
  },
  {
    "number": 687,
    "title": "Gold UK",
    "logo": "assets/channel-logos/687.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/NpSxOQw.png"
  },
  {
    "number": 318,
    "title": "GOLF Channel USA",
    "logo": "assets/channel-logos/318.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/oJBhM5k.png"
  },
  {
    "number": 699,
    "title": "Great American Family",
    "logo": "assets/channel-logos/699.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ClFGgL4.png"
  },
  {
    "number": 752,
    "title": "Grit Channel",
    "logo": "assets/channel-logos/752.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/z0HzYwB.png"
  },
  {
    "number": 296,
    "title": "Hallmark Movies & Mysterie",
    "logo": "assets/channel-logos/296.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/VC9XC2Z.png"
  },
  {
    "number": 690,
    "title": "HBO Comedy USA",
    "logo": "assets/channel-logos/690.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/4Dpsz6h.png"
  },
  {
    "number": 691,
    "title": "HBO Family USA",
    "logo": "assets/channel-logos/691.png",
    "categories": [
      "popular",
      "movies",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/uv46SOG.png"
  },
  {
    "number": 693,
    "title": "HBO Signature USA",
    "logo": "https://piratetv.pro/wp-content/themes/Pirate%20TV%20PRO%20theme/assets/images/canais/HBO%20Signature.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ]
  },
  {
    "number": 321,
    "title": "HBO USA",
    "logo": "assets/channel-logos/321.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ZQoCet7.png"
  },
  {
    "number": 694,
    "title": "HBO Zone USA",
    "logo": "assets/channel-logos/694.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Hru8CXO.png"
  },
  {
    "number": 323,
    "title": "Headline News",
    "logo": "assets/channel-logos/323.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/RBb3XOl.png"
  },
  {
    "number": 322,
    "title": "History USA",
    "logo": "assets/channel-logos/322.png",
    "categories": [
      "popular",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/HxdZH3p.png"
  },
  {
    "number": 656,
    "title": "IFC TV USA",
    "logo": "assets/channel-logos/656.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/UCZUQwR.png"
  },
  {
    "number": 324,
    "title": "Investigation Discovery (ID USA)",
    "logo": "assets/channel-logos/324.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/J1WFDiE.png"
  },
  {
    "number": 325,
    "title": "ION USA",
    "logo": "assets/channel-logos/325.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/cyIZRP8.png"
  },
  {
    "number": 350,
    "title": "ITV 1 UK",
    "logo": "assets/channel-logos/350.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/E2NHlAo.png"
  },
  {
    "number": 351,
    "title": "ITV 2 UK",
    "logo": "assets/channel-logos/351.png",
    "categories": [
      "popular",
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/pkLbgpK.png"
  },
  {
    "number": 352,
    "title": "ITV 3 UK",
    "logo": "assets/channel-logos/352.png",
    "categories": [
      "popular",
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/WNcHT9j.png"
  },
  {
    "number": 353,
    "title": "ITV 4 UK",
    "logo": "assets/channel-logos/353.png",
    "categories": [
      "popular",
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/d6UdvJK.png"
  },
  {
    "number": 278,
    "title": "Law & Crime Network",
    "logo": "assets/channel-logos/278.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/KCXqbqB.png"
  },
  {
    "number": 389,
    "title": "Lifetime Movies Network",
    "logo": "assets/channel-logos/389.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/eNBgFhN.png"
  },
  {
    "number": 326,
    "title": "Lifetime Network",
    "logo": "assets/channel-logos/326.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/VekCSnF.png"
  },
  {
    "number": 826,
    "title": "Liverpool TV (LFC TV)",
    "logo": "assets/channel-logos/826.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/lQr2YXd.png"
  },
  {
    "number": 667,
    "title": "Longhorn Network USA",
    "logo": "assets/channel-logos/667.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/6wu484m.png"
  },
  {
    "number": 299,
    "title": "Magnolia Network",
    "logo": "assets/channel-logos/299.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ia4h1e8.png"
  },
  {
    "number": 770,
    "title": "Marquee Sports Network",
    "logo": "assets/channel-logos/770.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "sports"
    ],
    "remoteLogo": "https://i.imgur.com/nYOMbnU.png"
  },
  {
    "number": 829,
    "title": "MASN USA",
    "logo": "assets/channel-logos/829.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Fzg1eIt.png"
  },
  {
    "number": 662,
    "title": "METV USA",
    "logo": "assets/channel-logos/662.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/LotVgCR.png"
  },
  {
    "number": 791,
    "title": "MGM+",
    "logo": "assets/channel-logos/791.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/a6Omqm9.png"
  },
  {
    "number": 399,
    "title": "MLB Network USA",
    "logo": "assets/channel-logos/399.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/BRFyDRe.png"
  },
  {
    "number": 661,
    "title": "Motor Trend",
    "logo": "assets/channel-logos/661.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/fzovezM.png"
  },
  {
    "number": 765,
    "title": "MSG USA",
    "logo": "assets/channel-logos/765.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Bxy4Fxz.png"
  },
  {
    "number": 327,
    "title": "MSNBC",
    "logo": "assets/channel-logos/327.png",
    "categories": [
      "popular",
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/pAFi14R.png"
  },
  {
    "number": 367,
    "title": "MTV UK",
    "logo": "assets/channel-logos/367.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/mFGChCZ.png"
  },
  {
    "number": 371,
    "title": "MTV US",
    "logo": "assets/channel-logos/371.png",
    "categories": [
      "popular",
      "entertainment",
      "music"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "music",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/GrPhgCt.png"
  },
  {
    "number": 654,
    "title": "MY9TV USA",
    "logo": "assets/channel-logos/654.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jlPK9Gv.png"
  },
  {
    "number": 328,
    "title": "National Geographic (NGC)",
    "logo": "assets/channel-logos/328.png",
    "categories": [
      "popular",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/AHxyn8q.png"
  },
  {
    "number": 745,
    "title": "National Geographic Wild USA",
    "logo": "assets/channel-logos/745.png",
    "categories": [
      "popular",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/LYa7RNU.png"
  },
  {
    "number": 404,
    "title": "NBA TV USA",
    "logo": "assets/channel-logos/404.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/AF0emIJ.png"
  },
  {
    "number": 53,
    "title": "NBC USA",
    "logo": "assets/channel-logos/53.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/kG2BLjo.png"
  },
  {
    "number": 762,
    "title": "NESN USA",
    "logo": "assets/channel-logos/762.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/KXrkwcQ.png"
  },
  {
    "number": 292,
    "title": "NewsNation USA",
    "logo": "assets/channel-logos/292.png",
    "categories": [
      "news"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/NnqVOtY.png"
  },
  {
    "number": 405,
    "title": "NFL Network",
    "logo": "assets/channel-logos/405.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/UEu2NBt.png"
  },
  {
    "number": 663,
    "title": "NHL Network USA",
    "logo": "assets/channel-logos/663.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/anP0Rd1.png"
  },
  {
    "number": 329,
    "title": "NICK JR USA",
    "logo": "assets/channel-logos/329.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ad0APsK.png"
  },
  {
    "number": 666,
    "title": "Nick Music",
    "logo": "assets/channel-logos/666.png",
    "categories": [
      "kids",
      "music"
    ],
    "labels": [
      "_tv_search",
      "kids",
      "music"
    ],
    "remoteLogo": "https://i.imgur.com/oSu5oet.png"
  },
  {
    "number": 330,
    "title": "Nick@Nite",
    "logo": "assets/channel-logos/330.png",
    "categories": [
      "entertainment",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/tMfvFeo.png"
  },
  {
    "number": 649,
    "title": "Nicktoons",
    "logo": "assets/channel-logos/649.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Mz1B85w.png"
  },
  {
    "number": 331,
    "title": "Oprah Winfrey Network (OWN)",
    "logo": "assets/channel-logos/331.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/h8LNvLI.png"
  },
  {
    "number": 848,
    "title": "Outdoor Channel",
    "logo": "assets/channel-logos/848.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/0xVs6cu.png"
  },
  {
    "number": 332,
    "title": "Oxygen True Crime",
    "logo": "assets/channel-logos/332.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Ug5sTpe.png"
  },
  {
    "number": 287,
    "title": "Pac-12 Network",
    "logo": "assets/channel-logos/287.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/s6lxubZ.png"
  },
  {
    "number": 334,
    "title": "Paramount Network",
    "logo": "assets/channel-logos/334.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Q60a9Kg.png"
  },
  {
    "number": 210,
    "title": "PBS USA",
    "logo": "assets/channel-logos/210.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/SdlYrce.png"
  },
  {
    "number": 43,
    "title": "PDC TV",
    "logo": "assets/channel-logos/43.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "sports"
    ],
    "remoteLogo": "https://i.imgur.com/DYpRb74.png"
  },
  {
    "number": 653,
    "title": "POP TV USA",
    "logo": "assets/channel-logos/653.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jq0rVQ7.png"
  },
  {
    "number": 771,
    "title": "Premier Sports Ireland 1",
    "logo": "assets/channel-logos/771.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/J5EoWCz.png"
  },
  {
    "number": 799,
    "title": "Premier Sports Ireland 2",
    "logo": "assets/channel-logos/799.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Hnfrpzm.png"
  },
  {
    "number": 555,
    "title": "Racing Tv UK",
    "logo": "assets/channel-logos/555.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Ar97lyo.png"
  },
  {
    "number": 607,
    "title": "Rally Tv",
    "logo": "assets/channel-logos/607.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/VA7Kllh.png"
  },
  {
    "number": 293,
    "title": "Reelz Channel",
    "logo": "assets/channel-logos/293.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/z1Cyzo1.png"
  },
  {
    "number": 365,
    "title": "RTE 2 Ireland",
    "logo": "assets/channel-logos/365.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/qgadfdA.png"
  },
  {
    "number": 670,
    "title": "S4C UK",
    "logo": "assets/channel-logos/670.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/yyMiMsB.png"
  },
  {
    "number": 294,
    "title": "Science Channel",
    "logo": "assets/channel-logos/294.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/B8FWJ9v.png"
  },
  {
    "number": 385,
    "title": "SEC Network USA",
    "logo": "assets/channel-logos/385.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/TS6gDPX.png"
  },
  {
    "number": 792,
    "title": "Showtime 2 USA",
    "logo": "assets/channel-logos/792.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/kX3vjr8.png"
  },
  {
    "number": 794,
    "title": "Showtime Extreme USA",
    "logo": "assets/channel-logos/794.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/h07KA40.png"
  },
  {
    "number": 795,
    "title": "Showtime Family Zone USA",
    "logo": "assets/channel-logos/795.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/FrF3TvN.png"
  },
  {
    "number": 796,
    "title": "Showtime Next USA",
    "logo": "assets/channel-logos/796.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/YemtnBr.png"
  },
  {
    "number": 793,
    "title": "Showtime Showcase USA",
    "logo": "assets/channel-logos/793.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/XP3YbO9.png"
  },
  {
    "number": 333,
    "title": "Showtime USA",
    "logo": "assets/channel-logos/333.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/HS2THzM.jpeg"
  },
  {
    "number": 797,
    "title": "Showtime Women USA",
    "logo": "assets/channel-logos/797.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ZZXfeWp.png"
  },
  {
    "number": 683,
    "title": "Sky Arts UK",
    "logo": "assets/channel-logos/683.png",
    "categories": [
      "popular",
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "lifestyle",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ctpCYtX.png"
  },
  {
    "number": 362,
    "title": "Sky Atlantic",
    "logo": "assets/channel-logos/362.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/WQsMBkJ.png"
  },
  {
    "number": 677,
    "title": "Sky Cinema Action UK",
    "logo": "assets/channel-logos/677.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/HnhniLu.png"
  },
  {
    "number": 675,
    "title": "Sky Cinema Animation UK",
    "logo": "assets/channel-logos/675.png",
    "categories": [
      "popular",
      "entertainment",
      "movies",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "kids",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jrNW33H.png"
  },
  {
    "number": 678,
    "title": "Sky Cinema Comedy UK",
    "logo": "assets/channel-logos/678.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/y4k7h93.png"
  },
  {
    "number": 680,
    "title": "Sky Cinema Drama UK",
    "logo": "assets/channel-logos/680.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/FnnDZZT.png"
  },
  {
    "number": 676,
    "title": "Sky Cinema Family UK",
    "logo": "assets/channel-logos/676.png",
    "categories": [
      "movies",
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/drGoBH5.png"
  },
  {
    "number": 674,
    "title": "Sky Cinema Greats UK",
    "logo": "assets/channel-logos/674.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ywUfjRb.png"
  },
  {
    "number": 673,
    "title": "Sky Cinema Hits UK",
    "logo": "assets/channel-logos/673.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/q9nX9Yp.png"
  },
  {
    "number": 671,
    "title": "Sky Cinema Premiere UK",
    "logo": "assets/channel-logos/671.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/tiee779.png"
  },
  {
    "number": 672,
    "title": "Sky Cinema Select UK",
    "logo": "assets/channel-logos/672.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/6RdsfQc.png"
  },
  {
    "number": 679,
    "title": "Sky Cinema Thriller UK",
    "logo": "assets/channel-logos/679.png",
    "categories": [
      "popular",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Y1HaQGc.png"
  },
  {
    "number": 684,
    "title": "Sky Comedy UK",
    "logo": "assets/channel-logos/684.png",
    "categories": [
      "popular",
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/IX204SR.png"
  },
  {
    "number": 685,
    "title": "Sky Crime",
    "logo": "assets/channel-logos/685.png",
    "categories": [
      "popular",
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/H61Ox5Z.png"
  },
  {
    "number": 686,
    "title": "Sky History",
    "logo": "assets/channel-logos/686.png",
    "categories": [
      "popular",
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/iC3U9Qb.png"
  },
  {
    "number": 682,
    "title": "Sky Showcase UK",
    "logo": "assets/channel-logos/682.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/1kmCgrs.png"
  },
  {
    "number": 588,
    "title": "Sky Sport 1 NZ",
    "logo": "assets/channel-logos/588.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/l71HQKW.png"
  },
  {
    "number": 589,
    "title": "Sky Sport 2 NZ",
    "logo": "assets/channel-logos/589.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/SQ6T27A.png"
  },
  {
    "number": 590,
    "title": "Sky Sport 3 NZ",
    "logo": "assets/channel-logos/590.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/9uBmlHf.png"
  },
  {
    "number": 591,
    "title": "Sky Sport 4 NZ",
    "logo": "assets/channel-logos/591.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/5XgI1xD.png"
  },
  {
    "number": 592,
    "title": "Sky Sport 5 NZ",
    "logo": "assets/channel-logos/592.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/txgPT30.png"
  },
  {
    "number": 593,
    "title": "Sky Sport 6 NZ",
    "logo": "assets/channel-logos/593.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jMKy5DV.png"
  },
  {
    "number": 594,
    "title": "Sky Sport 7 NZ",
    "logo": "assets/channel-logos/594.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/J6Xitk8.png"
  },
  {
    "number": 595,
    "title": "Sky Sport 8 NZ",
    "logo": "assets/channel-logos/595.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/cedj4Cm.png"
  },
  {
    "number": 596,
    "title": "Sky Sport 9 NZ",
    "logo": "assets/channel-logos/596.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/mouIto3.png"
  },
  {
    "number": 587,
    "title": "Sky Sport Select NZ",
    "logo": "assets/channel-logos/587.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/NsEiWKk.png"
  },
  {
    "number": 37,
    "title": "Sky Sports Action UK",
    "logo": "assets/channel-logos/37.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/uwCqbjj.png"
  },
  {
    "number": 36,
    "title": "Sky Sports Arena UK",
    "logo": "assets/channel-logos/36.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/yxvFsGb.png"
  },
  {
    "number": 65,
    "title": "Sky Sports Cricket",
    "logo": "assets/channel-logos/65.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/y0l2CSP.png"
  },
  {
    "number": 60,
    "title": "Sky Sports F1 UK",
    "logo": "assets/channel-logos/60.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/x777vsa.png"
  },
  {
    "number": 35,
    "title": "Sky Sports Football UK",
    "logo": "assets/channel-logos/35.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/6u4JnW1.png"
  },
  {
    "number": 70,
    "title": "Sky Sports Golf UK",
    "logo": "assets/channel-logos/70.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/2yA72WM.png"
  },
  {
    "number": 38,
    "title": "Sky Sports Main Event",
    "logo": "assets/channel-logos/38.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/ZzthNVY.png"
  },
  {
    "number": 449,
    "title": "Sky Sports MIX UK",
    "logo": "assets/channel-logos/449.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/IYZ45xN.png"
  },
  {
    "number": 366,
    "title": "Sky Sports News UK",
    "logo": "assets/channel-logos/366.png",
    "categories": [
      "popular",
      "news",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "news",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/flaOy0L.png"
  },
  {
    "number": 130,
    "title": "Sky Sports Premier League",
    "logo": "assets/channel-logos/130.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhrihO6CRjentL9pE75qFFMafGpE-niM1VeV9xCg3dzVt4eAPOUfPTzWGKLg46azvfx5z3ot2opWjq1c_nxEuHWZIav_hyYc65KD3NwohcsLA_GT_nvGHZ6ljd7iDg_v0cD-Pv9gtudXlHJdNDLPq_inu4_P7HjBT3np1mAeHD5jBXeCq7ZWeryiMy7lsOy/s1600/thumb-sky-sports-premier-league-uk.png"
  },
  {
    "number": 554,
    "title": "Sky Sports Racing UK",
    "logo": "assets/channel-logos/554.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/8uaYmjC.png"
  },
  {
    "number": 46,
    "title": "Sky Sports Tennis UK",
    "logo": "assets/channel-logos/46.png",
    "categories": [
      "popular",
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "popular",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/jLBbHd0.png"
  },
  {
    "number": 361,
    "title": "Sky Witness",
    "logo": "assets/channel-logos/361.png",
    "categories": [
      "popular",
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/3Gctdvb.png"
  },
  {
    "number": 603,
    "title": "Smithsonian Channel",
    "logo": "assets/channel-logos/603.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/nbGNp1E.png"
  },
  {
    "number": 335,
    "title": "Starz",
    "logo": "assets/channel-logos/335.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/rFV30Qx.png"
  },
  {
    "number": 284,
    "title": "StarzPlay CricLife 1 HD",
    "logo": "assets/channel-logos/284.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "sports"
    ],
    "remoteLogo": "https://i.imgur.com/B0uwbeT.png"
  },
  {
    "number": 283,
    "title": "StarzPlay CricLife 3 HD",
    "logo": "assets/channel-logos/283.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "sports"
    ],
    "remoteLogo": "https://i.imgur.com/B0uwbeT.png"
  },
  {
    "number": 658,
    "title": "Sundance TV",
    "logo": "assets/channel-logos/658.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/VYLsJ4H.png"
  },
  {
    "number": 420,
    "title": "SuperSport Action",
    "logo": "assets/channel-logos/420.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/mvqlS5f.png"
  },
  {
    "number": 368,
    "title": "SuperSport Cricket",
    "logo": "assets/channel-logos/368.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/1ylkn9c.png"
  },
  {
    "number": 56,
    "title": "SuperSport Football",
    "logo": "assets/channel-logos/56.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/XICBmgO.png"
  },
  {
    "number": 422,
    "title": "SuperSport Golf",
    "logo": "assets/channel-logos/422.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/dsIrP6f.png"
  },
  {
    "number": 412,
    "title": "SuperSport Grandstand",
    "logo": "assets/channel-logos/412.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/xOTEOjr.png"
  },
  {
    "number": 572,
    "title": "SuperSport MaXimo 1",
    "logo": "assets/channel-logos/572.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/qPiKLeV.png"
  },
  {
    "number": 424,
    "title": "SuperSport Motorsport",
    "logo": "assets/channel-logos/424.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/MTBHN0T.png"
  },
  {
    "number": 414,
    "title": "SuperSport Premier League",
    "logo": "assets/channel-logos/414.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/A4Ti8xr.png"
  },
  {
    "number": 413,
    "title": "SuperSport PSL",
    "logo": "assets/channel-logos/413.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/clwfqjh.png"
  },
  {
    "number": 421,
    "title": "SuperSport Rugby",
    "logo": "assets/channel-logos/421.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/J7A8Hd9.png"
  },
  {
    "number": 423,
    "title": "SuperSport Tennis",
    "logo": "assets/channel-logos/423.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/drhhydl.png"
  },
  {
    "number": 416,
    "title": "SuperSport Variety 1",
    "logo": "assets/channel-logos/416.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/r8bb84E.png"
  },
  {
    "number": 417,
    "title": "SuperSport Variety 2",
    "logo": "assets/channel-logos/417.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/YAgUbLY.png"
  },
  {
    "number": 418,
    "title": "SuperSport Variety 3",
    "logo": "assets/channel-logos/418.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/PQ3zdKY.png"
  },
  {
    "number": 419,
    "title": "SuperSport Variety 4",
    "logo": "assets/channel-logos/419.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "dstv",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/YJyP6KH.png"
  },
  {
    "number": 373,
    "title": "SYFY USA",
    "logo": "assets/channel-logos/373.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/499Loc4.png"
  },
  {
    "number": 336,
    "title": "TBS USA",
    "logo": "assets/channel-logos/336.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/RCuFCpm.png"
  },
  {
    "number": 644,
    "title": "TCM USA",
    "logo": "assets/channel-logos/644.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/5g0OdLF.pngg"
  },
  {
    "number": 650,
    "title": "TeenNick",
    "logo": "assets/channel-logos/650.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "kids",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/11CD0HK.png"
  },
  {
    "number": 320,
    "title": "The Hallmark Channel",
    "logo": "assets/channel-logos/320.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/XPlGqKD.png"
  },
  {
    "number": 394,
    "title": "The Weather Channel",
    "logo": "assets/channel-logos/394.png",
    "categories": [
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/aiXUyf7.png"
  },
  {
    "number": 698,
    "title": "TMC Channel USA",
    "logo": "assets/channel-logos/698.png",
    "categories": [
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/2pZ6UE6.png"
  },
  {
    "number": 31,
    "title": "TNT Sports 1 UK",
    "logo": "assets/channel-logos/31.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/SQnRjcb.png"
  },
  {
    "number": 32,
    "title": "TNT Sports 2 UK",
    "logo": "assets/channel-logos/32.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/4SxwKk3.png"
  },
  {
    "number": 33,
    "title": "TNT Sports 3 UK",
    "logo": "assets/channel-logos/33.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/quNHBLN.png"
  },
  {
    "number": 34,
    "title": "TNT Sports 4 UK",
    "logo": "assets/channel-logos/34.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/iQanD8D.png"
  },
  {
    "number": 338,
    "title": "TNT USA",
    "logo": "assets/channel-logos/338.png",
    "categories": [
      "sports",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "movies",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/0mLEfSH.png"
  },
  {
    "number": 340,
    "title": "Travel Channel",
    "logo": "assets/channel-logos/340.png",
    "categories": [
      "entertainment",
      "educational"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "educational",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/B2cy0ur.png"
  },
  {
    "number": 341,
    "title": "TruTV USA",
    "logo": "assets/channel-logos/341.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/IxZMVM7.png"
  },
  {
    "number": 111,
    "title": "TSN1",
    "logo": "assets/channel-logos/111.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/8dyC7Cn.png"
  },
  {
    "number": 112,
    "title": "TSN2",
    "logo": "assets/channel-logos/112.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/FCNxFEE.png"
  },
  {
    "number": 113,
    "title": "TSN3",
    "logo": "assets/channel-logos/113.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/hAS7sTI.png"
  },
  {
    "number": 114,
    "title": "TSN4",
    "logo": "assets/channel-logos/114.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/IkdWQqI.png"
  },
  {
    "number": 115,
    "title": "TSN5",
    "logo": "assets/channel-logos/115.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/xSu0uyJ.png"
  },
  {
    "number": 660,
    "title": "TV ONE USA",
    "logo": "assets/channel-logos/660.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/iLZyaE8.png"
  },
  {
    "number": 342,
    "title": "TVLAND",
    "logo": "assets/channel-logos/342.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Ezkcgr6.png"
  },
  {
    "number": 668,
    "title": "Universal Kids USA",
    "logo": "assets/channel-logos/668.png",
    "categories": [
      "kids"
    ],
    "labels": [
      "_tv_search",
      "kids"
    ],
    "remoteLogo": "https://i.imgur.com/CEw4BVy.png"
  },
  {
    "number": 343,
    "title": "USA Network",
    "logo": "assets/channel-logos/343.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/Q9YbzvG.png"
  },
  {
    "number": 344,
    "title": "VH1 USA",
    "logo": "assets/channel-logos/344.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/mxAoIPe.png"
  },
  {
    "number": 451,
    "title": "Viaplay Sports 1 UK",
    "logo": "assets/channel-logos/451.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/2ng17Sv.png"
  },
  {
    "number": 550,
    "title": "Viaplay Sports 2 UK",
    "logo": "assets/channel-logos/550.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/5T2riBK.png"
  },
  {
    "number": 659,
    "title": "VICE TV",
    "logo": "assets/channel-logos/659.png",
    "categories": [
      "popular",
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "popular",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/WyYFpQC.png"
  },
  {
    "number": 260,
    "title": "Vodafone Sport",
    "logo": "assets/channel-logos/260.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/iODkpAA.png"
  },
  {
    "number": 655,
    "title": "WETV USA",
    "logo": "assets/channel-logos/655.png",
    "categories": [
      "entertainment"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "lifestyle",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/oau6Gfj.png"
  },
  {
    "number": 346,
    "title": "Willow Cricket",
    "logo": "assets/channel-logos/346.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/HHesxY4.png"
  },
  {
    "number": 763,
    "title": "YES Network USA",
    "logo": "assets/channel-logos/763.png",
    "categories": [
      "sports"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "sports",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/vgbwhTF.png"
  },
  {
    "number": 837,
    "title": "Yes TV CA",
    "logo": "assets/channel-logos/837.png",
    "categories": [
      "entertainment",
      "movies"
    ],
    "labels": [
      "_tv_search",
      "daddy",
      "entertainment",
      "movies",
      "z_changed"
    ],
    "remoteLogo": "https://i.imgur.com/of22vu0.png"
  }
];

export const liveCatalogue=[...baseCatalogue,...liveAdditionalChannels].sort((a,b)=>a.title.localeCompare(b.title,'en'));
