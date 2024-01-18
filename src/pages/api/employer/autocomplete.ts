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

export type NameEntry = {
  name: string;
  id: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NameEntry[] | string>
) {
  try {
    // Extract the 'prefix' parameter from the query string
    const { prefix } = req.query;
    const response = await client.search({
      index: "search-company",
      body: {
        query: {
          prefix: {
            name: prefix,
          },
        },
      },
    });
    const names = response?.hits?.hits?.map((hit: any) => ({
      name: hit?._source?.name,
      id: hit?._source?.id,
    }));
    res.status(200).json(names);
  } catch (error) {
    // In case of an error, send an appropriate response
    console.error("Error executing query", error);
    res.status(500).json("An error occurred");
  }
}
