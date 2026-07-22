import React, { useEffect, useRef, useState } from "react"
import "../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import BtnComp from "../../Components/BtnComp"
import VError from "../../Components/VError"
import TDInputTemplate from "../../Components/TDInputTemplate"
import { useNavigate } from "react-router-dom"
import { FieldArray, Formik, useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import { Message } from "../../Components/Message"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Spin, Button, Popconfirm, Tag, Timeline, Divider, Modal, Tooltip } from "antd"
import {
	LoadingOutlined,
	DeleteOutlined,
	PlusOutlined,
	MinusOutlined,
	FilePdfOutlined,
	MinusCircleOutlined,
	ClockCircleOutlined,
	ArrowRightOutlined,
	UserOutlined,
	EyeOutlined,
	EyeFilled,
	CheckCircleOutlined,
	CloseCircleOutlined,
	FileExcelOutlined,
} from "@ant-design/icons"
import FormHeader from "../../Components/FormHeader"
import { routePaths } from "../../Assets/Data/Routes"
import { useLocation } from "react-router"
import Sidebar from "../../Components/Sidebar"
import DialogBox from "../../Components/DialogBox"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import TimelineComp from "../../Components/TimelineComp"
import DynamicTailwindTable from "../../Components/Reports/DynamicTailwindTable"
import { disbursementDetailsHeader } from "../../Utils/Reports/headerMap"
import { getOrdinalSuffix } from "../../Utils/ordinalSuffix"
import AlertComp from "../../Components/AlertComp"
import moment from "moment"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { formatDateToYYYYMMDD } from "../../Utils/formateDate"
import { saveMasterData } from "../../services/masterService"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
const formatINR = (num) =>
	new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(num || 0)
