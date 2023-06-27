
import { Database } from "bun:sqlite";


export const getDB = function () {
  const db = new Database("permits.sqlite", { create: true });
  const Counties = [
    "ADAMS", "ASOTIN", "BENTON_COUNTY", "CHELAN", "CLALLAM", "CLARK", "COLUMBIA", "COWLITZ", "DOUGLAS", "FERRY",
    "FRANKLIN", "GARFIELD", "GRANT", "GRAYS_HARBOR", "ISLAND", "JEFFERSON", "KING", "KITSAP", "KITTITAS", "KLICKITAT",
    "LEWIS", "LINCOLN", "MASON", "OKANOGAN", "PACIFIC", "PEND_OREILLE", "PIERCE", "SAN_JUAN",
    "SKAGIT", "SKAMANIA", "SNOHOMISH", "SPOKANE", "STEVENS", "THURSTON", "WAHKIAKUM", "WALLA_WALLA", "WHATCOM", "WHITMAN"
  ];
  interface Counties {
    [key: string]: any[];
  }
  const countieData: Counties = {
    "ADAMS": [],
    "ASOTIN": [],
    "BENTON_COUNTY": [],
    "CHELAN": [],
    "CLALLAM": [],
    "CLARK": [],
    "COLUMBIA": [],
    "COWLITZ": [],
    "DOUGLAS": [],
    "FERRY": [],
    "FRANKLIN": [],
    "GARFIELD": [],
    "GRANT": [],
    "GRAYS_HARBOR": [],
    "ISLAND": [],
    "JEFFERSON": [],
    "KING": [],
    "KITSAP": [],
    "KITTITAS": [],
    "KLICKITAT": [],
    "LEWIS": [],
    "LINCOLN": [],
    "MASON": [],
    "OKANOGAN": [],
    "PACIFIC": [],
    "PEND_OREILLE": [],
    "PIERCE": [],
    "SAN_JUAN": [],
    "SKAGIT": [],
    "SKAMANIA": [],
    "SNOHOMISH": [],
    "SPOKANE": [],
    "STEVENS": [],
    "THURSTON": [],
    "WAHKIAKUM": [],
    "WALLA_WALLA": [],
    "WHATCOM": [],
    "WHITMAN": []
  };  
for (let i = 0; i < Counties.length; i++) {
  // Define the table name  
  // Retrieve all columns from the table
  const query = db.query(`SELECT * from ${Counties[i]}`);
  
  const rows = query.all();
    // Iterate over the rows and create objects for each column
    rows.forEach((row:any) => {
        
        const column = {
            Id: row.Id,
            AppliedDate: row.AppliedDate,
            RequestedDate: row.RequestedDate,
            InspectedDate: row.InspectedDate,
            Owner: row.Owner,
            Address: row.Address,
            City: row.City,
            County: row.County,
            Status: row.Status,
            Description: row.Description,
        };
    
        // Add the column object to the result array
        countieData[Counties[i]].push(column);
    });
  }

  
    // Log the result array
    console.log('Database retrieved.');
    // Close the database connection
    db.close();

    return countieData;
}


