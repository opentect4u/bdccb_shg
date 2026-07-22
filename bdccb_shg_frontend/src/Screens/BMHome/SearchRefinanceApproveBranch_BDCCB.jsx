import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button, Tooltip } from "antd"
import { FileExcelOutlined, LoadingOutlined, SearchOutlined } from "@ant-design/icons"
import GroupsTableViewBr from "../../Components/GroupsTableViewBr"
import ViewLoanTableBr from "../../Components/ViewLoanTableBr_BDCCB"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import Radiobtn from "../../Components/Radiobtn"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import ViewRefinanceApproveTable_BDCCB from "../../Components/ViewRefinanceApproveTable_BDCCB"
import { motion } from "framer-motion"
import ViewRefinanceApproveTableBranch_BDCCB from "../../Components/ViewRefinanceApproveTableBranch_BDCCB"

const options = [
	{
		label: "Unapproved Disbursement",
		value: "U",
	},
	// {
	// 	label: "Approved Disbursement",
	// 	value: "A",
	// }
]
const options_Disburs = [
	{
		label: "Approved",
		value: "A",
	},
	{
		label: "Unapproved",
		value: "U",
	},
	// {
	// 	label: "Rejected",
	// 	value: "R",
	// }
]
function SearchRefinanceApproveBranch_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	const [loanType, setLoanType] = useState("U")
		const [disbursementStatus, setDisbursementStatus] = useState("A")
	const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10))
		const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))
const onChange = (e) => {
		console.log("radio1 checked", e)
		setDisbursementStatus(e)
	}
	const fetchSearchedGroups = async () => {
		setLoading(true)
		const creds = {
			branch_id: userDetails[0]?.brn_code ,
			// tenant_id: userDetails[0]?.tenant_id,
			approval_status: disbursementStatus,
			// from_dt: '',
			// to_dt: ''
			// from_dt: disbursementStatus=='A'?fromDate:'',
			// to_dt: disbursementStatus=='A'?toDate:''
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/refinance/fetch_unapprove_re-finance_data_branch_level`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				console.log(res?.data, 'dataaaaaaaaaaaaaaa');
				

				if(res?.data?.success){
				setGroups(res?.data?.data)
				setCopyLoanApplications(res?.data?.data)

				} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
				}

			})
			.catch((err) => {
				Message("error", "Some error occurred while searching...")
				console.log("ERR", err)
			})
		setLoading(false)
	}
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
			// if (loan.members && Array.isArray(loan.members)) {
			// 	loan.members.forEach((member) => {
					flattenedData.push({
						// Loan level fields (non-nested)
					    "CCB Loan ID": loan.loan_id,
						"Group Code": loan.group_code,
                        
						"Group Name": loan.group_name,
						// "Total Members": loan.tot_member,
						"Disbursement Amount": loan.disb_amt,
						"Approval Status": loan.approval_status === "A" ? "Approved" : loan.approval_status === "U" ? "Unapproved" : "Rejected",

						
						// Member level fields
						
					});
				// });
			// } else {
			// 	// Fallback for loans without members
			// 	flattenedData.push({ ...loan });
			// }
		});

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(flattenedData);
		XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
		const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
		const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
		const fileName = `RefinanceBranch_Approve_list_${new Date().toISOString().slice(0, 10)}.xlsx`;
		saveAs(blob, fileName);
	};
	useEffect(()=>{
		fetchSearchedGroups()
	}, [disbursementStatus])

		const setSearch = (word) => {
		console.log(word, "wordwordwordword", copyLoanApplications)
		setGroups(
			copyLoanApplications?.filter(
				(e) =>
					e?.group_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.group_code
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase())
			)
		)
	}

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
					
						{userDetails[0]?.user_type != "H" && (
						<Radiobtn
						data={options_Disburs}
						val={disbursementStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
						/>
						)}
						
						{/* {disbursementStatus == 'A' && <div className="grid grid-cols-3 gap-4">
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
						<div className="mt-1">
						<button
						type="button"
						onClick={fetchSearchedGroups}
						className="bg-slate-700 text-white hover:bg-slate-800 p-5 mt-7 text-sm border-none rounded-lg w-30 h-10 flex justify-center items-center gap-2"
						>
						<SearchOutlined />
						Search
						</button>
						</div>

						</div>} */}
					{/* <div className="mt-20">
						<label
							for="default-search"
							className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
						>
							Search
						</label>
						<div className="relative mt-10">
							<div className="absolute inset-y-0  start-0 flex items-center ps-3 pointer-events-none">
								<svg
									className="w-4 h-4 text-gray-500 dark:text-gray-400"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 20 20"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
									/>
								</svg>
							</div>
							<input
								type="search"
								id="default-search"
								className="block mt-10 w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-slate-500 focus:border-slate-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-slate-500 dark:focus:border-slate-500"
								placeholder="Search Loans by Group Name / Code"
								// onChange={(e) => setSearchKeywords(e.target.value)}
								onChange={(text) => setSearch(text.target.value)}
							/>
							<button
								type="submit"
								className="text-white absolute end-2.5 disabled:bg-[#ee7c98] bottom-2.5 bg-[#DA4167] hover:bg-[#DA4167] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-md text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								onClick={fetchSearchedGroups}
								disabled={!searchKeywords}
							>
								Search
							</button>
						</div>
					</div> */}


					{/* {JSON.stringify(groups, 2)} */}

					<ViewRefinanceApproveTableBranch_BDCCB
						flag="BM"
						loanAppData={groups}
						title="Branch Re-Finance Approve List"
						showSearch={false}
						setSearch={(data) => setSearch(data)}
					/>

					{groups?.length > 0 && <div className="flex justify-start gap-4 bg-white p-4">
						<Tooltip title="Export to Excel">
							<button
								onClick={() => handleExportMembers(groups)}
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

export default SearchRefinanceApproveBranch_BDCCB
