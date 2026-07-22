import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button, Tooltip, Select } from "antd"
import { FileExcelOutlined, LoadingOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import GroupsTableViewBr from "../../Components/GroupsTableViewBr"
import ViewLoanTableBr from "../../Components/ViewLoanTableBr_BDCCB"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import ViewLoanTableRecovery_BDCCB from "../../Components/ViewLoanTableRecovery_BDCCB"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import RecoverySHGListTable_BDCCB from "../../Components/RecoverySHGListTable_BDCCB"
import Radiobtn from "../../Components/Radiobtn"
import LoanRecoverySubmitSHGListTable_BDCCB from "../../Components/LoanRecoverySubmitSHGListTable_BDCCB"
import { motion } from "framer-motion"
import LoanRecoveryBranchSociListTable_BDCCB from "../../Components/LoanRecoveryBranchSociListTable_BDCCB"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"


const option_recovery = [
	{
		label: "Unapproved Recovery",
		value: "U",
	},
	{
		label: "Approved Recovery",
		value: "A",
	}
]

const option_recovery_HeadOffice = [
	{
		label: "Approved Recovery",
		value: "A",
	}
]



function RecoveryListSocietyBranch_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	const [loanType, setLoanType] = useState("U")
	const [recoveryStatus, setRecoveryStatus] = useState(userDetails[0]?.branch_type === 'H' ? "A" : "U")

	const today = new Date().toISOString().split("T")[0];

	const [fromDate, setFromDate] = useState(today);
	const [toDate, setToDate] = useState(today);

	const [branches, setBranches] = useState([])
	const [branch_Select, setBranch_Select] = useState("");

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setRecoveryStatus(e)
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
			flattenedData.push({
				"Loan ID": loan.loan_id,
				"Group Code": loan.group_code,
				"Group Name": loan.group_name,
				"Disbursement Amount": loan.disb_amt,

				"Transaction Date": loan.trans_dt,
				"Transaction ID": loan.transaction_id,
				
				"Credit Amount": loan.credit_amount,
				"Status": loan.approval_status === "U" ? "Unapproved" : loan.approval_status === "A" ? "Approved" : loan.approval_status,
			
			});
		});

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(flattenedData);
		XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
		const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
		const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
		const fileName = `SocietyRecovery_${recoveryStatus}_Members_${new Date().toISOString().slice(0, 10)}.xlsx`;
		saveAs(blob, fileName);
	};
	

	const fetchSearchedGroups = async () => {
		setLoading(true)
		const creds = {
			branch_id: userDetails[0]?.brn_code ,
			tenant_id: userDetails[0]?.tenant_id,
			from_dt: recoveryStatus == 'A' ? fromDate : '',
			to_dt:  recoveryStatus == 'A' ? toDate : '',
			approval_status : recoveryStatus,
			branch_type : userDetails[0]?.branch_type,
		}

		const creds_HeadOffice = {
			branch_id: userDetails[0]?.branch_type === 'H' ? branch_Select : null,
			tenant_id: userDetails[0]?.tenant_id,
			from_dt: recoveryStatus == 'A' ? fromDate : '',
			to_dt:  recoveryStatus == 'A' ? toDate : '',
			approval_status : recoveryStatus,
			branch_type : userDetails[0]?.branch_type,
		}


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/fetch_soc_recov_dtls_ccb_level`, userDetails[0]?.branch_type === 'H' ? creds_HeadOffice : creds, {
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

	// useEffect(()=>{
	// fetchSearchedGroups()
	// }, [])


	useEffect(()=>{
		if(recoveryStatus != 'A'){
	fetchSearchedGroups()
		}
	}, [recoveryStatus])

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
	

	}, [recoveryStatus])


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
					data={userDetails[0]?.branch_type === 'H' ? option_recovery_HeadOffice :  option_recovery}
					val={recoveryStatus}
					onChangeVal={(value) => {
					onChange(value)
					}}
					/>

					{recoveryStatus == 'A' &&(
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
						<strong>Choose Branches</strong>
						</label>

						{/* {branch_Select} */}
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
						onClick={fetchSearchedGroups}
						className="bg-slate-700 text-white hover:bg-slate-800 p-5 mt-7 text-sm border-none rounded-lg w-30 h-10 flex justify-center items-center gap-2"
					>
						<SearchOutlined />
						Search
					</button>
					</div>

					{/* </form> */}
					</div>
					)}

					{/* </div> */}
					

					
					{/* {JSON.stringify(fromDate, 2)} */}

					{/* {JSON.stringify(toDate, 2)} */}

					{/* {JSON.stringify(groups[0], 2)} */}


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
												className="inline-flex items-center text-white ml-6 disabled:bg-[#ee7c98] bg-[#DA4167] hover:bg-[#DA4167] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
												onClick={() => {
													navigate(`/homebm/loan_branch_soi-recovery`)
												}}
											>
												{/* <PlusOutlined className="text-xl" /> */}
												 Recovery
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
															placeholder="Search Loans by Group Name / Code"
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
													{"Loan Recovery Of Society List"}
												</motion.h2>
											{/* </div> */}
										</div>
									</div>
								</motion.section>

					{/* {JSON.stringify(groups, null, 2)} */}
					
					<LoanRecoveryBranchSociListTable_BDCCB
						flag="BM"
						loanAppData={groups}
						// title="Find Recovery Loans by Society"
						// title="Loan Recovery Of Society List"
						showSearch={false}
						setSearch={(data) => setSearch(data)}
						refreshData={fetchSearchedGroups}
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

export default RecoveryListSocietyBranch_BDCCB
