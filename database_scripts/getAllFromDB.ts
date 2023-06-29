
export const getDB = async function (prisma: any) {
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

  let tableName = Counties[i];
  
  const rows = await prisma[tableName].findMany();
  // Iterate over the rows and create objects for each column
    rows.forEach((row:any) => {
        
        const column = {
            id: row.id,
            appliedDate: row.appliedDate,
            requestedDate: row.requestedDate,
            inspectedDate: row.inspectedDate,
            owner: row.owner,
            address: row.address,
            city: row.city,
            county: row.county,
            status: row.status,
            description: row.description,
        };
    
        // Add the column object to the result array
        countieData[Counties[i]].push(column);
    });
  }

  
    // Log the result array
    console.log('Database retrieved.', countieData);

    return countieData;
}


