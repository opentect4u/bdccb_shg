import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button, Tooltip, Select } from "antd"
import { FileExcelOutlined, LoadingOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import LoanApplicationsTableViewBr from "../../Components/LoanApplicationsTableViewBr.jsx__BDCCB"
import Radiobtn from "../../Components/Radiobtn"
import LoanApplicationsDisburseTable from "../../Components/LoanApplicationsDisburseTable"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import DisbursmentForm_BDCCB from "../Forms/DisbursmentForm_BDCCB"
import LoanApplicationsDisburseTable_BDCCB from "../../Components/LoanApplicationsDisburseTable_BDCCB"
import { motion } from "framer-motion"
import LoanBrnPacsDisburseTable_BDCCB from "../../Components/LoanBrnPacsDisburseTable_BDCCB"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"

const options_Disburs = [
	{
		label: "Unapproved",
		value: "U",
	},
	{
		label: "Approved",
		value: "A",
	},
]

const options_Disburs_HeadOffice = [
	{
		label: "Approved",
		value: "A",
	},
]

function SearchMemberForDisburseBM_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [loanApplications, setLoanApplications] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [disbursementStatus, setDisbursementStatus] = useState(userDetails[0]?.branch_type === 'H' ? "A" : "U")

	const today = new Date().toISOString().split("T")[0];
	
	const [fromDate, setFromDate] = useState(today);
	const [toDate, setToDate] = useState(today);

	const [branches, setBranches] = useState([])
	const [branch_Select, setBranch_Select] = useState("");

	const navigate = useNavigate()

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setDisbursementStatus(e)
	}

	useEffect(() => {
		if(disbursementStatus != 'A'){
		fetchApproveUapprove()
		}
	}, [disbursementStatus])

const s2ab = (s) => {
		const buf = new ArrayBuffer(s.length)
		const view = new Uint8Array(buf)
		for (let i = 0; i < s.length; i++) {
			view[i] = s.charCodeAt(i) & 0xff
		}
		return buf
	}
