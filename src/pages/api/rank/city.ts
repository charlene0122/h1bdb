// Connect to AWS
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

export type CityRank = {
  city: string;
  state: string;
  average_salary: string | number;
};

type ResponseData = {
  result: CityRank[] | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    let sqlQuery = `WITH Employer_Case AS (
      SELECT e.id, e.city, e.state, p.job_title, COUNT(*) as case_number,
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
           END, 2
        ) AS salary
      FROM Employers e JOIN Positions p ON e.id = p.employer_id
      JOIN Cases c ON p.employer_id = c.employer_id and p.job_title = c.job_title
      WHERE c.case_status = 'Certified'
      GROUP BY e.id, e.city, e.state, p.job_title
  )
  SELECT city, state, ROUND(SUM(ec.salary * ec.case_number) / SUM(ec.case_number), 2)  AS average_salary
  FROM Employer_Case ec
  GROUP BY city, state
  HAVING COUNT(*) > 500
  ORDER BY average_salary DESC
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
