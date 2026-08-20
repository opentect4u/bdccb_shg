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
	CheckCircleFilled,
	SyncOutlined,
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
function ViewLoanForm_BDCCB({ groupDataArr }) {
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

	// const [LoanApproveORUnApprov, setLoanApproveORUnApprov] = useState("U")
	const [LoanApproveORUnApprov, setLoanApproveORUnApprov] = useState(loanAppData?.approval_status)

	const [FormData, setFormData] = useState(() => [])

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
		const fileName = `SocietyDisburse_Members_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
		sanction_dt: '',
		sanction_No: "",
		period_month: "",
		current_roi: "",
		ovd_roi: "",
		disburse_date: "",
		members: [],
		// member: [
		// 	{
		// 		member_name: "",
		// 		member_code: "",
		// 		member_account_no: "",
		// 		amount: "",
		// 	},
		// ],
	}
	const [formValues, setValues] = useState(initialValues)

	const validationSchema = Yup.object({
		// society_loan_acc: Yup.string().required("Society Loan A/C No. name is required"),
		society_loan_acc: Yup.string().required("Society Loan A/C No. name is required"),
		sanction_dt: Yup.date().required("Sanction Date is required"),
		sanction_No: Yup.mixed().required("Sanction No is required"),
		period_month: Yup.string().required("Period is required"),
		current_roi: Yup.mixed().required("Current ROI is required"),
		ovd_roi: Yup.mixed().required("Overdue ROI is required"),
		disburse_date: Yup.date()
					.required("Disbursement Date is required")
					.min(
						Yup.ref("sanction_dt"),
						"Disbursement Date must be greater than or equal to Sanction Date"
					),
		members: Yup.array().of(
		Yup.object().shape({
			disburse_amt: Yup.number()
				.typeError("Amount must be number")
				.required("Member Amount is required")
				.min(0, "Amount cannot be negative"),
		})
	),

	})


	
	const onSubmit = async (values) => {
		console.log("onsubmit called")
		console.log(values, "formDataformDataformDataformData", formValues)
		console.log("Full Form Values", values, 'Member Amount Array');
		setFormData(values)

		// console.log(
		// 	"Member Amount Array",
		// 	values.members.map((item) => ({
		// 		member_code: item.group_code,
		// 		member_id: item.member_id,
		// 		disburse_amt: item.disburse_amt,
		// 	}))
		// );

		// return;
		setActionType("S");
		setLoading(true)

		setVisible(true)

		setLoading(false)
	}

	const formik = useFormik({
		// initialValues: initialValues,
		initialValues: + params.id > 0 ? formValues : initialValues,
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


	const fetchFullAcceptForm = async () => {

		const formattedRows = loanAppData?.members?.map(row => ({
			mem_loan_id: row.mem_loan_id || "",
			sb_acc_no: row.sb_acc_no || "",
			shg_id: row.group_code || "",
			member_id: row.member_id || "",
			amount: row.disburse_amt || "",
			group_name: row.group_name || "",
			member_name: row.member_name || "",
		}));

		setValues({
			society_loan_acc: loanAppData?.society_details?.society_acc_no,
			sanction_dt: loanAppData?.society_details?.sanction_dt,
			sanction_No: loanAppData?.society_details?.sanction_no,
			period_month: loanAppData?.society_details?.period,
			current_roi: loanAppData?.society_details?.curr_roi,
			ovd_roi: loanAppData?.society_details?.penal_roi,
			disburse_date: loanAppData?.society_details?.disb_dt,
			// members: [],
		});

		setGroupData(loanAppData?.member_details)
		
		formik.setFieldValue(
				"members",
				loanAppData?.member_details?.map((item) => ({
					group_code: loanAppData?.group_code,
					member_id: item?.member_code,
					disburse_amt: item?.disb_amt,
				}))
			)
	};


	const approveDisbursement = async () => {
		setLoading(true)
		
		const ip = await getClientIP()

		const creds = {
		ccb_loan_id: loanAppData?.ccb_loan_id,
		tenant_id: userDetails[0]?.tenant_id,
		group_code: loanAppData?.group_code,
		branch_id: userDetails[0]?.brn_code,
		loan_acc_no: loanAppData?.loan_acc_no,
		tot_outstanding: loanAppData?.tot_outstanding,
		loan_trans_id: loanAppData?.loan_trans_id,
		transaction_id: loanAppData?.transaction_id,
		created_by: userDetails[0]?.emp_id,
		ip_address: ip,
		}


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/loan/approve_pacs_dib_via_branch`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
			
			if(res?.data?.success){
			console.log(res?.data, 'formDataformDataformDataformData');
			setLoanApproveORUnApprov('A')
			fetchMemberDetails()
			// setValues({
			// society_loan_acc: res?.data?.data[0]?.society_acc_no,
			// })
			// setGroupData(res?.data?.data)
							
			} else {
			navigate(routePaths.LANDING)
			localStorage.clear()
			}
							
			
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}

	const fetchMemberDetails = async () => {
		setLoading(true)
		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			group_code: loanAppData?.group_code,
		}


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/loan/fetch_member_dt`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
			
			if(res?.data?.success){
			console.log(res?.data?.data, 'dataaaaaaaaaaaaaaaaa');
			
			// setValues({
			// 		society_loan_acc: res?.data?.data[0]?.society_acc_no,
			// 	})
			setGroupData(res?.data?.data)

			formik.setFieldValue(
				"members",
				res?.data?.data?.map((item) => ({
					group_code: loanAppData?.group_code,
					member_id: item?.member_code,
					disburse_amt: "",
					
				}))
			)

							
			} else {
			navigate(routePaths.LANDING)
			localStorage.clear()
			}
							
			
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}

	const checkGroupStatus = async () => {
		setLoading(true)
		
		const ip = await getClientIP()

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			group_code: loanAppData?.group_code,
			loan_id: loanAppData?.loan_id || loanAppData?.ccb_loan_id,
		}

// 		  "tenant_id" : "",
//   "group_code" : 


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/loan/check_grp_status`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
			console.log(res?.data, 'checkGroupStatuscheckGroupStatus');
			if(res?.data?.success){
				if(res?.data?.approved){
					setLoanApproveORUnApprov('A')
				} else {
					setLoanApproveORUnApprov('U')
				}
			
			} else {
			navigate(routePaths.LANDING)
			localStorage.clear()
			}
							
			
			})
			.catch((err) => {
				console.log(err, 'checkGroupStatuscheckGroupStatus');
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}

	const rejectDisbursement = async () => {
		setLoading(true)
		const ip = await getClientIP()

		const creds = {
		ccb_loan_id: loanAppData?.ccb_loan_id,
		tenant_id: userDetails[0]?.tenant_id,
		loan_trans_id: loanAppData?.loan_trans_id,
		transaction_id: loanAppData?.transaction_id,
		group_code: loanAppData?.group_code,
		loan_acc_no: loanAppData?.loan_acc_no,
		tot_outstanding: loanAppData?.tot_outstanding,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/loan/reject_pacs_disbursement`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
			
			if(res?.data?.success){
			navigate(-1)
							
			} else {
			navigate(routePaths.LANDING)
			localStorage.clear()
			}
							
			
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}

	const saveGroupData = async () => {
			const formattedRows = FormData?.members?.map(row => ({
				group_code: row.group_code,
				member_id: row.member_id,
				disburse_amt: Number(row.disburse_amt),
			}))

	
			setLoading(true)
	
			const ip = await getClientIP()
	
			const creds = {
				ccb_loan_id : loanAppData?.ccb_loan_id,
				tenant_id: userDetails[0]?.tenant_id,
				loan_to : "P",
				branch_shg_id : userDetails[0]?.brn_code,
				loan_acc_no: loanAppData?.loan_acc_no,
				period : FormData?.period_month,
				curr_roi : FormData?.current_roi,
				penal_roi : FormData?.ovd_roi,
				disb_dt : FormData?.disburse_date,
				sanction_no : FormData?.sanction_No,
				sanction_dt : FormData?.sanction_dt,
				society_acc_no : FormData?.society_loan_acc,
				members: formattedRows,
				created_by : userDetails[0]?.emp_id,
  				ip_address : ip,
			}

			console.log(creds, 'credscredscredscreds__');
			
	
			await saveMasterData({
				endpoint: "loan/save_society_level_disburse",
				creds,
				navigate,
				successMsg: "Loan Disburse Successfully",
				onSuccess: () => navigate(-1),
				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
			})
	
			setLoading(false)
		}

	const acceptReject = async (actionType)=>{
		console.log(actionType, 'actionTypeactionTypeactionType');
		
		if(actionType == 'A'){
			approveDisbursement()
		}
		if(actionType == 'R'){
			rejectDisbursement()
		}

		if(actionType == 'S'){
			saveGroupData()
		}
		
	}



	useEffect(()=>{
		checkGroupStatus()
		if(LoanApproveORUnApprov == "A"){
			if(loanAppData?.member_details.length < 1){
			fetchMemberDetails()
			}
		}
		// fetchMemberDetails()

		if(loanAppData?.member_details.length > 0){
			fetchFullAcceptForm()
		}
	}, [])

	useEffect(() => {
			const currRoi = Number(formik.values.current_roi);
	
			if (!isNaN(currRoi) && currRoi !== "") {
				// console.log(formik.values.curr_roi, 'ccccccccccc');
				if (formik.values.current_roi > 0) {
					formik.setFieldValue("ovd_roi", currRoi + 2);
				}
			}
		}, [formik.values.current_roi]);

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

				<div className="flex flex-col justify-start gap-5 mb-5">
					{LoanApproveORUnApprov== 'A' && (<div className="accept_dis_3"><CheckCircleFilled style={{ color: "#fff", marginRight: 6 }} />
						Approved Transaction </div>)}
						{LoanApproveORUnApprov == 'U' && (<div className="pending_dis_3"><SyncOutlined style={{ color: "#fff", marginRight: 6 }} />
						Unapproved Transaction </div>)}
						
						{/* <div className="grid gap-4 sm:grid-cols-3 sm:gap-6"> */}
						
						{/* {JSON.stringify(loanAppData, 2)} ///
						{JSON.stringify(loanAppData?.member_details, 2)}  */}
				
						
						
						
							{/* <div className="text-[#DA4167] text-lg font-bold sm:col-span-3 mb-0"> Group Loan Details</div> */}

							{/* <div className="sm:col-span-3 mt-6">
							<Tag color="#2563eb" className="text-white mb-3 font-bold">
																		Add Group Details
																	</Tag>
																	</div> */}

							
							<div className={LoanApproveORUnApprov == 'U' ? `grid grid-cols-12 gap-5 mb-3 p-5 bg-red-100 border border-red-500/50 rounded-md relative` : `grid grid-cols-12 gap-5 mb-3 p-5 bg-green-100 border border-green-500/50 rounded-md relative`}>
							{/* <div className="grid grid-cols-12 gap-3 mb-3 p-3 bg-pink-100 border border-pink-500/50 rounded-md relative"> */}
							<Tag className={LoanApproveORUnApprov == 'U' ? `customeTxt_Unapprove` : `customeTxt_Approve`}>Group Loan Details</Tag>
																	
							<div className="col-span-4">
							<TDInputTemplateBr
							placeholder="Unapproved Amount"
							type="text"
							label={LoanApproveORUnApprov == 'U' ? `Unapproved Amount` : `Approved Disburse Amount`}
							name="unapprovedAmount_new"
							handleChange={formik.handleChange}
							handleBlur={formik.handleBlur}
							formControlName={loanAppData?.tot_outstanding}
							disabled
							mode={1}
							/>
								
							</div>

							<div className="col-span-4">
							<TDInputTemplateBr
									type="text"
									label="Group Name"
									name="group_name_new"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={loanAppData?.group_name}
									mode={1}
									disabled
								/>
							</div>

							<div className="col-span-4">
							<TDInputTemplateBr
									type="text"
									label="Group SB A/C"
									name="group_sb_acc"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={loanAppData?.sb_ac_no}
									mode={1}
									disabled
								/>
							</div>
							</div>

						{/* </div> */}

						{LoanApproveORUnApprov == 'U' &&(	
						<div className="flex justify-center  sm:gap-6 mt-8">
						<button
						className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
						onClick={async () => {
						// if (!formik.values.society_loan_acc) {
						// 	// mark field touched to show error
						// 	formik.setFieldTouched("society_loan_acc", true);
						// 	Message("error", "Society Loan A/C No. is required");
						// 	return;
						// }
						setActionType("A");
						setVisible(true);
						}}
						>
						<CheckCircleOutlined /> <span className={`ml-2`}>Approved Transaction</span>
						</button>


						<button
						className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-[#DA4167] border-[#DA4167] bg-[#DA4167] transition ease-in-out hover:bg-[#DA4167] hover:text-white duration-300 rounded-full  dark:focus:ring-primary-900`}
						onClick={async () => {
						setActionType("R");
						setVisible(true);
						}}
						>
						<CloseCircleOutlined /> <span className={`ml-2`}>Rejected Transaction</span>
						</button>
											
						</div>
						)} 
						
					</div>
					{LoanApproveORUnApprov == 'A' &&(
					<form onSubmit={formik.handleSubmit} className={`${isOverdue == 'Y' ? 'mt-5' : ''}`}>

					<div className="flex flex-col justify-start gap-5">
					<div className="grid gap-4 sm:grid-cols-3 sm:gap-6">


					<div className="text-[#DA4167] text-lg font-bold sm:col-span-3"> Society Loan Details</div>

					<div className="sm:col-span-1">
					<TDInputTemplateBr
					placeholder="Society Loan A/C No."
					type="text"
					label="Society Loan A/C No."
					name="society_loan_acc"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formik.values.society_loan_acc}
					// disabled={loanAppData?.member_details.length < 1 ? false : true}
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
					formControlName={loanAppData?.loan_acc_no}
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

					{/* <TDInputTemplateBr
					type="date"
					label="Sanction Date"
					name="sanction_dt"
					formControlName={formatDateToYYYYMMDD_CurrentDT(groupData[0]?.sanction_dt)}
					mode={1}
					// disabled={true}
					/> */}
					<TDInputTemplateBr
					placeholder="Sanction Date"
					type="date"
					label="Sanction Date"
					name="sanction_dt"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formatDateToYYYYMMDD_CurrentDT(formik.values.sanction_dt)}
					mode={1}
					/>
					{formik.errors.sanction_dt && formik.touched.sanction_dt ? (
					<VError title={formik.errors.sanction_dt} />
					) : null}
					</div>

					<div>

					{/* <TDInputTemplateBr
					type="text"
					label="Sanction No."
					formControlName={groupData[0]?.sanction_no} // Default to SHG
					mode={1}
					// disabled={true}
					/> */}
					<TDInputTemplateBr
					placeholder="Sanction No."
					type="text"
					label="Sanction No."
					name="sanction_No"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formik.values.sanction_No}
					mode={1}
					/>
					{formik.errors.sanction_No && formik.touched.sanction_No ? (
					<VError title={formik.errors.sanction_No} />
					) : null}
					</div>

					<div>

					{/* <TDInputTemplateBr
					type="text"
					label="Period (In Month)"
					formControlName={groupData[0]?.period} // Default to SHG
					mode={1}
					// disabled={true}
					/> */}

					<TDInputTemplateBr
					placeholder="Period (In Month)"
					type="text"
					label="Period (In Month)"
					name="period_month"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formik.values.period_month}
					mode={1}
					/>
					{formik.errors.period_month && formik.touched.period_month ? (
					<VError title={formik.errors.period_month} />
					) : null}

					</div>

					<div>

					{/* <TDInputTemplateBr
					type="text"
					// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
					label="Current ROI"
					formControlName={groupData[0]?.curr_roi} // Default to SHG
					mode={1}
					disabled={true}
					/> */}

					<TDInputTemplateBr
					placeholder="Current ROI"
					type="text"
					label="Current ROI"
					name="current_roi"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formik.values.current_roi}
					mode={1}
					/>
					{formik.errors.current_roi && formik.touched.current_roi ? (
					<VError title={formik.errors.current_roi} />
					) : null}

					</div>


					<div>

					{/* <TDInputTemplateBr
					type="text"
					label="Ovd ROI"
					formControlName={groupData[0]?.penal_roi} // Default to SHG
					mode={1}
					disabled={true}
					/> */}

					<TDInputTemplateBr
					placeholder="Ovd ROI"
					type="text"
					label="Ovd ROI"
					name="ovd_roi"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formik.values.ovd_roi}
					mode={1}
					/>
					{formik.errors.ovd_roi && formik.touched.ovd_roi ? (
					<VError title={formik.errors.ovd_roi} />
					) : null}
					</div>

					<div>

					{/* <TDInputTemplateBr
					type="date"
					label="Disburse Date"
					formControlName={formatDateToYYYYMMDD_CurrentDT(groupData[0]?.disb_dt)} // Default to SHG
					mode={1}
					disabled={true}
					/> */}

					<TDInputTemplateBr
					placeholder="Disburse Date"
					type="date"
					label="Disburse Date"
					name="disburse_date"
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					formControlName={formatDateToYYYYMMDD_CurrentDT(formik.values.disburse_date)}
					mode={1}
					/>
					{formik.errors.disburse_date && formik.touched.disburse_date ? (
					<VError title={formik.errors.disburse_date} />
					) : null}

					</div>

					</div>




					{params?.id > 0 && (
					<div className="gap-3">
					<div className="w-full my-10 border-t-4 border-gray-400 border-dashed"></div>
					<div>
					<div className="text-[#DA4167] text-lg mb-2 font-bold">
					Members in this Group
					</div>

					{/* {JSON.stringify(groupData, 2)} */}

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

					{/* <th scope="col" className="px-6 py-3 font-semibold">
					Group Name
					</th> */}

					<th scope="col" className="px-6 py-3 font-semibold">
					Member Name
					</th>

					<th scope="col" className="px-6 py-3 font-semibold">
					Member Code
					</th>

					<th scope="col" className="px-6 py-3 font-semibold">
					Member A/C No.
					</th>
					<th scope="col" className="px-6 py-3 font-semibold">
					Member Amount
					</th>
					</tr>
					</thead>
					<tbody>
					{groupData?.map((item, i) => (
					<tr
					key={i}
					className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600"
					>
					{/* <th
					scope="row"
					className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
					>
					{item?.group_name}
					</th> */}
					<th
					scope="row"
					className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
					>
					{item?.member_name}
					</th>
					<td className="px-6 py-4">{item?.member_code}</td>
					<td className="px-6 py-4">{item?.member_account_no}</td>
					<td className="px-6 py-4">
					<TDInputTemplateBr
						placeholder="Member Disburse Amount"
						type="text"
						name={`members[${i}].disburse_amt`}
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={formik.values.members?.[i]?.disburse_amt}
						mode={1}
					/>
					{formik.errors.members?.[i]?.disburse_amt &&
					formik.touched.members?.[i]?.disburse_amt ? (
						<VError title={formik.errors.members[i].disburse_amt} />
					) : null}
					</td>
					</tr>
					))}
					
					</tbody>
					</table>
					</div>
					</Spin>
					</div>
					</div>
					)}
					</div>
					{loanAppData?.member_details.length < 1 &&(
					<BtnComp
					mode="A"
					onReset={formik.resetForm}
					param={params?.id}
					/>
					)}
					




					
					</form>
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

				 {/* <div className="flex justify-start gap-4 bg-white p-4">
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

					</div> */}


			</Spin>

			

		</>
	)
}

export default ViewLoanForm_BDCCB
