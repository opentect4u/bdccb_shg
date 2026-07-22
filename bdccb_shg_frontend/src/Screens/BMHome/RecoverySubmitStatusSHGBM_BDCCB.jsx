import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button, Tooltip } from "antd"
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
import LoanRecoverySHGListTable_BDCCB from "../../Components/LoanRecoverySHGListTable_BDCCB"
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
	},
	// {
	// 	label: "Reject Recovery",
	// 	value: "R",
	// }
]

function RecoverySubmitStatusSHGBM_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	const [loanType, setLoanType] = useState("U")
	const [recoveryStatus, setRecoveryStatus] = useState("U")

	const today = new Date().toISOString().split("T")[0];

	const [fromDate, setFromDate] = useState(today);
	const [toDate, setToDate] = useState(today);
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
				"Approval Status": loan.approval_status === "A" ? "Approved" : loan.approval_status,

			
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
	const onChange = (e) => {
		console.log("radio1 checked", e)
		setRecoveryStatus(e)
	}

	// const initialValues = {
	
	// 		sanction_dt: "",
			
	// 	}
	// 	const [formValues, setValues] = useState(initialValues)

	// 	const validationSchema = Yup.object({
	// 			sanction_dt: Yup.mixed(),
		
	// 		})
	

	const fetchSearchedGroups = async () => {
		setLoading(true)
		const creds = {
			branch_id: userDetails[0]?.brn_code ,
			tenant_id: userDetails[0]?.tenant_id,
			// from_dt: fromDate,
			from_dt: recoveryStatus == 'A' ? fromDate : '',
			// to_dt: toDate,
			to_dt:  recoveryStatus == 'A' ? toDate : '',
			approval_status : recoveryStatus
			// approval_status: loanType
		}

// 		{
//   "tenant_id" : "",
//   "branch_id" : "",
//   "from_dt" :"",
//   "to_dt" : "",
//   "approval_status" : ""
// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/fetch_society_dtls`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				// console.log(res?.data, 'dataaaaaaaaaaaaaaa');
				

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
					<div className="flex flex-row gap-3 mt-20">
						
					<Radiobtn
					data={option_recovery}
					val={recoveryStatus}
					onChangeVal={(value) => {
					onChange(value)
					}}
					/>

					{recoveryStatus == 'A' &&(
					<>
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
					</>
					)}

					</div>
					

					{/* <div className="mt-5">
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
											{/* <div className="flex items-center justify-between"> */}
												
												
					
												{/* <label htmlFor="simple-search" className="sr-only">
													Search
												</label> */}
												<button
												className="inline-flex items-center text-white ml-6 disabled:bg-[#ee7c98] bg-[#DA4167] hover:bg-[#DA4167] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
												onClick={() => {
													navigate(`/homepacs/loan-recovery`)
												}}
											>
												{/* <PlusOutlined className="text-xl" /> */}
												 Recovery
											</button>
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
													{"Loan Recovery Of SHG List"}
												</motion.h2>
											{/* </div> */}
										</div>
									</div>
								</motion.section>

					{/* {JSON.stringify(groups, null, 2)} */}
					
					<LoanRecoverySHGListTable_BDCCB
						flag="BM"
						loanAppData={groups}
						// title="Find Recovery Loans by Society"
						title="Loan Recovery Of SHG List"
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

export default RecoverySubmitStatusSHGBM_BDCCB
