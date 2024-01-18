import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

export type Position = {
  position: string;
  job_category: string;
  num_application: number;
  avg_salary: number;
};

type Data = {
  result: Position[] | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // Extract employer_id and other filters from query string or body
    const employerId =
      (req.query.employer_id as string) || req.body.employer_id;
    const jobCategory =
      (req.query.job_category as string) || req.body.job_category;
    const minSalary = parseInt(req.query.min_salary as string);
    const maxSalary = parseInt(req.query.max_salary as string);

    if (!employerId) {
      res.status(400).json({ result: "Employer ID is required" });
      return;
    }

    let sqlQuery = `
        WITH Employer_Positions AS (
            SELECT e.id as id, p.job_title as position,
                   ROUND(
                    CASE
                        WHEN wage_unit_of_pay = 'Hour'
                 THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,
                       wage_rate_of_pay_from * 2) / 2 * 2085.6
                        WHEN wage_unit_of_pay = 'Week'
                 THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,
                     wage_rate_of_pay_from * 2) / 2 * 52.14
                        WHEN wage_unit_of_pay = 'Bi-Weekly'
                 THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,
                     wage_rate_of_pay_from * 2) / 2 * 26.07
                        WHEN wage_unit_of_pay = 'Month'
                 THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,
                     wage_rate_of_pay_from * 2) / 2 * 12
                        WHEN wage_unit_of_pay = 'Year'
                 THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,
                    wage_rate_of_pay_from * 2) / 2
                    END
                , 2
              ) AS avg_salary
            FROM Employers e
            JOIN Positions p ON e.id = p.employer_id
            WHERE e.id = ?
        )
        SELECT ep.position, jc.soc_title as job_category, COUNT(*) as num_application, ep.avg_salary
             FROM Employer_Positions ep
             JOIN Cases c ON ep.id = c.employer_id AND ep.position = c.job_title
             JOIN JobClass jc ON c.soc_code = jc.soc_code
             
      `;

    const queryParams = [];
    const whereClauses = [];
    queryParams.push(employerId);

    if (jobCategory) {
      whereClauses.push("jc.soc_title LIKE ?");
      queryParams.push("%" + jobCategory + "%");
    }

    if (!isNaN(minSalary)) {
      whereClauses.push("ep.avg_salary > ?");
      queryParams.push(minSalary);
    }

    if (!isNaN(maxSalary)) {
      whereClauses.push("ep.avg_salary < ?");
      queryParams.push(maxSalary);
    }

    if (whereClauses.length) {
      sqlQuery += " WHERE " + whereClauses.join(" AND ");
    }

    sqlQuery += ` 
            GROUP BY ep.position, jc.soc_title, ep.avg_salary 
            ORDER BY num_application DESC;
        `;

    const result = await query(sqlQuery, queryParams);

    if (!result.rows || result.rows.length === 0) {
      res
        .status(404)
        .json({ result: "No positions found for the given employer ID" });
      return;
    }

    res.status(200).json({ result: result.rows });
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ result: "An error occurred" });
  }
}
