
import { Database } from "bun:sqlite";

const db = new Database("permits.sqlite", { create: true });

// Define the table name
const tableName = 'Permits';

// Retrieve all columns from the table
const query = db.query(`SELECT * from ${tableName}`);

const rows = query.all();
// Create an empty array to store the result
const result:any=[] ;
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
    result.push(column);
});

  // Log the result array

  // Close the database connection
  db.close();

export default result;