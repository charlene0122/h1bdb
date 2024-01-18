import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

export type Employer = {
  // All attributes from employer
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  naics_code: string;
  willful_violator: boolean;
};

export type EmployerStats = {
  employer: Employer;
  // Statstics from aggregate queries
  num_applications: number;
  acceptance_rate: number;
  average_salary: number;
  industry: string;
};

type Data = {
  result: Employer | EmployerStats | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // Extract employer id from query string and ensure it's the correct type
    const id = req.query.id as string;
    if (!id) {
      // Handle the case where 'id' is not a valid number
      res.status(400).json({ result: "Invalid ID" });
      return;
    }

    // Get basic employer info from the employer table
    const basicQuery = "SELECT * FROM Employers WHERE id = ?;";
    const employerResult = await query(basicQuery, [id]);
    if (!employerResult.rows || employerResult.rows.length === 0) {
      res.status(404).json({ result: "No employer found with the given ID" });
      return;
    }

    const employer = employerResult.rows[0];

    // Additional queries to fetch statistics and aggregations
    const acceptanceRateQuery = `
      SELECT 
        (CONCAT((continuing_approval + initial_approval) * 100/(continuing_approval + initial_approval + continuing_denial + initial_denial),'%'))AS acceptance_rate 
      FROM FilingStats 
      WHERE id = ?;
    `;

    const numApplicationsQuery = `
      SELECT COUNT(*) as num_applications 
      FROM Cases 
      WHERE employer_id = ?;
    `;

    const averageSalaryQuery = `
    SELECT 
    ROUND(
      AVG(
        CASE 
          WHEN wage_unit_of_pay = 'Hour' THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to, wage_rate_of_pay_from * 2) / 2 * 2085.6 
          WHEN wage_unit_of_pay = 'Week' THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,wage_rate_of_pay_from * 2) / 2 * 52.14 
          WHEN wage_unit_of_pay = 'Bi-Weekly' THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to, wage_rate_of_pay_from * 2) / 2 * 26.07 
          WHEN wage_unit_of_pay = 'Month' THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to,wage_rate_of_pay_from * 2) / 2 * 12 
          WHEN wage_unit_of_pay = 'Year' THEN COALESCE(wage_rate_of_pay_from + wage_rate_of_pay_to, wage_rate_of_pay_from * 2) / 2 
        END)
      , 2) 
    AS average_salary 
    FROM Positions 
    WHERE employer_id = ?;`;

    const industryQuery = `
      SELECT name FROM Industry WHERE naics_code = ?;
    `

    // Execute additional queries
    const acceptanceRateResult = await query(acceptanceRateQuery, [id]);
    const numApplicationsResult = await query(numApplicationsQuery, [id]);
    const averageSalaryResult = await query(averageSalaryQuery, [id]);
    const industryResult = await query(industryQuery, [employer.naics_code]);

    // Error handling
    if (
      !acceptanceRateResult.rows ||
      acceptanceRateResult.rows.length === 0 ||
      !numApplicationsResult.rows ||
      numApplicationsResult.rows.length === 0 ||
      !averageSalaryResult.rows ||
      averageSalaryResult.rows.length === 0 ||
      !industryResult.rows ||
      industryResult.rows.length === 0
    ) {
      res
        .status(404)
        .json({ result: "Failed to load employer statistics on given ID" });
      return;
    }

    // Assemble the output
    const employerStats: EmployerStats = {
      employer: employerResult.rows[0],
      num_applications: numApplicationsResult.rows[0].num_applications,
      acceptance_rate: acceptanceRateResult.rows[0].acceptance_rate,
      average_salary: averageSalaryResult.rows[0].average_salary,
      industry: industryResult.rows[0].name
    };

    res.status(200).json({ result: employerStats });
  } catch (error) {
    // Handle any errors during query execution
    console.error("Error executing query", error);
    res.status(500).json({ result: "An error occurred" });
  }
}
