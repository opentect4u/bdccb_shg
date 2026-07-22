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
		label: "Acceptance Pending",
		value: "U",
	},
	{
		label: "Accepted",
		value: "A",
	},
	// {
	// 	label: "Rejected",
	// 	value: "R",
	// }
]
function SearchViewLoanBM_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	const [loanType, setLoanType] = useState("U")
	const [disbursementStatus, setDisbursementStatus] = useState("U")
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
			tenant_id: userDetails[0]?.tenant_id,
			approval_status: disbursementStatus,
			from_dt: disbursementStatus=='A'?fromDate:'',
			to_dt: disbursementStatus=='A'?toDate:''
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/loan/fetch_disburse_dtls`, creds, {
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
					    "CCB Loan ID": loan.ccb_loan_id,
						"Group Code": loan.group_code,
                        
						"Group Name": loan.group_name,
						"Total Members": loan.tot_member,
						"Total Outstanding": loan.tot_outstanding,
						"Approval Status": loan.approval_status === "A" ? "Approved" : loan.approval_status,

						
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
		const fileName = `SocietyDisbursementTransaction_Members_${new Date().toISOString().slice(0, 10)}.xlsx`;
		saveAs(blob, fileName);
	};
	useEffect(()=>{
		// if(disbursementStatus != "A"){
		// fetchSearchedGroups()
		// }
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
					{/* <div className="flex flex-row gap-3 mt-20">
						<input
							type="text"
							placeholder="Search Loans by Group Name"
							className={`bg-white border-1 border-gray-400 text-gray-800 text-sm rounded-lg ${
								userDetails?.id == 3
									? "active:border-slate-600 focus:ring-slate-600 focus:border-slate-800"
									: "active:border-slate-600 focus:ring-slate-600 focus:border-slate-800"
							} focus:border-1 duration-500 block w-full p-2 dark:bg-bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
							onChange={(e) => setSearchKeywords(e.target.value)}
						/>
						<button
							icon={<SearchOutlined />}
							iconPosition="end"
							className="bg-slate-700 text-white hover:bg-slate-800 p-5 text-center text-sm border-none rounded-lg w-36 h-10 flex justify-center items-center align-middle gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed active:ring-2 active:ring-slate-400"
							onClick={fetchSearchedGroups}
							disabled={!searchKeywords}
						>
							<SearchOutlined />
							Search
						</button>
					</div> */}
<Radiobtn
						data={options_Disburs}
						val={disbursementStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/>
{disbursementStatus == 'A' && <div className="grid grid-cols-3 gap-4">
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

						{/* </form> */}
						</div>}
					
					{/* {JSON.stringify(groups, 2)} */}

					<ViewLoanTableBr
						flag="BM"
						loanAppData={groups}
						title="Find Loans by Society"
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

export default SearchViewLoanBM_BDCCB
