import { Database } from "bun:sqlite";

interface RowObject {
    [key: string]: string;
  }

export const getTableFromHtml = (htmlDocument: string): string => {
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
  
  export const createListFromTable = (tableString: string) => {
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
  
  
export const insertIntoDatabase = (permitArray: RowObject[]) => {
    
    const db = new Database("permits.sqlite", { create: true });

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

  let newPermitsAdded = 0;
    // Insert each object into the table
  console.log('Permits:', permitArray);
  permitArray.forEach(obj => {
    const columns = Object.keys(obj).join(',');
    const values = Object.values(obj).map(value => `'${value}'`).join(',');

    const selectSql = db.query(`SELECT 1 FROM Permits WHERE Id = '${obj.Id}'`);
    
    if (!selectSql.get()) {
      const insertSql = `INSERT INTO Permits (${columns}) VALUES (${values})`;
      console.log(insertSql);

      db.run(insertSql);
      newPermitsAdded += 1;
    }
  
  });

  console.log('Inserted ', newPermitsAdded, ' new Permits');
  db.close();

}
export const dailyScrape = async function () {

    const url: string = 'https://secure.lni.wa.gov/epispub/frmPermitSearchMain.aspx';
    let body = '__EVENTTARGET=&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=%2FwEPDwULLTE1ODA4MDI3MzMPZBYEAgEPZBYCZg8WAh4EVGV4dAVlPHNjcmlwdCBzcmM9Imh0dHBzOi8vc2VjdXJlLmxuaS53YS5nb3YvZXduL3Y0L2phdmFzY3JpcHQvZXduSGVhZGVyLmpzIiB0eXBlPXRleHQvamF2YXNjcmlwdD48L3NjcmlwdD5kAgUPZBYGAgMPEGRkFgFmZAIjDxAPFgYeDURhdGFUZXh0RmllbGQFCkNvdW50eU5hbWUeDkRhdGFWYWx1ZUZpZWxkBQRDb2RlHgtfIURhdGFCb3VuZGdkEBUqAAVBREFNUwZBU09USU4NQkVOVE9OIENPVU5UWQZDSEVMQU4HQ0xBTExBTQVDTEFSSwhDT0xVTUJJQQdDT1dMSVRaB0RPVUdMQVMFRkVSUlkIRlJBTktMSU4IR0FSRklFTEQFR1JBTlQMR1JBWVMgSEFSQk9SBklTTEFORAlKRUZGRVJTT04ES0lORwZLSVRTQVAIS0lUVElUQVMJS0xJQ0tJVEFUBUxFV0lTB0xJTkNPTE4FTUFTT04IT0tBTk9HQU4OT1VUIE9GIENPVU5UUlkMT1VUIE9GIFNUQVRFB1BBQ0lGSUMMUEVORCBPUkVJTExFBlBJRVJDRQhTQU4gSlVBTgZTS0FHSVQIU0tBTUFOSUEJU05PSE9NSVNIB1NQT0tBTkUHU1RFVkVOUwhUSFVSU1RPTglXQUhLSUFLVU0LV0FMTEEgV0FMTEEHV0hBVENPTQdXSElUTUFOBllBS0lNQRUqAi0xATEBMgEzATQBNQE2ATcBOAE5AjEwAjExAjEyAjEzAjE0AjE1AjE2AjE3AjE4AjE5AjIwAjIxAjIyAjIzAjI0AjUyAjUxAjI1AjI2AjI3AjI4AjI5AjMwAjMxAjMyAjMzAjM0AjM1AjM2AjM3AjM4AjM5FCsDKmdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2RkAjMPPCsACwBkZB%2FTDZLDY%2BzlsPxT4AqefyU5fKrt%2FxyAhanZZcp6nr83&__VIEWSTATEGENERATOR=D19B23D8&__EVENTVALIDATION=%2FwEdAERS4kEtGXApFy4SzwIOG%2Fnb5OOUGOsA8aDxQtk9i7XsWSUA6Emly0kYzfd9KxUHbs8PqWkQXa6YSBp%2FIjGQpzLeUx4IG5GavhY3%2F%2B%2FtaHvejR0HVzHZX1f3TCeqD9KGa1D5OhluiqTjUBCzEfV%2BFPBeWUGGdoG%2FXIiV301N5VpdE7IXunfTo17UcvCdRE9BXCySVBBicaK71sB39GZ4ZhXGKwGuSF6774VqaqlPxG9GSCqYfMpySf1KYCaX9G%2FigakawauPfY01Pp35xKQYx7DTtwssKR7WrWYem%2BUIp%2BVWaENgRUt5BN71M0dr2c5xv4ANP3oE29G5lwtgjvAbiJjRbvUUhIWzxRAflpvi%2BlTww%2B56OksbtnHAK4S4Y1urdmqovy%2BxDYpmgwsb6Uf5b5JMDmkevBtqgk9nsW4QbYMxWi%2F%2FL8uRRC1T6T0pb4rSuPjmE0TBkjVRZFu9AacCksXGAzlHB7r2GEq9AF907XI3w2iytH0veB%2BnYCg2BWV0abW6DCQgyCf%2BX8xPn8VMPj7luxusYEa9nQoS832zmrsd2F%2B7c7EGuSgN%2BFtTm8NXCo2WNqYmaAdtaxFYDbOpr29DK9Z6rcSw4Uth9qXzj45NNKdkqS12zyKGjhwdPKeTGIifAQ%2BwbV5EymErHiiOBq4XUHUh4vKxFA2o6vxcMGqiPzFEw%2FhkgGrKp9WrwPiybGZYsQHHwwxxcbp1MHazTaFUQMMLLbCim9QiqxBTOf2OiOVxOhkOaZYjsv%2FptmdDe200yrOnBebc1uegi%2B3K9wP54paNjfbsdKh6WLithNjhS3D%2F5mP3FFYM%2F27ziYIaIG20hHjyfu%2BuyC6o%2FeOQXBOFkEBdv1L7rF2CASdRY1TFaJ4eJ6UxVv8hjBmsQ1jC6CddWFpDBAYG%2Bw4Z8MbvZuxVrCzsu7LvuFtBwyO5qodQlT7IKY4d4eElJOXM0d6N%2BAD343i1xFOhpWumAO0e%2FPg%2Buc4cO6a4uANeIqg25nPMrtvuIrI23GcLuqbZCxdlh5s2u8GKETvAFfZEyFPO%2FWosL0RJ1NvJuuWx20MUz1Mu2mRi7YUH3yy5AOojAWLWLAahXJz30n8NHtWI84cB8G%2F8mP6AeTw67GLiHCoyKXr0dQPQ1X9N7ntsDZNfUCTsWLgOGHlq9mGqCCPtz%2BYDfsppbVXmN%2ByKijC2TQ%2F0%2BxpO6vNeqCPRaUc%2F4%2BtEDnQp4PMu2bnzgJxtXYF1qIKlge4ZvxLlGnN0SqgL%2BFIBuTu9BqGze3l2Phejs2XN9qeYqQHSYD0UlTJoskFEjkpaS1TxF1y%2FtI4xjrC2PZOOd3yvnD3rDAsb45eUNGcg51m3z1roUOriy40q%2FAy0u27nvfbhH%2FvOWBNEQxsmmy2gqOzbi6Xt4rGEqoKecF5EUCa0YEmO1N1XNFmfsMXJasjxX85jNSjppuF2bb7UDYA4RD0LhRY680q0Jb05UwlqhLsgRVXB0o%2Fh2tDzWCFt5Np2UfkB&rdoPermitType=0&tbxPermitNumber=&tbxBegDate=10%2F30%2F2022&tbxEndDate=6%2F2%2F2023&tbxContractorId=&tbxBusinessName=&tbxLastName=&tbxFirstName=&tbxUBI=&tbxSiteOwner=&tbxSiteLastName=&tbxSiteFirstName=&tbxSiteAddr1=&tbxSiteCity=&lstSiteCounty=19&btnSearch=Look+up&URL=https%3A%2F%2Flni.wa.gov%2Flicensing-permits%2Felectrical%2Felectrical-permits-fees-and-inspections%2Fpurchase-permits-request-inspections'
    
    let data = {
        method: "POST",
        body: body,
        verbose: false,
        headers: {
            "Content-Length": 13994,
            "Content-Type": 'application/x-www-form-urlencoded',
            "Connection": "keep-alive"
        },
    };

    // @ts-expect-error Type issue with Headers in Fetch
    const response = await fetch(url, data);

    const result = (await response.text()) as any;

    let permits = createListFromTable(getTableFromHtml(result));
    console.log(new Date(), 'Ran Daily Scrape, permits found: ', permits.length);
    
    insertIntoDatabase(permits);
}



