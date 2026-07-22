import React, { useEffect, useState } from "react"
import "../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import BtnComp from "../../Components/BtnComp"
import VError from "../../Components/VError"
import { useNavigate } from "react-router-dom"
// import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import { Message } from "../../Components/Message"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Badge, Spin, Card, Tooltip } from "antd"
import {
	CheckCircleFilled,
	CheckCircleOutlined,
	CloseCircleOutlined,
	FileExcelOutlined,
	LoadingOutlined,
	PrinterOutlined,
	SyncOutlined,
} from "@ant-design/icons"
import { useLocation } from "react-router"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../Utils/formateDate"
import DialogBox from "../../Components/DialogBox"
// import { disableInputArray } from "./disableInputArray"
import { disableCondition } from "./disableCondition"
import { getOrdinalSuffix } from "../../Utils/ordinalSuffix"
import { SB_AC_MEMBER_DETAILS_Header_Member, txnDetailsHeader, txnDetailsHeader_Member } from "../../Utils/Reports/headerMap"
import { exportToExcel } from "../../Utils/exportToExcel"
import { printTableReport } from "../../Utils/printTableReport"
import moment from "moment"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { routePaths } from "../../Assets/Data/Routes"
import { saveMasterData } from "../../services/masterService"

function SB_AC_MemberDetailsForm_BDCCB() {
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const loanAppData  = location?.state?.item || {}
	const group_code_Data  = location?.state?.group_code || {}
	const flag  = location?.state?.flag || {}
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const navigate = useNavigate()
	const [memberList, setMemberList] = useState(() => [])



	const [memberLoanDetailsData, setMemberLoanDetailsData] = useState({
		// loan_id: "",
		// trans_id: "",
		// trans_dt: "",
		// trans_type: "",
		// dr_amt: "",
		// cr_amt: "",
		// curr_prn: "",
		// approval_status: ""

		trans_no: "",
		mem_sb_acc_no: "",
		trans_dt: "",
		dep_with_flag: "",
		dr_amt: "",
		cr_amt: "",
		member_balance: "",
		approved_by: "",
		approved_at: "",
		approval_flag: "",
	})

	
	//////////////////////////////////////////////////
	//////////////////////////////////////////////////

	const onSubmit = (e) => {
		e.preventDefault()

		// setVisible(true)
	}

	let totalCredit = 0
	let totalDebit = 0

	// const disableCondition = () => {
	// 	return userDetails?.id === 4
	// }

	const fetchSearchedGroups = async () => {
		setLoading(true)
		const creds = {
			// branch_code: userDetails[0]?.brn_code,
			
			tenant_id: userDetails[0]?.tenant_id,
			shg_id: group_code_Data,
			member_id: loanAppData?.member_id,
		}

// 		{
//   "tenant_id" : "",
//   "shg_id" : "",
//   "member_id" : ""
// }


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/sbledger/fetch_indivitual_member_sb_trans`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				console.log(res?.data?.data, 'loanAppDataloanAppDataloanAppDataloanAppData', creds);
				if(res?.data?.success){
				
				setMemberList(res?.data?.data)
				// setCopyLoanApplications(res?.data?.data)

				} else {
				// navigate(routePaths.LANDING)
				// localStorage.clear()
				}
				
			})
			.catch((err) => {
				Message("error", "Some error occurred while searching...")
				console.log("ERR", err)
			})
		setLoading(false)
	}

	useEffect(()=>{
		fetchSearchedGroups()
	}, [])

	const dataToExport = memberList

	const headersToExport = SB_AC_MEMBER_DETAILS_Header_Member

	const fileName = `SB_A/C_Ledger_Member_Details_${new Date().toLocaleString("en-GB")}.xlsx`



	return (
		<>
			
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<form onSubmit={onSubmit}>
					<div>

						{/* {JSON.stringify(loanAppData, 2)} */}
						
						{/* {JSON.stringify(group_code_Data, 2)} // */}
						{/* {JSON.stringify(flag, 2)} */}
						<div>
							{/* <div className="w-full my-10 border-t-4 border-gray-500 border-dashed"></div> */}
							<div className="text-xl mb-2 mt-5 text-[#DA4167] font-semibold underline">
								Transaction Details
							</div>
						</div>

						<div>
							<Spin spinning={loading}>
								<div
									className={`relative overflow-x-auto shadow-md sm:rounded-lg`}
								>
									{/* {JSON.stringify(memberList, 2)} */}
										{/* ////
									{JSON.stringify(dataToExport, 2)} */}

									<table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
	<thead className="text-xs text-slate-50 uppercase bg-slate-700 dark:bg-gray-700 dark:text-gray-400">
		<tr>
			<th scope="col" className="px-6 py-3 font-semibold">
				Sl. No.
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Transaction No.
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Member SB A/C No.
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Transaction Date
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Transaction Type
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Debit Amount
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Credit Amount
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Member Balance
			</th>

			{/* <th scope="col" className="px-6 py-3 font-semibold">
				Remarks
			</th> */}

			<th scope="col" className="px-6 py-3 font-semibold">
				Approved By
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Approved Date
			</th>

			<th scope="col" className="px-6 py-3 font-semibold">
				Approval Status
			</th>
		</tr>
	</thead>

	<tbody>
		{memberList?.map((item, i) => {
			totalCredit += Number(item?.cr_amt || 0)
			totalDebit += Number(item?.dr_amt || 0)

			return (
				<tr
					key={i}
					className="bg-slate-50 border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600"
				>
					<td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
						{i + 1}
					</td>

					<td className="px-6 py-4">
						{item?.trans_no || "--"}
					</td>

					<td className="px-6 py-4">
						{item?.mem_sb_acc_no || "--"}
					</td>

					<td className="px-6 py-4">
						{item?.trans_dt
							? moment(item.trans_dt).format("DD-MM-YYYY")
							: "--"}
					</td>

					<td className="px-6 py-4">
						{item?.dep_with_flag || "--"}
					</td>

					<td className="px-6 py-4">
						{item?.dr_amt || 0}/-
					</td>

					<td className="px-6 py-4">
						{item?.cr_amt || 0}/-
					</td>

					<td className="px-6 py-4">
						{item?.member_balance || 0}/-
					</td>

					{/* <td className="px-6 py-4">
						{item?.remarks || "--"}
					</td> */}

					<td className="px-6 py-4">
						{item?.approved_by || "--"}
					</td>

					<td className="px-6 py-4">
						{item?.approved_at
							? moment(item.approved_at).format("DD-MM-YYYY")
							: "--"}
					</td>

					<td className="px-6 py-4">
						{item?.approval_flag == "U" ? (
							<div className="pending_dis_2">
								<SyncOutlined
									style={{ color: "#fff", marginRight: 6 }}
								/>
								Unapproved
							</div>
						) : item?.approval_flag == "A" ? (
							<div className="accept_dis_2">
								<CheckCircleFilled
									style={{ color: "#fff", marginRight: 6 }}
								/>
								Approved
							</div>
						) : (
							<div className="pending_dis_2">
								<CloseCircleOutlined
									style={{ color: "#fff", marginRight: 6 }}
								/>
								Rejected
							</div>
						)}
					</td>
				</tr>
			)
		})}
	</tbody>
</table>
								</div>
							</Spin>
						</div>
						
					</div>
				</form>
				<div className="flex gap-4">
					<Tooltip title="Export to Excel">
						<button
						onClick={() => {
						const dt = dataToExport.map(el => {
						return {
						...el,

						// ✅ Convert transaction type
						// trans_type:
						// el.trans_type === "D"
						// ? "Disbursement"
						// : el.trans_type === "I"
						// ? "Interest"
						// : el.trans_type === "R"
						// ? "Recovery"
						// : el.trans_type,

						// ✅ Convert approval status
						approval_flag:
						el.approval_flag === "U"
						? "Unapproved"
						: el.approval_flag === "A"
						? "Approved"
						: el.approval_flag === "R"
						? "Rejected"
						: el.approval_flag,
						}
						})

						exportToExcel(dt, headersToExport, fileName, [0])
						}}
							className={
								dataToExport?.length > 0
									? "mt-5 justify-center items-center rounded-full text-green-900"
									: "mt-5 justify-center items-center rounded-full text-green-300"
							}
							disabled={dataToExport?.length === 0}
						>
							<FileExcelOutlined
								style={{
									fontSize: 30,
								}}
							/>
						</button>
					</Tooltip>
					<Tooltip title="Print">
						<button
							// onClick={() =>
							// 	printTableReport(
							// 		dataToExport,
							// 		headersToExport,
							// 		fileName?.split(".")[0],
							// 		[0]
							// 	)
							// }
							onClick={() => {
							const dt = dataToExport.map(el => {
							return {
							...el,

							// ✅ Convert transaction type
							// trans_type:
							// el.trans_type === "D"
							// ? "Disbursement"
							// : el.trans_type === "I"
							// ? "Interest"
							// : el.trans_type === "R"
							// ? "Recovery"
							// : el.trans_type,

							// ✅ Convert approval status
							approval_flag:
							el.approval_flag === "U"
							? "Unapproved"
							: el.approval_flag === "A"
							? "Approved"
							: el.approval_flag === "R"
							? "Rejected"
							: el.approval_flag,
							}
							})

							printTableReport(
							dt,
							headersToExport,
							fileName?.split(".")[0],
							[0]
							)
							}}
							className={
								dataToExport?.length > 0
									? "mt-5 justify-center items-center rounded-full text-pink-600"
									: "mt-5 justify-center items-center rounded-full text-pink-300"
							}
							disabled={dataToExport?.length === 0}
						>
							<PrinterOutlined
								style={{
									fontSize: 30,
								}}
							/>
						</button>
					</Tooltip>
				</div>
			</Spin>

			
		</>
	)
}

export default SB_AC_MemberDetailsForm_BDCCB
