import {NextApiRequest, NextApiResponse} from "next";
import {query} from "@/db";

export type CaseListingData = {
    case_number: string;
    case_status: string;
    received_date: Date;
    decision_date: Date;
    soc_code: string;
    job_title: string;
    wage_rate_of_pay_from: number;
    wage_rate_of_pay_to: number;
    wage_unit_of_pay: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CaseListingData[] | string>
) {
    try {
        const employer_id = req.query.employer_id as string;
        if (!employer_id) {
            res.status(400).json("Missing parameter employer_id");
            return;
        }

        // get filter params
        const soc_code = req.query.soc_code as string;
        const salary_range_from_str = req.query.salary_from as string;
        // const salary_range_to_str = req.query.salary_to as string;
        const salary_range_from = salary_range_from_str ? parseInt(salary_range_from_str) : 0;
        // const salary_range_to = salary_range_to_str ? parseInt(salary_range_to_str) : 1000000000;
        const date_from_str = req.query.date_from as string;
        const date_to_str = req.query.date_to as string;
        const date_from = date_from_str ? new Date(date_from_str) : new Date('2000-01-01T00:00:00.000Z');
        const date_to = date_to_str ? new Date(date_to_str) : Date.now();

        // query and filter
        let q = `
                SELECT c.case_number, c.case_status, c.received_date,
                       c.decision_date, c.soc_code,
                       REGEXP_REPLACE(c.job_title, '\\\\s*(- )*\\\\(*\\\\d+(\\\\.\\\\d+)*\\\\)*', '') AS job_title,
                       p.wage_rate_of_pay_from, 
                       COALESCE(p.wage_rate_of_pay_to, p.wage_rate_of_pay_from) AS wage_rate_of_pay_to, 
                       p.wage_unit_of_pay 
                FROM Cases c JOIN Positions p 
                    ON c.employer_id = p.employer_id AND c.job_title = p.job_title
                WHERE c.employer_id = ? 
                  AND p.wage_rate_of_pay_from >= ?
                  AND (c.received_date IS NULL OR c.received_date >= ?) 
                  AND (c.received_date IS NULL OR c.received_date <= ?)
            `;

        let params = [employer_id, salary_range_from, date_from, date_to];
        if (soc_code) {
            q += '\nAND c.soc_code = ?';
            params.push(soc_code);
        }

        q += '\nORDER BY c.decision_date DESC;';

        const results = await query(q, params);

        if (!results.rows) {
            res.status(500).json("Null query result");
            return;
        }

        res.status(200).json(results.rows);
    } catch (error) {
        if (error instanceof Error) {
            console.error("[Error]", error.message);
            res.status(500).json(error.message);
        } else {
            res.status(500).json("Unknown error");
        }
    }
}
