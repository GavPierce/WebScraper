const { PrismaClient } = require("@prisma/client");



const Counties = [
  "ADAMS", "ASOTIN", "BENTON_COUNTY", "CHELAN", "CLALLAM", "CLARK", "COLUMBIA", "COWLITZ", "DOUGLAS", "FERRY",
  "FRANKLIN", "GARFIELD", "GRANT", "GRAYS_HARBOR", "ISLAND", "JEFFERSON", "KING", "KITSAP", "KITTITAS", "KLICKITAT",
  "LEWIS", "LINCOLN", "MASON", "OKANOGAN", "PACIFIC", "PEND_OREILLE", "PIERCE", "SAN_JUAN",
  "SKAGIT", "SKAMANIA", "SNOHOMISH", "SPOKANE", "STEVENS", "THURSTON", "WAHKIAKUM", "WALLA_WALLA", "WHATCOM", "WHITMAN"
];
for (let county of Counties) {
  console.log(`
  model ${county} {
    id           String  @id
    appliedDate  String
    requestedDate String
    inspectedDate String
    owner        String
    address      String
    city         String
    county       String
    status       String
    description  String
  }
  `)
}