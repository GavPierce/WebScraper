
import { getDB } from "./database_scripts/getAllFromDB";
import { fuzzySearch } from "./Utils/fuzzySearch";
import { scrapeAllCounties } from "./database_scripts/scrapeData";
const schedule = require('node-schedule');
const Counties = [
  "FIRST", "ADAMS", "ASOTIN", "BENTON_COUNTY", "CHELAN", "CLALLAM", "CLARK", "COLUMBIA", "COWLITZ", "DOUGLAS", "FERRY",
  "FRANKLIN", "GARFIELD", "GRANT", "GRAYS_HARBOR", "ISLAND", "JEFFERSON", "KING", "KITSAP", "KITTITAS", "KLICKITAT",
  "LEWIS", "LINCOLN", "MASON", "OKANOGAN", "PACIFIC", "PEND_OREILLE", "PIERCE", "SAN_JUAN",
  "SKAGIT", "SKAMANIA", "SNOHOMISH", "SPOKANE", "STEVENS", "THURSTON", "WAHKIAKUM", "WALLA_WALLA", "WHATCOM", "WHITMAN"
];
let database = getDB();

const job = schedule.scheduleJob('0 7 * * *',  async () =>{
  console.log('Running Daily Scrape', new Date());
  await scrapeAllCounties();
  database = getDB();
});
const port = parseInt(process.env.PORT || "8080");

const server = Bun.serve({
  port: port,
  fetch(req,res) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      console.log("New Connection From:", req.headers.get('sec-ch-ua'),new Date())  
      return new Response(Bun.file('index.html'))
    };
    
    if (url.pathname.includes("/search")) {    
      const params = new URLSearchParams(url.search);
      const query = params.get("searchTerm");
      const county:string = params.get("county") as string;
      
      console.log(query, county);
      let filteredResult = fuzzySearch(query, database[Counties[parseInt(county)]]);
      return new Response(JSON.stringify(filteredResult));
    };

    if (url.pathname === "/runScrape") {
      console.log('Running Scrape', new Date());
      scrapeAllCounties().then(()=>{
        database = getDB();
      });
      return new Response(Bun.file('index.html'));
    };
    return new Response(`404!`); 
   },
});

console.log('Running on port 8080', new Date());