import { getCounty } from "./database_scripts/getAllFromCounty.js";
import { fuzzySearch } from "./Utils/fuzzySearch";
import { scrapeAllCounties } from "./database_scripts/scrapeData";
import Fastify from "fastify";
import fs from "fs";

import path from "path";
const fastify = Fastify({
  logger: false,
});

import { PrismaClient } from "@prisma/client";

let prisma = new PrismaClient();

const port = parseInt(process.env.PORT || "8080");

import schedule from "node-schedule";
const Counties = [
  "FIRST",
  "ADAMS",
  "ASOTIN",
  "BENTON_COUNTY",
  "CHELAN",
  "CLALLAM",
  "CLARK",
  "COLUMBIA",
  "COWLITZ",
  "DOUGLAS",
  "FERRY",
  "FRANKLIN",
  "GARFIELD",
  "GRANT",
  "GRAYS_HARBOR",
  "ISLAND",
  "JEFFERSON",
  "KING",
  "KITSAP",
  "KITTITAS",
  "KLICKITAT",
  "LEWIS",
  "LINCOLN",
  "MASON",
  "OKANOGAN",
  "PACIFIC",
  "PEND_OREILLE",
  "PIERCE",
  "SAN_JUAN",
  "SKAGIT",
  "SKAMANIA",
  "SNOHOMISH",
  "SPOKANE",
  "STEVENS",
  "THURSTON",
  "WAHKIAKUM",
  "WALLA_WALLA",
  "WHATCOM",
  "WHITMAN",
];

const job = schedule.scheduleJob("0 7 * * *", async () => {
  console.log("Running Daily Scrape", new Date());
  await scrapeAllCounties();
});

// WEB SERVER

fastify.get("/", async (request, reply) => {
  console.log("New Connection From:", request.headers["sec-ch-ua"], new Date());
  const filePath = "index.html";
  const fileContent = await fs.promises.readFile(filePath, "utf-8");
  reply.type("text/html").send(fileContent);
});

fastify.get("/search", async (request: any, reply) => {
  const query = request.query.searchTerm;
  const county = request.query.county;

  let countyData = await getCounty(prisma, Counties[parseInt(county)]);

  let filteredResult = fuzzySearch(query, countyData);
  console.log(
    query,
    Counties[parseInt(county)],
    filteredResult.length,
    "/",
    countyData.length
  );

  reply.send(filteredResult);
});

fastify.get("/runScrape", async (request, reply) => {
  console.log("Running Scrape", new Date());
  await scrapeAllCounties();
  const filePath = "index.html";
  const fileContent = await fs.promises.readFile(filePath, "utf-8");
  reply.type("text/html").send(fileContent);
});

fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send("404!");
});

fastify.listen(port, "0.0.0.0", (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server is running on port ${port}`);
});
