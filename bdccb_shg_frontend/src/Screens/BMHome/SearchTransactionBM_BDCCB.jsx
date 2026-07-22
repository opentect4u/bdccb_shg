import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button } from "antd"
import { LoadingOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import LoanApplicationsTableViewBr from "../../Components/LoanApplicationsTableViewBr.jsx__BDCCB"
import Radiobtn from "../../Components/Radiobtn"
import LoanApplicationsDisburseTable from "../../Components/LoanApplicationsDisburseTable"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import DisbursmentForm_BDCCB from "../Forms/DisbursmentForm_BDCCB"
import LoanApplicationsDisburseTable_BDCCB from "../../Components/LoanApplicationsDisburseTable_BDCCB"
import { motion } from "framer-motion"
import AccountHolderTable_BDCCB from "../../Components/TransactionTable_BDCCB"
import TransactionTable_BDCCB from "../../Components/TransactionTable_BDCCB"

// const options_Disburs = [
// 	{
// 		label: "Pending Disbursement",
// 		value: "U",
// 	},
// 	{
// 		label: "Approved Disbursement",
// 		value: "A",
// 	}
// ]

function SearchTransactionBM_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [loanApplications, setLoanApplications] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [disbursementStatus, setDisbursementStatus] = useState("U")
	const navigate = useNavigate()

	// const onChange = (e) => {
	// 	console.log("radio1 checked", e)
	// 	setDisbursementStatus(e)
	// }

	useEffect(() => {
		fetchApproveUapprove()
	}, [])


	const fetchApproveUapprove = async () => {
		setLoading(true)
		const creds = {
			branch_id: userDetails[0]?.brn_code,
			tenant_id: userDetails[0]?.tenant_id
		}
		const tokenValue = await getLocalStoreTokenDts(navigate);
		// await axios
			// .post(`${url}/admin/fetch_loan_application_dtls`, creds)
			// .post(`${url_bdccb}/depsav/deposit_list`, {
			// 	params: {branch_id: userDetails[0]?.brn_code, tenant_id: userDetails[0]?.tenant_id},
			// 	headers: {
			// 		Authorization: `${tokenValue?.token}`, // example header
			// 		"Content-Type": "application/json", // optional
			// 	},
			// })
			await axios.get(`${url_bdccb}/depsav/deposit_list`, {
			params: {branch_id: userDetails[0]?.brn_code, tenant_id: userDetails[0]?.tenant_id},
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			}
			})
			.then((res) => {

				if(res?.data?.success){
					console.log(res?.data?.data, 'dataaaaaaaaaaa', creds);
					
					setLoanApplications(res?.data?.data)
					setCopyLoanApplications(res?.data?.data)
				} else {
					Message('error', res?.data?.msg)
					navigate(routePaths.LANDING)
					localStorage.clear()
					
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
					e?.group_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.shg_id
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

					{/* <Radiobtn
						data={options_Disburs}
						val={disbursementStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/> */}

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
												className="bg-slate-100 p-3 h-11 rounded-full float-right text-center ml-3"
												onClick={() => {
													navigate(`/homebm/transaction/0`)
												}}
											>
												<PlusOutlined className="text-xl" />
												{/* Deposit/Withdrawal */}
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
															placeholder="Search By Group Name or Group ID."
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
													{"Deposit / Withdrawal  Transaction"}
												</motion.h2>
											{/* </div> */}
										</div>
									</div>
								</motion.section>
					


					<TransactionTable_BDCCB
					flag="BM"
					loanAppData={loanApplications}
					title="Account Holder"
					showSearch={true}
					disbursementStatus={disbursementStatus}
					setSearch={(data) => setSearch(data)}
					/>

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

export default SearchTransactionBM_BDCCB
