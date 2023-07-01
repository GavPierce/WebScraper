import { formData } from "../viewState";
import { viewData } from "./types";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';



let prisma = new PrismaClient();

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
const waitSecondsAndContinue = async (seconds: number) => {
  console.error(`Waiting ${seconds}sec and trying again`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
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
        //Camel Case it
        headers[i] = headers[i].replace(headers[i][0],headers[i][0].toLowerCase());
        
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


const insertIntoDatabase = async (permitArray: RowObject[], county: number): Promise<number> => {
  let newPermits = 0;
  for (const obj of permitArray) {

    const permitExists = await prisma[Counties[county]].findFirst({
      where: {
        id: obj.id
      }
    });
    if (permitExists) {
      return newPermits;
    }
    if (!permitExists) {
      await prisma[Counties[county]].create({
        data: obj
      });
      newPermits++;
    }
  }
  return newPermits;
}
const  getIntialRequest = async (county: number): Promise<string| null> => {

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
  try {
      // @ts-expect-error Type issue with Headers in Fetch

    const req = await fetch(url, data);
    
    const res = (await req.text()) as any;
  
  
    return res;
  
  
  }catch (error){
    return null;
  }
}

export const scrapeAllCounties = async () => {
  console.time("WebScrape");
  let totalNewPermits = 0;
  let fetchTrys = 0;
  for (let x = 1; x < Counties.length; x++ ){

    let firstResult: string|null = await getIntialRequest(x);
    if (firstResult == null) {
      fetchTrys++;
      console.log(`Error getting permits for ${Counties[x]}. Trying again. ${fetchTrys}/5`)
      await waitSecondsAndContinue(30);
      if (fetchTrys == 5) {
        fetchTrys = 0;
        break;
      }
      x -= 1;
      continue;
    }

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

          // @ts-expect-error Type issue with Headers in Fetch
          const response = await fetch(url, data);
          const result = (await response.text()) as any;
          newFormData = {
            viewState: getViewDataFromHtml(result),
            eventState: getEventValidationFromHtml(result)
          }
          
          let table = getTableFromHtml(result);
          let permits = createListFromTable(table);

          newPermitsAdded += await insertIntoDatabase(permits, x);
          if (newPermitsAdded == 0) {
            break;
          }
        } catch (error) {
          await waitSecondsAndContinue(30);
  
          i -= 1;
          continue;
        }
        
        pageNumber++;
    }
    totalNewPermits += newPermitsAdded;
    console.log(`Finished ${Counties[x]}. ${newPermitsAdded} new Permits added.`);
  }
  console.log(`Finished WebScrape! ${totalNewPermits} new permits added. Have a nice day.`);
  console.timeEnd("WebScrape");
}