import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/db";

export type Case = {
  case_number: string;
  case_status: string;
  received_date: Date; // formatting: https://next-intl-docs.vercel.app/docs/usage/dates-times
  decision_date: Date;
  soc_code: string;
  employer_id: string;
  job_title: string;
  employer_name: string;
  wage_rate_of_pay_from: number | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Case | string>
) {
  try {
    const case_number = req.query.id as string;
    if (!case_number) {
      res.status(400).json("Missing id");
      return;
    }

    // fetch data
    const combinedQuery = `
      SELECT 
        Cases.*,
        Employers.name AS employer_name,
        Positions.wage_rate_of_pay_from
      FROM 
        Cases
      LEFT JOIN Employers ON Cases.employer_id = Employers.id
      LEFT JOIN Positions ON Cases.employer_id = Positions.employer_id 
                         AND Cases.job_title = Positions.job_title
      WHERE 
        Cases.case_number = ?;
    `;
    const queryResult = await query(combinedQuery, [case_number]);

    if (!queryResult.rows || queryResult.rows.length === 0) {
      res.status(404).json("Case does not exist");
      return;
    }
    const case_record = queryResult.rows[0];
    // if employer_name is null, replace with 'N/A'
    case_record.employer_name = case_record.employer_name || "N/A";

    res.status(200).json(case_record);
  } catch (error) {
    if (error instanceof Error) {
      console.error("[Error]", error.message);
      res.status(500).json(error.message);
    } else {
      res.status(500).json("Unknown error");
    }
  }
}
