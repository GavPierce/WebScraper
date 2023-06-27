import { Database } from "bun:sqlite";

let db: Database = Database.open("permits.sqlite");
const Counties = [
  "ADAMS", "ASOTIN", "BENTON_COUNTY", "CHELAN", "CLALLAM", "CLARK", "COLUMBIA", "COWLITZ", "DOUGLAS", "FERRY",
  "FRANKLIN", "GARFIELD", "GRANT", "GRAYS_HARBOR", "ISLAND", "JEFFERSON", "KING", "KITSAP", "KITTITAS", "KLICKITAT",
  "LEWIS", "LINCOLN", "MASON", "OKANOGAN", "PACIFIC", "PEND_OREILLE", "PIERCE", "SAN_JUAN",
  "SKAGIT", "SKAMANIA", "SNOHOMISH", "SPOKANE", "STEVENS", "THURSTON", "WAHKIAKUM", "WALLA_WALLA", "WHATCOM", "WHITMAN"
];

for (let i = 0; i < Counties.length; i++) {
  db.exec(`DROP TABLE IF EXISTS ${Counties[i]};`)
  db.exec(`create table if not exists ${Counties[i]} (
    Id TEXT PRIMARY KEY,
    AppliedDate TEXT,
    RequestedDate TEXT,
    InspectedDate TEXT,
    Owner TEXT,
    Address TEXT,
    City TEXT,
    County TEXT,
    Status TEXT,
    Description TEXT
  )`);
}


