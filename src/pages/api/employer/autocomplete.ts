// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db"; // Ensure this path is correct

//elastic search client
const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: process.env.ELASTICSEARCH_API_NODE,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY,
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