const handleExportMembers = (loans) => {
  const flattenedData = [];
  loans.forEach((loan) => {
    if (loan.members && Array.isArray(loan.members)) {
      loan.members.forEach((member) => {
        flattenedData.push({
          // Loan level fields (non-nested)
          "Loan ID": loan.loan_id,
          "Tenant ID": loan.tenant_id,
          "Branch ID": loan.branch_id,
          "Loan Account No": loan.loan_acc_no,
          "Group Name": loan.group_name,
          "Group Code": loan.group_code,
          "Period": loan.period,
          "Current ROI": loan.curr_roi,
          "Penal ROI": loan.penal_roi,
          "Disbursement Date": loan.disb_dt,
          "Disbursement Amount": loan.disb_amt,
          "Pay Mode": loan.pay_mode,
          "Repayment Start Date": loan.rep_start_dt,
          "Repayment End Date": loan.rep_end_dt,
          "Sanction No": loan.sanction_no,
          "Sanction Date": loan.sanction_dt,
          "Principal Amount": loan.prn_amt,
          "Interest Amount": loan.intt_amt,
          "Overdue Principal Amount": loan.ovd_prn_amt,
          "Overdue Interest Amount": loan.ovd_intt_amt,
          "Total Group": loan.tot_grp,
          "Transaction Type": loan.trans_type === "D" ? "Disbursement" : loan.trans_type === "R" ? "Recovery" : loan.trans_type,
          "Approval Status": loan.approval_status === "A" ? "Approved" : loan.approval_status,
          
          // Member level fields
          "Member Loan ID": member.mem_loan_id,
          "Transaction ID": member.tran_id,
          "Member Group Code": member.group_code,
          "Member Group Name": member.group_name,
          "Member ID": member.member_id,
          "Member Name": member.member_name,
          "Disburse Amount": member.disburse_amt,
          "SB Account No": member.sb_acc_no
        });
      });
    } else {
      // Fallback for loans without members
      flattenedData.push({ ...loan });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(flattenedData);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
  const fileName = `SHGDisburse_${disbursementStatus}_Members_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
};
	const fetchApproveUapprove = async () => {
		setLoading(true)
		const creds = {
			branch_id: userDetails[0]?.brn_code,
			approval_status: disbursementStatus,
			from_dt: disbursementStatus == 'A' ? fromDate : '',
			to_dt: disbursementStatus == 'A' ? toDate : '',
			loan_to : "S",
			branch_type : userDetails[0]?.branch_type,
		}

		const creds_HeadOffice = {
			branch_id: userDetails[0]?.branch_type === 'H' ? branch_Select : null,
			approval_status: disbursementStatus,
			from_dt: fromDate,
			to_dt: toDate,
			loan_to : "S",
			branch_type : userDetails[0]?.branch_type,
		}

		// console.log(creds, 'formDataformDataformDataformData', fromDate, toDate);
		
		const tokenValue = await getLocalStoreTokenDts(navigate);
		await axios
			// .post(`${url}/admin/fetch_loan_application_dtls`, creds)
			.post(`${url_bdccb}/loan/show_loan_status`, userDetails[0]?.branch_type === 'H' ? creds_HeadOffice : creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {
				// console.log(res?.data?.data, 'dataaaaaaaaaaa', creds);
				if(res?.data?.success){
					// console.log(res?.data?.data, 'dataaaaaaaaaaa', creds);
					
					setLoanApplications(res?.data?.data)
					setCopyLoanApplications(res?.data?.data)
				} else {
					Message('error', res?.data?.msg)
					// navigate(routePaths.LANDING)
					// localStorage.clear()
					
				}
				

			})
			.catch((err) => {
				Message("error", "Some error occurred while searching...")
			})
		setLoading(false)
	}

		const setSearch = (word) => {
		console.log(word, "wordwordwordword")
		setLoanApplications(
			copyLoanApplications?.filter(
				(e) =>
					e?.loan_acc_no
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.group_name
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase())
			)
		)
	}


	const getBranchList = async (e) => {
	setLoading(true)

	setBranches([])
	setBranch_Select('')

	await axios.get(`${url_bdccb}/dashboard/fetch_brn_soc_name`, {
	params: {select_type: userDetails[0]?.branch_type}
	})
	.then((res) => {

	if (res?.data?.success) {

	console.log(res?.data?.data, 'fffffffffffffffffffffff');
	setBranches(res.data.data.map((item) => ({
	code: item.branch_id,
	name: `${item.branch_name} (${item.branch_id})`,
	}))
	)


	} else {
	navigate(routePaths.LANDING)
	localStorage.clear()
	}

	})
	.catch((err) => {
	})

	setLoading(false)

	}

	useEffect(() => {

	if(userDetails[0]?.branch_type === 'H'){
		getBranchList()
	}

	}, [disbursementStatus])

	

	return (
		<div>
			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="px-4 h-auto my-10 mx-32">

					

					{/* <div className="flex flex-row gap-3 mt-20"> */}
											
						<Radiobtn
						data={userDetails[0]?.branch_type === 'H' ? options_Disburs_HeadOffice :  options_Disburs}
						val={disbursementStatus}
						onChangeVal={(value) => {
						onChange(value)
						}}
						/>

						
						{disbursementStatus == 'A' &&(
						<div className="grid grid-cols-4 gap-4">
						{/* <form onSubmit={formik.handleSubmit}> */}
						<div className="mt-1">
						<TDInputTemplateBr
						type="date"
						label="From Date"
						name="from_dt"
						formControlName={fromDate}
						handleChange={(e) => setFromDate(e.target.value)}
						mode={1}
						/>
						</div>

						<div className="mt-1">
						<TDInputTemplateBr
						type="date"
						label="To Date"
						name="to_dt"
						formControlName={toDate}
						handleChange={(e) => setToDate(e.target.value)}
						mode={1}
						/>
						</div>
						

						{userDetails[0]?.branch_type === 'H' &&(
						<div className="mt-2">
						<label htmlFor="brnch" className="block text-sm font-medium text-slate-700 mb-1">
						Choose Branches
						</label>


						<Select
						showSearch
						placeholder="Select a branch"
						value={branch_Select || undefined}
						style={{ width: "100%" }}
						optionFilterProp="children"
						onChange={(value) => {
						setBranch_Select(value); // ✅ same as setFieldValue
						console.log("Selected:", value);
						}}
						filterOption={(input, option) =>
						option?.children?.toLowerCase().includes(input.toLowerCase())
						}
						>
						<Select.Option value="" disabled>
						Select Branches / Society
						</Select.Option>

						{branches.map((opt) => (
						<Select.Option key={opt.code} value={opt.code}>
						{opt.name}
						</Select.Option>
						))}
						</Select>

						</div>
						)}

						<div className="mt-1">
						<button
						type="button"
						onClick={fetchApproveUapprove}
						className="bg-slate-700 text-white hover:bg-slate-800 p-5 mt-7 text-sm border-none rounded-lg w-30 h-10 flex justify-center items-center gap-2"
						>
						<SearchOutlined />
						Search
						</button>
						</div>

						{/* </form> */}
						</div>
						)}

										

					<motion.section
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
								>
									<div
										className={`flex flex-col bg-slate-800
										 rounded-lg my-3 dark:bg-slate-800
										 md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-1.5`}
									>
										<div className="w-full flex flex-row-reverse justify-between items-center mx-4">
												{userDetails[0]?.branch_type != 'H' &&(
												<button
												className="bg-slate-100 p-3 h-11 rounded-full float-right text-center ml-3"
												onClick={() => {
												navigate(`/homebm/disburseloan/0`)
												}}
												>
												<PlusOutlined className="text-xl" />
												</button>
												)}
												{/* {showSearch && ( */}
													<div className="relative w-full">
														<div className="absolute inset-y-0 left-0 flex items-center md:ml-4 pl-3 pointer-events-none">
															<svg
																aria-hidden="true"
																className="w-5 h-5 text-gray-500 dark:text-gray-400"
																fill="currentColor"
																viewBox="0 0 20 20"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	fillRule="evenodd"
																	d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
																	clipRule="evenodd"
																/>
															</svg>
														</div>
														<motion.input
															type="text"
															id="simple-search"
															initial={{ opacity: 0, width: 0 }}
															animate={{ opacity: 1, width: "95%" }}
															transition={{ delay: 1.1, type: "just" }}
															className={`bg-white border rounded-lg  border-slate-700 bg-slate-300"
															 text-gray-800 block w-full h-12 pl-10 dark:bg-gray-800 md:ml-4 duration-300 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-lg `}
															placeholder="Search By Loan Account No. / SHG Name"
															required=""
															onChange={(text) => setSearch(text.target.value)}
														/>
													</div>
												{/* )} */}
					
												<motion.h2
													initial={{ opacity: 0, y: -50 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 1, type: "just" }}
													className="text-xl capitalize text-nowrap font-bold text-white dark:text-white sm:block hidden mx-4"
												>
													{/* {`Loan Disburse ${userDetails[0]?.user_type == 'B' ? 'Branch': userDetails[0]?.user_type == 'P' ? 'PACS' : ''} to SHG`} */}
													{`Disbursement to SHG`}
												</motion.h2>
											{/* </div> */}
										</div>
									</div>
								</motion.section>
					
					{/* {JSON.stringify(loanApplications, null, 2)} */}

					<LoanBrnPacsDisburseTable_BDCCB
					flag="BM"
					loanAppData={loanApplications}
					title="Disburse Loan"
					showSearch={true}
					disbursementStatus={disbursementStatus}
					setSearch={(data) => setSearch(data)}
					/>
{loanApplications?.length>0 && <div className="flex justify-start gap-4 bg-white p-4">
														<Tooltip title="Export to Excel">
															<button
																onClick={() => handleExportMembers(loanApplications)}
																className="mt-5 justify-center items-center rounded-full text-green-900"
															>
																<FileExcelOutlined
																	style={{
																		fontSize: 30,
																	}}
																/>
															</button>
														</Tooltip>
													
													</div>}
					{/* <DialogBox
					visible={visible}
					flag={flag}
					onPress={() => setVisible(false)}
				/> */}
				</main>
			</Spin>
			
		</div>
	)
}

export default SearchMemberForDisburseBM_BDCCB