function ViewRefinanceApproveFormBranch_BDCCB({ groupDataArr }) {
	const [loanDtls,setLoanDtls] = useState([]);
	const [isOverdue, setIsOverdue] = useState('N');
	const [overDueAmt, setOverDueAmt] = useState(0);
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const loanAppData  = location.state || {}
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))
	const [count, setCount] = useState(0)
	const [groupData, setGroupData] = useState(() => [])
	const [openModal, setOpenModal] = useState(false)
	const [branches, setBranches] = useState(() => [])
	const [branch, setBranch] = useState(() => "")

	const [blocks, setBlocks] = useState(() => [])
	const [block, setBlock] = useState(() => "")

	const [groupDetails, setGroupDetails] = useState(() => [])
	const [memberDetails, setMemberDetails] = useState(() => [])
	const [visible, setVisible] = useState(() => false)
	const [period_mode, setPeriodMode] = useState("")
	const [period_mode_val, setPeriodModeVal] = useState(0)
	const [weekOfRecovery, setWeekOfRecovery] = useState(0)
	const [actionType, setActionType] = useState(""); 
	const [rej_res, setRejRes] = useState("")

	const containerRef = useRef(null)

	const [isHovered, setIsHovered] = useState(false)
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
						"Branch SHG ID": loan.branch_shg_id,
						"PACS Name": loan.pacs_name,
						"Period": loan.period,
						"Current ROI": loan.curr_roi,
						"Penal ROI": loan.penal_roi,
						"Disbursement Date": loan.disb_dt,
						"Disbursement Amount": loan.disb_amt,
						"Pay Mode": loan.period_mode,
						"Repayment Start Date": loan.rep_start_dt,
						"Repayment End Date": loan.rep_end_dt,
						"Sanction No": loan.sanction_no,
						"Soceity Account No": loan.society_acc_no,
						"Sanction Date": loan.sanction_dt,
						"Transaction Type": loan.trans_type === "D" ? "Disbursement" : loan.trans_type === "R" ? "Recovery" : loan.trans_type,

						"Approval Status": loan.approval_status === "A" ? "Approved" : loan.approval_status,

						// Member level fields
						// "Member Loan ID": member.mem_loan_id,
						// "Transaction ID": member.tran_id,
						// "Member Group Code": member.group_code,
						// "Member Group Name": member.group_name,
						// "Member ID": member.member_id,
						// "Member Name": member.member_name,
						// "Disburse Amount": member.disburse_amt,
						// "SB Account No": member.sb_acc_no
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
		const fileName = `BranchLoanDetails_${new Date().toISOString().slice(0, 10)}.xlsx`;
		saveAs(blob, fileName);
	};
	const handleWheel = (event) => {
		if (isHovered && containerRef.current) {
			containerRef.current.scrollLeft += event.deltaY
			event.preventDefault()
		}
	}

	const handleMouseEnter = () => {
		setIsHovered(true)
	}

	const handleMouseLeave = () => {
		setIsHovered(false)
	}

	

	const initialValues = {
		society_loan_acc: '',
		// g_group_name: "",
		// g_address: "",
		// sahayika_id: "",
		// g_pin: "",
		// g_phone1: "",
		// dist_id: "",
		// ps_id: "",
		// po_id: "",
		// block_id: "",
		// gp_id: "",
		// village_id: "",
		// g_total_outstanding: "",
	}
	const [formValues, setValues] = useState(initialValues)

	const validationSchema = Yup.object({
		// society_loan_acc: Yup.string().required("Society Loan A/C No. name is required"),
		society_loan_acc: Yup.string(),
	})

	const fetchGroupDetails = async () => {

		setGroupData(loanAppData ? [loanAppData] : [])
		
	}

	useEffect(() => {
		fetchGroupDetails()
	}, [count])

	
	const onSubmit = async (values) => {
		console.log("onsubmit called")
		console.log(values, "formDataformDataformDataformData")
		setLoading(true)

		setVisible(true)

		setLoading(false)
	}

	const formik = useFormik({
		initialValues: +params.id > 0 ? formValues : initialValues,
		onSubmit,
		validationSchema,
		validateOnChange: true,
		validateOnBlur: true,
		enableReinitialize: true,
		validateOnMount: true,
	})

	
	const formatDateToYYYYMMDD_CurrentDT = (date) => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
	};

	const getClientIP = async () => {
		const res = await fetch("https://api.ipify.org?format=json")
		const data = await res.json()
		return data.ip
	}

	const approveDisbursement = async () => {
	
	// alert('approveDisbursement')
	// const member_ids = groupData[0]?.members.map(item => ({
	// loan_id: item.mem_loan_id,
	// group_code: item.group_code,
	// member_code: item.member_id,
	// disb_amt: item.disburse_amt,
	// trans_id: item.tran_id,
	// }));


	setLoading(true)

	const ip = await getClientIP()

	const creds = {
	loan_id: groupData[0]?.loan_id,
	branch_id: userDetails[0]?.brn_code,
	tenant_id: userDetails[0]?.tenant_id,
	trans_id: groupData[0]?.trans_id,
	group_code: groupData[0]?.group_code,
	curr_roi: groupData[0]?.curr_roi,
	penal_roi: groupData[0]?.penal_roi,
	period: groupData[0]?.period,
	disb_dt: groupData[0]?.disb_dt,
	created_by: userDetails[0]?.emp_id,
	// ip_address: ip,

	// society_acc_no : formik.values.society_loan_acc,
	// loan_acc_no: groupData[0]?.loan_acc_no,
	// group_code: loanAppData?.group_code,
	// member_ids: member_ids,

	}

await saveMasterData({
	endpoint: "refinance/approve_re-finance_branch",
	creds,
	navigate,
	successMsg: "Transaction Accepted",
	onSuccess: () => navigate(-1),

	// 🔥 fully dynamic failure handling
	failureRedirect: routePaths.LANDING,
	clearStorage: true,
	})

	// console.log(creds, 'formDataformDataformDataformData');

	setLoading(false)
	}

	const rejectDisbursement = async () => {
	
	const member_ids = groupData[0]?.members.map(item => ({
	loan_id: item.mem_loan_id,
	disb_amt: item.disburse_amt,
	trans_id: item.tran_id,
	member_id: item.member_id,
	}));

	setLoading(true)

	const ip = await getClientIP()

	const creds = {
	// ccb_loan_id: groupData[0]?.loan_id,
	// loan_id: groupData[0]?.loan_id,
	// trans_id: 0,
	// group_code: groupData[0]?.group_code,

	loan_id: [groupData[0]?.loan_id],
	trans_id: '0',
	group_code: [groupData[0]?.group_code],
	// reject_remarks: rej_res,
	member_reject: member_ids,
	created_by: userDetails[0]?.emp_id,
	ip_address: ip,
	}

	// console.log(creds, 'formDataformDataformDataformData', 'reject');
	// return;

	await saveMasterData({
	endpoint: "refinance/reject_refinance_disb",
	creds,
	navigate,
	successMsg: "Transaction Accepted",
	onSuccess: () => navigate(-1),

	// 🔥 fully dynamic failure handling
	failureRedirect: routePaths.LANDING,
	clearStorage: true,
	})

	setLoading(false)

	}

	const acceptReject = async (actionType)=>{
		if(actionType == 'A'){
			approveDisbursement()
		}
		// if(actionType == 'R'){
		// 	rejectDisbursement()
		// }
		
	}

	return (
		<>
		{
					isOverdue === 'Y' && <AlertComp 
					
					msg={<p className="text-2xl font-normal"><span className="text-lg ">Loan Overdue Amount is </span>{formatINR(overDueAmt)}</p>} />
				}
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<form onSubmit={formik.handleSubmit} className={`${isOverdue == 'Y' ? 'mt-5' : ''}`}>
					{/* {JSON.stringify(userDetails[0], null, 2)} //////////////////////////////////
						{JSON.stringify(loanAppData, 2)} \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
						{JSON.stringify(groupData[0], 2)} */}
						
					<div className="flex flex-col justify-start gap-5">
						<div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
						
						
							<div className="text-[#DA4167] text-lg font-bold sm:col-span-3"> Branch Loan Details</div>

							<div className="sm:col-span-1">
							<TDInputTemplateBr
							placeholder="Society Loan A/C No."
							type="text"
							label="Society Loan A/C No."
							name="society_loan_acc"
							handleChange={formik.handleChange}
							handleBlur={formik.handleBlur}
							formControlName={formik.values.society_loan_acc}
							disabled={loanAppData?.approval_status == 'U' ? false : true}
							mode={1}
							/>
								{formik.errors.society_loan_acc && formik.touched.society_loan_acc ? (
									<VError title={formik.errors.society_loan_acc} />
								) : null}
							</div>

							<div className="sm:col-span-1">
							<TDInputTemplateBr
									type="text"
									label="Loan Account No. "
									name="loan_acc_no"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={groupData[0]?.loan_acc_no}
									mode={1}
									disabled
								/>
							</div>

							 <div className="sm:col-span-3">
							<TDInputTemplateBr
									type="text"
									label="Select PACS "
									name="pacs_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={userDetails[0]?.branch_name}
									mode={1}
									disabled
								/>
							</div>


						<div>

							<TDInputTemplateBr
							type="date"
							label="Sanction Date"
							name="sanction_dt"
							formControlName={formatDateToYYYYMMDD_CurrentDT(groupData[0]?.sanction_dt)}
							mode={1}
							disabled={true}
						/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
								label="Sanction No."
								formControlName={groupData[0]?.sanction_no} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
								label="Period (In Month)"
								formControlName={groupData[0]?.period} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
								label="Current ROI"
								formControlName={groupData[0]?.curr_roi} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>
						

						<div>
								
								<TDInputTemplateBr
									type="text"
									// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
									label="Ovd ROI"
									formControlName={groupData[0]?.penal_roi} // Default to SHG
									mode={1}
									disabled={true}
								/>
							</div>

						<div>

							<TDInputTemplateBr
								type="date"
								label="Disburse Date"
								formControlName={formatDateToYYYYMMDD_CurrentDT(groupData[0]?.disb_dt)} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						{/* <div>

							<TDInputTemplateBr
								type="text"
								label="Disburse Amount"
								formControlName={groupData[0]?.disb_amt} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>
						

						

						<div>

							<TDInputTemplateBr
								type="text"
								label="Number Of Group"
								formControlName={groupData[0]?.tot_grp} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div> */}

						



						{/* ////////////////////////// Below Old ///////////////////////// */}


								{/* {JSON.stringify(formik.values, null, 2)} */}
							{/* <div className="text-[#DA4167] text-lg font-bold sm:col-span-3"> Group Loan Details</div>
							<div className="sm:col-span-1">
								<TDInputTemplateBr
									placeholder="Group Code"
									type="text"
									label="Group Code"
									name="g_code"
									// handleChange={formik.handleChange}
									// handleBlur={formik.handleBlur}
									// formControlName={formik.values.g_co_name}
									formControlName={params.id}
									mode={1}
									disabled
								/>
								
							</div>
							

							<div>
								<TDInputTemplateBr
									placeholder="Group Name"
									type="text"
									label="Group Name"
									name="g_group_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_group_name}
									mode={1}
									disabled
								/>
							
							</div>

							<div className="sm:col-span-3">
								<TDInputTemplateBr
									placeholder="Type Address..."
									type="text"
									label={`Address`}
									name="g_address"
									formControlName={formik.values.g_address}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={3}
									disabled
								/>
								
							</div>

							

					
							
								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="Sahayika Name"
										name="sahayika_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.sahayika_id}
										mode={1}
										disabled
									/>
								</div>

								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="PIN No."
										name="g_pin"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.g_pin}
										mode={1}
										disabled
									/>
								</div>
								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="Mobile No. Of Group Leader/Sahayika"
										name="g_phone1"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.g_phone1}
										mode={1}
										disabled
									/>
								</div>

								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="District"
										name="dist_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.dist_id}
										mode={1}
										disabled
									/>
								</div>

								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="Police Station"
										name="ps_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.ps_id}
										mode={1}
										disabled
									/>
								</div>
								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="Post Office"
										name="po_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.po_id}
										mode={1}
										disabled
									/>
								</div>
								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="Block"
										name="block_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.block_id}
										mode={1}
										disabled
									/>
								</div>

								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="GP Name"
										name="gp_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.gp_id}
										mode={1}
										disabled
									/>
								</div>

								<div>
									
									<TDInputTemplateBr
										// placeholder="Branch Name"
										type="text"
										label="Village Name"
										name="village_id"
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										formControlName={formik.values.village_id}
										mode={1}
										disabled
									/>
								</div> */}
								
							
							
						</div>
						

						

						{/* {params?.id > 0 && (
							<div className="gap-3">
								<div className="w-full my-10 border-t-4 border-gray-400 border-dashed"></div>
								<div>
									<div className="text-[#DA4167] text-lg mb-2 font-bold">
										Members in this Group
									</div>


									
									<Spin spinning={loading}>
										<div
											ref={containerRef}
											className={`relative overflow-x-auto shadow-md sm:rounded-lg`}
											onWheel={handleWheel}
											onMouseEnter={handleMouseEnter}
											onMouseLeave={handleMouseLeave}
										>
											<table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
												<thead className="text-xs text-white uppercase bg-slate-800 dark:bg-gray-700 dark:text-gray-400">
													<tr>

														<th scope="col" className="px-6 py-3 font-semibold">
															Group Name
														</th>

														<th scope="col" className="px-6 py-3 font-semibold">
															Member Name
														</th>
														
														<th scope="col" className="px-6 py-3 font-semibold">
															SB Account
														</th>
														
														<th scope="col" className="px-6 py-3 font-semibold">
															Disburse Amount
														</th>
													
													</tr>
												</thead>
												<tbody>
													{groupData[0]?.members?.map((item, i) => (
														<tr
															key={i}
															className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600"
														>
															<th
																scope="row"
																className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
															>
																{item?.group_name}
															</th>
															<th
																scope="row"
																className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
															>
																{item?.member_name}
															</th>
															
															<td className="px-6 py-4">{item?.sb_acc_no}</td>
															<td className="px-6 py-4">{item?.disburse_amt}/-</td>
															
														</tr>
													))}
													<tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
														<td className="px-6 py-4 font-semibold" colSpan={3}>
															Total Disburse Amount
														</td>
														<td
															className="px-6 py-4 text-left font-semibold"
															colSpan={1}
														>
															{groupData[0]?.disb_amt}/-
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</Spin>
								</div>
							</div>
						)} */}
					</div>
					{/* <BtnComp
						mode="A"
						// rejectBtn={true}
						// onReject={() => {
						// 	setVisibleModal(false)
						// }}
						onReset={formik.resetForm}
						// sendToText="Credit Manager"
						// onSendTo={() => console.log("dsaf")}
						// condition={fetchedFileDetails?.length > 0}
						// showSave
						param={params?.id}
					/> */}

				
					{loanAppData?.approval_status == 'U' &&(	
						<div className="flex justify-center  sm:gap-6 mt-8">
						<button
						className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
						// onClick={async () => {
						// // await checkingBeforeApprove()
						// setActionType("A")
						// setVisible(true)
						
						// }}
						onClick={async () => {
						// check value first
						if (!formik.values.society_loan_acc) {
							// mark field touched to show error
							formik.setFieldTouched("society_loan_acc", true);

							Message("error", "Society Loan A/C No. is required");
							return;
						}

						// if value exists → console it
						// console.log("Society Loan A/C No.:", formik.values.society_loan_acc);

						// continue existing flow
						setActionType("A");
						setVisible(true);
						}}
						>
						<CheckCircleOutlined /> <span className={`ml-2`}>Accept Transaction</span>
						</button>


						{/* <button
						className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-[#DA4167] border-[#DA4167] bg-[#DA4167] transition ease-in-out hover:bg-[#DA4167] hover:text-white duration-300 rounded-full  dark:focus:ring-primary-900`}
						onClick={async () => {
						// check value first
						// if (!formik.values.society_loan_acc) {
						// 	// mark field touched to show error
						// 	formik.setFieldTouched("society_loan_acc", true);

						// 	Message("error", "Society Loan A/C No. is required");
						// 	return;
						// }

						// if value exists → console it
						// console.log("Society Loan A/C No.:", formik.values.society_loan_acc);

						// continue existing flow
						setActionType("R");
						setVisible(true);
						}}
						>
						<CloseCircleOutlined /> <span className={`ml-2`}>Rejected Transaction</span>
						</button> */}

						

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

						
											
						</div>
						)} 

						<DialogBox
							flag={4}
							onPress={() => setVisible(!visible)}
							visible={visible}
							onPressYes={async () => {
							await acceptReject(actionType)
							.then(() => {
							})
							.catch((err) => {
							// console.log("Err in RecoveryCoApproveTable.jsx", err)
							})
							setVisible(!visible)
							}}
							onPressNo={() => {
								setVisible(!visible)
							}}
						/>
				</form>

				 <div className="flex justify-start gap-4 bg-white p-4">
						<Tooltip title="Export to Excel">
							<button
								onClick={() => handleExportMembers(groupData)}
								className="mt-5 justify-center items-center rounded-full text-green-900"
							>
								<FileExcelOutlined
									style={{
										fontSize: 30,
									}}
								/>
							</button>
						</Tooltip>

					</div>


			</Spin>

			{/* <DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {
					// editGroup()
					setVisible(!visible)
				}}
				onPressNo={() => setVisible(!visible)}
			/> */}

			{/* <Modal
				// width={{
				// 	xs: '90%',
				// 	sm: '80%',
				// 	md: '70%',
				// 	lg: '60%',
				// 	xl: '50%',
				// 	xxl: '40%',
				// 	}}
				title="Overdue Details"
				okButtonProps={null}
				open={openModal}
				onCancel={() => setOpenModal(false)}>
					<table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
								<thead className="text-xs text-white uppercase bg-slate-800 dark:bg-gray-700 dark:text-gray-400">
									<tr>
										<th scope="col" className="px-6 py-3 font-semibold">
											Overdue Amount
										</th>
										<th scope="col" className="px-6 py-3 font-semibold">
											Overdue Date
										</th>
										
									</tr>
								</thead>
								<tbody>
									{loanDtls.map((item, i) => (
										<tr
											key={i}
											className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600"
										>
											
											<td className="px-6 py-4">{item?.od_amt ? item?.od_amt : '0.00'}</td>
											<td className="px-6 py-4">
												{item?.od_date ? moment(item?.od_date).format("DD-MM-YYYY") : "N/A"}
											</td>
											
										</tr>
									))}
									
								</tbody>
							</table>
			</Modal> */}

		</>
	)
}

export default ViewRefinanceApproveFormBranch_BDCCB
