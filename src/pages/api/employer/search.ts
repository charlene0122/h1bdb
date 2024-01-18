// Connect to AWS
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

export type EmployerSearch = {
  id: string;
  name: string;
  city: string;
  state: string;
  industry: string;
  application_count: number;
  acceptance_rate: number;
  avg_salary: number;
};

type ResponseData = {
  result: EmployerSearch[] | string;
};

// Route: GET /employer/:search
// Return a list of employers
// e.g. /employer/search?query=&filterA=&filterB=&order_by=
// feature: home page search result

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // filter: prefix, city, state, salary range, Job category, industry, num of applications, acceptanceRate
    // Sort Options: e.name ASC (default), avg_salary DESC, application_count DESC, acceptance_rate DESC
    const prefix = req.query.prefix as string;
    const city = req.query.city as string;
    const state = req.query.state as string;
    const minAvgSalary = parseInt(req.query.min_avg_salary as string);
    const maxAvgSalary = parseInt(req.query.max_avg_salary as string);
    const jobCategory = req.query.job_category as string;
    const industry = req.query.industry as string;
    const appCount = parseInt(req.query.application_count as string);
    const acceptanceRate = parseFloat(req.query.acceptance_rate as string);
    const sort = req.query.sort as string;

    // Results Columns: name, city, state, industry, application_count, Acceptance_Rate, Avg_Salary

    let sqlQuery = `WITH Average_Salary AS (
    SELECT e.id,
    ROUND(
        AVG(
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
        ), 2
      ) AS avg_salary
    FROM
    Positions p JOIN Employers e on e.id = p.employer_id
    GROUP BY e.id, e.name
)
SELECT e.id, e.name AS name, city, state, i.name AS industry, COUNT(*) AS application_count, ((continuing_approval + initial_approval) 
               / (continuing_approval + initial_approval + continuing_denial + initial_denial)) AS acceptance_rate
            , avg_salary
        FROM Employers e
            JOIN Cases c ON e.id = c.employer_id
            JOIN FilingStats f ON f.id = e.id
            JOIN Industry i ON e.naics_code = i.naics_code
            JOIN Average_Salary a ON a.id = e.id
        `;

    const queryParams = [];
    const whereClauses = [];
    const havingClauses = [];

    // filter: city, state, minAvgSalary, maxAvgSalary, jobCategory, industry, appCount, acceptance rate
    if (prefix) {
      let validPrefixprefix = typeof prefix === "string" ? prefix : "";
      whereClauses.push("e.name LIKE ?");
      queryParams.push(validPrefixprefix + "%");
    }
    if (city) {
      whereClauses.push("city = ?");
      queryParams.push(city);
    }
    if (state) {
      whereClauses.push("state = ?");
      queryParams.push(state);
    }
    if (minAvgSalary !== undefined && !isNaN(minAvgSalary)) {
      whereClauses.push("avg_salary >= ?");
      queryParams.push(minAvgSalary);
    }
    if (maxAvgSalary !== undefined && !isNaN(maxAvgSalary)) {
      whereClauses.push("avg_salary <= ?");
      queryParams.push(maxAvgSalary);
    }
    if (jobCategory) {
      whereClauses.push(
        `e.id IN (
                    SELECT employer_id 
                    FROM Cases c JOIN JobClass jc ON c.soc_code = jc.soc_code
                    WHERE soc_title LIKE ? )`
      );
      queryParams.push("%" + jobCategory + "%");
    }
    if (industry) {
      whereClauses.push("i.name LIKE ?");
      queryParams.push("%" + industry + "%");
    }
    if (!isNaN(appCount)) {
      havingClauses.push("COUNT(*) >= ?");
      queryParams.push(appCount);
    }

    if (!isNaN(acceptanceRate)) {
      havingClauses.push("acceptance_rate >= ?");
      queryParams.push(acceptanceRate);
    }

    // Append WHERE claus to query
    if (whereClauses.length > 0) {
      sqlQuery += " WHERE " + whereClauses.join(" AND ");
    }

    // Append GROUP BY claus to query
    sqlQuery +=
      " GROUP BY name, city, state, industry, acceptance_rate, avg_salary ";

    // Append HAVING clause to query
    if (havingClauses.length > 0) {
      sqlQuery += " HAVING " + havingClauses.join(" AND ");
    }

    // Append ORDER BY clause
    // Sort Options: e.name ASC (default), avg_salary DESC, application_count DESC, acceptance_rate DESC
    let condition = "";
    if (sort === "avg_salary") {
      condition = "avg_salary DESC";
    } else if (sort === "application_count") {
      condition = "application_count DESC";
    } else if (sort === "acceptance_rate") {
      condition = "acceptance_rate DESC";
    } else {
      condition = "e.name";
    }

    sqlQuery += " ORDER BY " + condition + ";";

    const result = await query(sqlQuery, queryParams);

    // Send results
    res.status(200).json(result.rows);
  } catch (error) {
    // In case of an error, send an appropriate response
    console.error("Error executing query", error);
    res.status(500).json({ result: "An error occurred" });
  }
}
