
import result from "./database_scripts/getAllFromDB";
import { fuzzySearch } from "./Utils/fuzzySearch";
import { dailyScrape } from "./database_scripts/dailyScrape";
import cron from 'node-cron';

cron.schedule(`0 1 * * *`, async () => {
  console.log('Running Daily Scrape');
  dailyScrape();
});
const port = parseInt(process.env.PORT || "8080");

const server = Bun.serve({
  port: port,
  fetch(req,res) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response(Bun.file('index.html'));
    
    if (url.pathname === "/search") {    

      let query = url.searchParams.toString().replace("=",'');
      console.log(query)
      let filteredResult = fuzzySearch(query,result);
      return new Response(JSON.stringify(filteredResult));
    };
    return new Response(`404!`); 
   },
});

console.log('Running on port 8080', new Date());