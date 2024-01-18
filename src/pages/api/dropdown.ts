// Connect to AWS
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

type ResponseData = {
  result: string[] | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const criteria = req.query.criteria as string;

    let sqlQuery = "";

    if (criteria === "city") {
      const state = req.query.state as string;
      sqlQuery = `SELECT DISTINCT city FROM Employers WHERE state='${state}' ORDER BY city;`;
      const result = await query(sqlQuery);

      if (Array.isArray(result.rows)) {
        const citySet = new Set(); // For deduplication
        const cleanedRows = result.rows.map((row) => {
          if (typeof row.city === "string") {
            const trimmedCity = row.city.trim();
            citySet.add(trimmedCity);
          }
        });
        res.status(200).json({ result: Array.from(citySet) as string[] });
      } else {
        res.status(200).json({ result: [] });
      }
    }
    if (criteria === "state") {
      sqlQuery = "SELECT DISTINCT state FROM Employers ORDER BY state;";
      const result = await query(sqlQuery);
      const slicedRows = result.rows.slice(1);
      res.status(200).json({ result: slicedRows.map((obj: any) => obj.state) });
    }
    if (criteria === "job_category") {
      sqlQuery = "SELECT DISTINCT soc_title FROM JobClass ORDER BY soc_title;";
      const result = await query(sqlQuery);
      res.status(200).json(result.rows);
    }

    // Send results
    // res.status(200).json(result.rows);
  } catch (error) {
    // In case of an error, send an appropriate response
    console.error("Error executing query", error);
    res.status(500).json({ result: "An error occurred" });
  }
}
