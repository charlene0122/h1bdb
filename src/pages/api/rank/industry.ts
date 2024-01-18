// Connect to AWS
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

export type IndustryRank = {
  name: string;
  avg_salary: string;
};

type ResponseData = {
  result: IndustryRank[] | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    let sqlQuery = ` 
    SELECT e.city, e.state, COUNT(*) AS num_application
    FROM Cases c JOIN Employers e on e.id = c.employer_id
    WHERE c.job_title NOT IN (
        SELECT job_title
        FROM Positions
        WHERE job_title LIKE '%software%'
    ) AND e.naics_code NOT IN (
        SELECT naics_code
        FROM Industry
        WHERE name LIKE '%computer%'
    )
    GROUP BY e.city, e.state
    ORDER BY num_application DESC
    LIMIT 5;
        `;
    const result = await query(sqlQuery);
    res.status(200).json(result.rows);

    res.status(404);
  } catch (error) {
    // In case of an error, send an appropriate response
    console.error("Error executing query", error);
    res.status(500).json({ result: "An error occurred" });
  }
}
