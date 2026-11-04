/** User-supplied scene media. Originals remain untouched; videos are byte-identical copies.
 * Images are resized JPEG display derivatives. Day/night variants follow the artwork clock;
 * single clips retain their supplied look. These are artwork scenes, not documentary recordings.
 */
export const LANDMARK_MEDIA=Object.freeze({
  "bund": {
    "default": {
      "image": "../assets/landmark-media/bund.jpg",
      "video": "../assets/landmark-media/bund.mp4"
    }
  },
  "jing-an-temple": {
    "default": {
      "image": "../assets/landmark-media/jing-an-temple.jpg",
      "video": "../assets/landmark-media/jing-an-temple.mp4"
    }
  },
  "lane-renewal": {
    "default": {
      "image": "../assets/landmark-media/lane-renewal.jpg",
      "video": "../assets/landmark-media/lane-renewal.mp4"
    }
  },
  "grand-opera": {
    "default": {
      "image": "../assets/landmark-media/grand-opera.jpg",
      "video": "../assets/landmark-media/grand-opera.mp4"
    }
  },
  "thousand-trees": {
    "default": {
      "image": "../assets/landmark-media/thousand-trees.jpg",
      "video": "../assets/landmark-media/thousand-trees.mp4"
    }
  },
  "west-bund-dream-center": {
    "default": {
      "image": "../assets/landmark-media/west-bund-dream-center.jpg",
      "video": "../assets/landmark-media/west-bund-dream-center.mp4"
    }
  },
  "indoor-botanic": {
    "default": {
      "image": "../assets/landmark-media/indoor-botanic.jpg",
      "video": "../assets/landmark-media/indoor-botanic.mp4"
    }
  },
  "people-square": {
    "day": {
      "image": "../assets/landmark-media/people-square-day.jpg",
      "video": "../assets/landmark-media/people-square-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/people-square-night.jpg",
      "video": "../assets/landmark-media/people-square-night.mp4"
    }
  },
  "suzhou-creek": {
    "day": {
      "image": "../assets/landmark-media/suzhou-creek-day.jpg",
      "video": "../assets/landmark-media/suzhou-creek-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/suzhou-creek-night.jpg",
      "video": "../assets/landmark-media/suzhou-creek-night.mp4"
    }
  },
  "shanghai-tower": {
    "day": {
      "image": "../assets/landmark-media/shanghai-tower-day.jpg",
      "video": "../assets/landmark-media/shanghai-tower-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/shanghai-tower-night.jpg",
      "video": "../assets/landmark-media/shanghai-tower-night.mp4"
    }
  },
  "yuyuan": {
    "day": {
      "image": "../assets/landmark-media/yuyuan-day.jpg"
    },
    "night": {
      "image": "../assets/landmark-media/yuyuan-night.jpg"
    }
  },
  "wukang-road": {
    "day": {
      "image": "../assets/landmark-media/wukang-road-day.jpg",
      "video": "../assets/landmark-media/wukang-road-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/wukang-road-night.jpg",
      "video": "../assets/landmark-media/wukang-road-night.mp4"
    }
  },
  "yangpu-riverside": {
    "day": {
      "image": "../assets/landmark-media/yangpu-riverside-day.jpg",
      "video": "../assets/landmark-media/yangpu-riverside-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/yangpu-riverside-night.jpg",
      "video": "../assets/landmark-media/yangpu-riverside-night.mp4"
    }
  },
  "hongqiao-station": {
    "day": {
      "image": "../assets/landmark-media/hongqiao-station-day.jpg",
      "video": "../assets/landmark-media/hongqiao-station-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/hongqiao-station-night.jpg",
      "video": "../assets/landmark-media/hongqiao-station-night.mp4"
    }
  },
  "dishui-lake": {
    "day": {
      "image": "../assets/landmark-media/dishui-lake-day.jpg",
      "video": "../assets/landmark-media/dishui-lake-day.mp4"
    },
    "night": {
      "image": "../assets/landmark-media/dishui-lake-night.jpg",
      "video": "../assets/landmark-media/dishui-lake-night.mp4"
    }
  },
  "cpc-first-congress": {
    "day": {
      "image": "../assets/landmark-media/cpc-first-congress-day.jpg"
    },
    "night": {
      "image": "../assets/landmark-media/cpc-first-congress-night.jpg"
    }
  },
  "oriental-pearl": {
    "default": {
      "image": "../assets/landmark-media/bund.jpg"
    }
  }
});

/** Relative paths resolve against this module, so callers can move independently. */
export function selectLandmarkMedia(id,hour=12){
 const item=LANDMARK_MEDIA[id];if(!item)return null;
 const safeHour=Number.isFinite(hour)?Math.max(0,Math.min(168,hour)):12;
 const clock=safeHour%24,wanted=clock>=6&&clock<18.5?'day':'night';
 const variant=item[wanted]?wanted:item.default?'default':item.day?'day':'night';
 const media=item[variant];if(!media)return null;
 const image=media.image?new URL(media.image,import.meta.url).href:undefined;
 return media.video?{kind:'video',src:new URL(media.video,import.meta.url).href,poster:image,variant}:{kind:'image',src:image,variant};
}
