import { Database } from "bun:sqlite";

let db: Database = Database.open("permits.sqlite");

db.exec(`create table if not exists Permits (
  Id, AppliedDate, RequestedDate, InspectedDate, Owner,
  Address, City, County, Status, Description
)`);
console.log(db.query("select * from Permits").all());


