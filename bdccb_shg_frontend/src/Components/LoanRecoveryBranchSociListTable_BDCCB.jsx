import React, { useState } from "react"
import { routePaths } from "../Assets/Data/Routes"
import { Link } from "react-router-dom"
import Tooltip from "@mui/material/Tooltip"
import { Paginator } from "primereact/paginator"
import { motion } from "framer-motion"
import {
	CheckCircleFilled,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	EditOutlined,
	EyeOutlined,
	FileTextOutlined,
	SyncOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { Popconfirm, Tag } from "antd"
import TDInputTemplateBr from "./TDInputTemplateBr"
import axios from "axios"
import { getLocalStoreTokenDts } from "./getLocalforageTokenDts"
import { url_bdccb } from "../Address/BaseUrl"
import { Message } from "./Message"

function LoanRecoveryBranchSociListTable_BDCCB({
	loanAppData,
	setSearch,
	title,
	flag,
	showSearch = true,
	isForwardLoan = false,
	isRejected = false,
	refreshData
}) {
	const navigate = useNavigate()

	const [first, setFirst] = useState(0)
	const [rows, setRows] = useState(10)
	const [rej_res, setRejRes] = useState("")
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || "";
	const [loading, setLoading] = useState(false);

	const onPageChange = (event) => {
		setFirst(event.first)
		setRows(event.rows)
	}

	// const goTo = (item) => {
	// 	navigate(`${routePaths.EDIT_APPLICATION}`, {
	// 		state: { loanAppData: item },
	// 	})
	// }

	// useEffect(() => {
	// 	goTo()
	// })

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const rejectDisbursement = async (item) => {
		console.log(item, 'groupCodegroupCodegroupCode', rej_res, 'rej_resrej_resrej_res');
		 
		
		// return
		setLoading(true)

		const ip = await getClientIP()

				// const creds = {
				// 	branch_id: userDetails[0]?.brn_code ,
				// 	tenant_id: userDetails[0]?.tenant_id,
				// 	// from_dt: fromDate,
				// 	// to_dt: toDate,
				// 	// approval_status: loanType
				// }

				const creds = {
				...item, // all existing fields
				reject_remarks: rej_res || "",
				created_by: userDetails[0]?.emp_id,
				ip_address: ip
				};

				console.log(creds, 'dataaaaaaaaaaaaaaa');

		
				// return
				const tokenValue = await getLocalStoreTokenDts(navigate);
		
				await axios
					.post(`${url_bdccb}/recov/reject_society_recov`, creds, {
					headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
					},
					})
					.then((res) => {
						console.log(res?.data, 'dataaaaaaaaaaaaaaa');
						
		
						if(res?.data?.success){
						// setGroups(res?.data?.data)
						// setCopyLoanApplications(res?.data?.data)
						refreshData()
						setRejRes('')
						} else {
						setRejRes('')
						navigate(routePaths.LANDING)
						localStorage.clear()
						}
		
					})
					.catch((err) => {
						Message("error", "Some error occurred while rejecting...")
						console.log("ERR", err)
					})
				setLoading(false)
		
	}

			const formatDate = (date) => {
			const [year, month, day] = date.split("-");
			return `${day}-${month}-${year}`;
			};

	return (
		<>
			{/* <motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
			>
				<div
					className={`flex flex-col bg-slate-800 my-2
					 rounded-lg my-3dark:bg-slate-800"
					 md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-1.5`}
				>
					<div className="w-full">
						<div className="flex items-center justify-between">
							<motion.h2
								initial={{ opacity: 0, y: -50 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 1, type: "just" }}
								className="text-xl w-48 capitalize text-nowrap font-bold text-white dark:text-white sm:block hidden mx-4"
							>
								{title}
							</motion.h2>

							<label htmlFor="simple-search" className="sr-only">
								Search
							</label>
							{showSearch && (
								<div className="relative w-full -right-12 2xl:-right-12">
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
										className={`bg-white border rounded-lg ${
											flag !== "BM" ? "border-slate-700" : "border-slate-700"
										} text-gray-800 block w-full h-12 pl-10 dark:bg-gray-800 md:ml-4 duration-300 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-lg focus:border-slate-600`}
										placeholder="Search"
										required=""
										onChange={(text) => setSearch(text.target.value)}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</motion.section> */}
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
			>
				<table className="w-full text-sm text-left rtl:text-right shadow-lg text-green-900dark:text-gray-400">
					<thead
						className={`text-md text-gray-700 capitalize bg-slate-300
						 dark:bg-gray-700 dark:text-gray-400`}
					>
						<tr>
							{/* <th scope="col" className="p-4">
								#
							</th> */}
							<th scope="col" className="p-4">
								Loan Id
							</th>
							<th scope="col" className="p-4">
								Group Code
							</th>
							<th scope="col" className="p-4">
								Group Name
							</th>
							{/* <th scope="col" className="p-4">
								Disbursement Amount
							</th> */}
							<th scope="col" className="p-4">
								Transaction Date
							</th>
							<th scope="col" className="p-4">
								Transaction ID
							</th>
							<th scope="col" className="p-4">
								Credit Amount
							</th>
							<th scope="col" className="p-4">
								Status
							</th>
							
							<th scope="col" className="p-4">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{
							(loanAppData && loanAppData.length > 0) ? 
							loanAppData?.slice(first, rows + first).map((item, i) => (
								<tr
									className={
										"bg-white border-2 font-bold text-slate-800 border-b-pink-200 dark:bg-gray-800 dark:border-gray-700"
									}
									key={i}
								>
									{/* <th
										scope="row"
										className="px-3 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
									>
										{item.sl_no}
									</th> */}
									<td className="px-6 py-3 font-bold text-slate-800">{item.loan_id || "-----"}</td>
									<td className="px-6 py-3 text-slate-700">{item.group_code}</td>
									<td className="px-6 py-3 text-slate-700">{item.group_name}</td>
									{/* <td className="px-6 py-3 text-slate-700">{item.disb_amt}</td> */}
									<td className="px-6 py-3 text-slate-700">{formatDate(item.trans_dt)}</td>
									<td className="px-6 py-3 text-slate-700">{item.transaction_id}</td>
									<td className="px-6 py-3 text-slate-700">{item.credit_amount}</td>

									<td className="px-6 py-3 text-slate-700">
									{item.approval_status == "U" ? (
									<div className="pending_dis_2"><SyncOutlined style={{ color: "#fff", marginRight: 6 }} />Unapproved </div>
									) : item.approval_status == "A" ? (
									<div className="accept_dis_2"><CheckCircleFilled style={{ color: "#fff", marginRight: 6 }} />Accepted </div>
									) : (
									<div className="pending_dis_2"><CloseCircleOutlined style={{ color: "#fff", marginRight: 6 }} />Rejected </div>

									)}

									</td>

									<td className="px-6 py-3 text-slate-700">
										<button
												// to={routePaths.BM_EDIT_GRT + item?.form_no}
												onClick={() => {
													// console.log("LLSKSIODFUISFH", item)
													navigate(`/homebm/loan_branch_soi-recovery-details/${item?.group_code}`, {
														state: item,
													})
												}}
											>
												<EyeOutlined
													className={`text-md ${
														flag !== "BM" ? "text-slate-800" : "text-slate-800"
													}`}
												/>
											</button>

											{/* <Popconfirm
				title={`Reject Transaction?`}
				description={
				<>
				<div>
				<TDInputTemplateBr
				placeholder="Please give a reason behind rejecting this item"
				type="date"
				label="Please give a reason behind rejecting this item"
				name="fromDate"
				formControlName={rej_res}
				handleChange={(e) => setRejRes(e.target.value)}
				// min={"1900-12-31"}
				mode={3}
				/>
				</div>
				</>
				}
				onConfirm={async () => {
				await rejectDisbursement(item)
				// setData([])
				// Message("success", "Transaction Rejected.")
				}}
				onCancel={() => setRejRes("")}
				okText="Reject"
				cancelText="No"
				// disabled={selectedRowIndices?.length === 0}
				>
				<a className={`inline-flex items-center px-3 py-1 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-[#DA4167] border-[#DA4167] 
				bg-[#DA4167] transition ease-in-out hover:bg-[#DA4167] hover:text-white duration-300 rounded-full  dark:focus:ring-primary-900`}
				style={{fontSize:13}}
				>
				<CloseCircleOutlined />{" "}
				<span className="ml-1">Reject</span>
				</a>
				</Popconfirm> */}
									</td>
								</tr>
							)) :<tr
									className={
										"bg-white border-2 font-bold text-slate-800 border-b-pink-200 dark:bg-gray-800 dark:border-gray-700"
									}
								>
										<td className="text-center p-5" colSpan={9}>
												<span className="text-lg">No Data Available</span>
										</td>
								</tr>
						}
					</tbody>
				</table>
				<Paginator
					first={first}
					rows={rows}
					totalRecords={loanAppData?.length}
					rowsPerPageOptions={[3, 5, 10, 15, 20, 30, loanAppData?.length]}
					onPageChange={onPageChange}
				/>
			</motion.section>

			{/* <div>
				<Popconfirm
				title={`Reject Transaction?`}
				description={
				<>
				<div>
				<TDInputTemplateBr
				placeholder="Please give a reason behind rejecting this item"
				type="date"
				label="Please give a reason behind rejecting this item"
				name="fromDate"
				formControlName={rej_res}
				handleChange={(e) => setRejRes(e.target.value)}
				// min={"1900-12-31"}
				mode={3}
				/>
				</div>
				</>
				}
				onConfirm={async () => {
				await rejectDisbursement()
				// setData([])
				// Message("success", "Transaction Rejected.")
				}}
				onCancel={() => setRejRes("")}
				okText="Reject"
				cancelText="No"
				// disabled={selectedRowIndices?.length === 0}
				>
				<a
				className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-[#DA4167] border-[#DA4167] bg-[#DA4167] transition ease-in-out hover:bg-[#DA4167] hover:text-white duration-300 rounded-full  dark:focus:ring-primary-900`}
				>
				<CloseCircleOutlined />{" "}
				<span className="ml-2">Reject Transaction</span>
				</a>
				</Popconfirm>
				</div> */}
		</>
	)
}

export default LoanRecoveryBranchSociListTable_BDCCB
