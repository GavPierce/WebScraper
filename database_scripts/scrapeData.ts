import { formData } from "../viewState";
import { viewData } from "./types";
const Counties = [
  "Counties", "ADAMS", "ASOTIN", "BENTON_COUNTY", "CHELAN", "CLALLAM", "CLARK", "COLUMBIA", "COWLITZ", "DOUGLAS", "FERRY",
  "FRANKLIN", "GARFIELD", "GRANT", "GRAYS_HARBOR", "ISLAND", "JEFFERSON", "KING", "KITSAP", "KITTITAS", "KLICKITAT",
  "LEWIS", "LINCOLN", "MASON", "OKANOGAN", "PACIFIC", "PEND_OREILLE", "PIERCE", "SAN_JUAN",
  "SKAGIT", "SKAMANIA", "SNOHOMISH", "SPOKANE", "STEVENS", "THURSTON", "WAHKIAKUM", "WALLA_WALLA", "WHATCOM", "WHITMAN"
];
const url: string = 'https://secure.lni.wa.gov/epispub/frmPermitSearchMain.aspx';
interface RowObject {
  [key: string]: string;
}
/**
 * 
 * Scrape Data from WA Permits site
 * 
 * Order of Operations:
 *    1) Make request for for site and get initial viewState. (Site is asp.net)
 *    2) Make second request to get first page including total results number. (Use this number to see how many times to fetch the page)
 *    3) Iterate x number of times and store page data to DB.
 */

