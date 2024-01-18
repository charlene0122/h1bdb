// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db"; // Ensure this path is correct

//elastic search client
const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: "https://bd17000e9ecd4823b01c201238257db9.us-central1.gcp.cloud.es.io:443",
  auth: {
    apiKey: "YWpMdVg0d0JaYWRnUV9sZUwwMmI6bVpZYmdiRzhUVkt5M19ZMmtLVm9VUQ==",
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    // Modify the SQL query to use the prefix
    const sqlQuery = "SELECT id, name FROM Employers;";
    const result = await query(sqlQuery);

    await client.deleteByQuery({
      index: "search-company",
      body: {
        query: {
          match_all: {},
        },
      },
    });

    //code to upload to elasticsearch
    // Index with the bulk helper
    const upoloadResult = await client.helpers.bulk({
      datasource: result.rows,
      pipeline: "ent-search-generic-ingestion",
      onDocument: () => ({ index: { _index: "search-company" } }),
    });

    // Send the names as response
    res.status(200).json(upoloadResult);
  } catch (error) {
    // In case of an error, send an appropriate response
    console.error("Error executing query", error);
    res.status(500).json("An error occurred");
  }
}
