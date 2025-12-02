export type FeedId =
  | "ace"
  | "bdfm"
  | "g"
  | "jz"
  | "nqrw"
  | "l"
  | "main"
  | "si"
  | "lirr"
  | "mnr";

export type FeedMode = "subway" | "commuter";

export interface FeedDescriptor {
  id: FeedId;
  name: string;
  routes: string[];
  mode: FeedMode;
  url: string;
}

export const feedCatalog: FeedDescriptor[] = [
  {
    id: "ace",
    name: "A/C/E & Rockaway Shuttle",
    routes: ["A", "C", "E", "S (Rockaway)"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace"
  },
  {
    id: "bdfm",
    name: "B/D/F/M",
    routes: ["B", "D", "F", "M"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm"
  },
  {
    id: "g",
    name: "G",
    routes: ["G"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g"
  },
  {
    id: "jz",
    name: "J/Z",
    routes: ["J", "Z"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz"
  },
  {
    id: "nqrw",
    name: "N/Q/R/W",
    routes: ["N", "Q", "R", "W"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw"
  },
  {
    id: "l",
    name: "L",
    routes: ["L"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l"
  },
  {
    id: "main",
    name: "1/2/3/4/5/6/7 & Times Square Shuttle",
    routes: ["1", "2", "3", "4", "5", "6", "7", "S"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"
  },
  {
    id: "si",
    name: "Staten Island Railway",
    routes: ["SIR"],
    mode: "subway",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si"
  },
  {
    id: "lirr",
    name: "Long Island Rail Road",
    routes: ["LIRR"],
    mode: "commuter",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/lirr%2Fgtfs-lirr"
  },
  {
    id: "mnr",
    name: "Metro-North Railroad",
    routes: ["Metro-North"],
    mode: "commuter",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr"
  }
];

const feedMap: Record<FeedId, FeedDescriptor> = feedCatalog.reduce(
  (map, feed) => ({ ...map, [feed.id]: feed }),
  {} as Record<FeedId, FeedDescriptor>
);

export const getFeedDescriptor = (feedId: string): FeedDescriptor | undefined => {
  return feedMap[feedId as FeedId];
};