const getViewDataFromHtml = (htmlDocument: string):string => {
  const regex = /<input[^>]+id="__VIEWSTATE"[^>]+value="([^"]+)"/i;
  const match = htmlDocument.match(regex);
  
  if (match && match[1]) {
    return encodeURIComponent(match[1]);
  }
  
  return '';
}
const getEventValidationFromHtml = (htmlDocument: string):string  => {
  const regex = /<input[^>]+id="__EVENTVALIDATION"[^>]+value="([^"]+)"/i;
  const match = htmlDocument.match(regex);
  
  if (match && match[1]) {
    return encodeURIComponent(match[1]);
  }
  
  return '';
}
const getTableFromHtml = (htmlDocument: string): string => {
  const htmlString = htmlDocument;

  const tableRegex = /<table\b[^>]*id=["']table2["'][^>]*>([\s\S]*?)<\/table>/i;

  const match = htmlString.match(tableRegex);

  if (match) {
    const tableHTML = match[0];
    let tableWithoutATags =  tableHTML.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
    let result = tableWithoutATags.replace(/&nbsp;/g, "");
    let noApostrophes = result.replace(/'/g, "");
    return noApostrophes;
  } else {
    return 'NOT FOUND';
  }
}

const createListFromTable = (tableString: string) => {
  console.log('Getting Permits from this string:', tableString);
  const htmlString: string = tableString;

  const headers: string[] = [
    'Id',
    'AppliedDate',
    'RequestedDate',
    'InspectedDate',
    'Owner',
    'Address',
    'City',
    'County',
    'Status',
    'Description'
  ];

  const trRegex: RegExp = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex: RegExp = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;


  const rows: RowObject[] = [];
  let match: RegExpExecArray | null;

  while ((match = trRegex.exec(htmlString)) !== null) {
    const tdMatches: RegExpMatchArray | null = match[1].match(tdRegex);
    const rowObject: RowObject = {};

    if (tdMatches) {
      for (let i = 0; i < tdMatches.length; i++) {
        const tdContent: string = tdMatches[i].replace(/<\/?td\b[^>]*>/gi, '');
        rowObject[headers[i]] = tdContent.trim();
      }
    }

    rows.push(rowObject);
  }
  rows.shift();
  rows.pop();
  rows.shift();
  rows.shift();
  return rows;
}


const insertIntoDatabase = (permitArray: RowObject[], county: number, db: any): number => {
  db.run(`
  CREATE TABLE IF NOT EXISTS ${Counties[county]} (
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
  )`
);
  // Insert each object into the table

  let newPermits = 0;
  
  console.log('DATABASE OPERATIONS');
  permitArray.forEach(obj => {
    const columns = Object.keys(obj).join(',');
    const values = Object.values(obj).map(value => `'${value}'`).join(',');

    const selectSql = db.query(`SELECT 1 FROM ${Counties[county]} WHERE Id = '${obj.Id}'`);
    
    if (!selectSql.get()) {
      const insertSql = `INSERT INTO ${Counties[county]} (${columns}) VALUES (${values})`;
      db.run(insertSql);
      newPermits++;
    }
  
});

  console.log('DB Updated');
  return newPermits;
}
const  getIntialRequest = async (county: number): Promise<string> => {

  let initialData = formData(0,undefined,county);
  // get current View State and EventValidation strings
    let data = {
      method: "POST",
      body: initialData,
      verbose: false,
      headers: {
        "Content-Length": 13994,
        "Content-Type": 'application/x-www-form-urlencoded',
        "Connection": "keep-alive"
      },
  };
  
  // @ts-expect-error Type issue with Headers in Fetch
  const req = await fetch(url, data);
  
  const res = (await req.text()) as any;
  
  
  return res;
}

export const scrapeAllCounties = async (db:any) => {
  console.time("WebScrape");

  for (let x = 1; x < Counties.length; x++ ){
    let firstResult:string = await getIntialRequest(x);
    const resultsPerPage = 20;
    let numberOfRecordsIndex = firstResult.indexOf('Permits - '); 
    let numberOfRecords = parseInt(firstResult.slice(numberOfRecordsIndex+ 10, numberOfRecordsIndex + 14));
    const numberOfPages = Math.ceil(numberOfRecords / resultsPerPage);
  
    let newFormData:viewData = {
      viewState: getViewDataFromHtml(firstResult),
      eventState: getEventValidationFromHtml(firstResult)
    }
  
    console.log(`${Counties[x]}s Permits in last year:`,  numberOfRecords);
    let pageNumber = 0;
    let data = {
      method: "POST",
      body: '',
      verbose: false,
      headers: {
        "Content-Length": 13994,
        "Content-Type": 'application/x-www-form-urlencoded',
        "Connection": "keep-alive"
      },
    };
  
  
    let newPermitsAdded = 0;
  
    // WEB SCRAPE ALL THE PAGES
    for(let i = 0; i < numberOfPages; i++) {
  
      let bodyString = formData(pageNumber, newFormData, x);
      data.body = bodyString;
  
        if (i === 11 ) {
          pageNumber = 2;
        }
        if (i > 11 && pageNumber === 12) {
          pageNumber = 2;
        }
        
        
        try {
          console.log('Making Fetch Request');

            // @ts-expect-error Type issue with Headers in Fetch
          const response = await fetch(url, data);
          const result = (await response.text()) as any;
          console.log('Response Received;')
          newFormData = {
            viewState: getViewDataFromHtml(result),
            eventState: getEventValidationFromHtml(result)
          }
          
          console.log('Getting Permits...');
          let table = getTableFromHtml(result);
          console.log('Table Found. Getting Permits')
          let permits = createListFromTable(table);
         // console.log(pageNumber, '\x1b[36m%s\x1b[0m', permits[0].Owner);  //cyan
          //console.log(`Succsefully scraped page ${i}/${numberOfPages} of ${Counties[x]}. Found ${permits.length} on page.`);

          console.log('Inserting into DB');
          newPermitsAdded += insertIntoDatabase(permits, x,db);
        } catch (error) {
          console.error(`Error scraping page ${i}:`, error);
          console.error(`Waiting 30sec and trying again`);
          await new Promise(resolve => setTimeout(resolve, 30000));
  
          i -= 1;
          // Handle the error gracefully
          // Continue with the loop or take appropriate action
        }
  
        pageNumber++;
    }
    console.log(`Finished ${Counties[x]}. ${newPermitsAdded} new Permits added.`);
  }
  console.log(`Finished WebScrape! Have a nice day.`);
  console.timeEnd("WebScrape");
}