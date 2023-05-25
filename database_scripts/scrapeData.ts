import { formData } from "../viewState";
import { Database } from "bun:sqlite";
import { viewData } from "./types";

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


const insertIntoDatabase = (permitArray: RowObject[]) => {
  db.run(`
  CREATE TABLE IF NOT EXISTS Permits (
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
  permitArray.forEach(obj => {
    const columns = Object.keys(obj).join(',');
    const values = Object.values(obj).map(value => `'${value}'`).join(',');

    const selectSql = db.query(`SELECT 1 FROM Permits WHERE Id = '${obj.Id}'`);
    
    if (!selectSql.get()) {
      const insertSql = `INSERT INTO Permits (${columns}) VALUES (${values})`;
      db.run(insertSql);
    }
  
});
}
const  getIntialRequest = async (): Promise<string> => {

  let initialData = formData(0);
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
const db = new Database("permits.sqlite", { create: true });


let firstResult:string = await getIntialRequest();
const resultsPerPage = 20;
let numberOfRecordsIndex = firstResult.indexOf('Permits - '); 
let numberOfRecords = parseInt(firstResult.slice(numberOfRecordsIndex+ 10, numberOfRecordsIndex + 14));
const numberOfPages = Math.ceil(numberOfRecords / resultsPerPage);

let newFormData:viewData = {
  viewState: getViewDataFromHtml(firstResult),
  eventState: getEventValidationFromHtml(firstResult)
}


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

// WEB SCRAPEALL PAGES
console.time("WebScrape");
for(let x = 0; x < numberOfPages; x++) {

  let bodyString = formData(pageNumber,newFormData);
  data.body = bodyString;

    if (x === 11 ) {
      pageNumber = 2;
    }
    if (x > 11 && pageNumber === 12) {
      pageNumber = 2;
    }
    
    
    try {
      const response = await fetch(url, data);
      const result = (await response.text()) as any;

      newFormData = {
        viewState: getViewDataFromHtml(result),
        eventState: getEventValidationFromHtml(result)
      }
      
      let permits = createListFromTable(getTableFromHtml(result));

      console.log(`Succsefully scraped page ${x}/${numberOfPages}. Found ${permits.length} on page.`);
      insertIntoDatabase(permits);
    } catch (error) {
      console.error(`Error scraping page ${x}:`, error);
      console.error(`Waiting 30sec and trying again`);
      await new Promise(resolve => setTimeout(resolve, 30000));

      x -= 1;
      // Handle the error gracefully
      // Continue with the loop or take appropriate action
    }

    pageNumber++;
}
console.timeEnd("WebScrape");


