// FOR BDCCB 
import React, { useEffect, useRef, useState } from "react"
import "../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import BtnComp from "../../Components/BtnComp"
import VError from "../../Components/VError"
import TDInputTemplate from "../../Components/TDInputTemplate"
import { useNavigate } from "react-router-dom"
import { ErrorMessage, Field, FieldArray, Form, Formik, useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import { Message } from "../../Components/Message"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { url, url_bdccb } from "../../Address/BaseUrl"
import {
	Spin,
	Button,
	Popconfirm,
	Tag,
	Timeline,
	Divider,
	Typography,
	List,
	Select,
	Modal,
	Tooltip,
	message,
} from "antd"
import {
	LoadingOutlined,
	InfoCircleFilled,
	CheckCircleOutlined,
	EditOutlined,
	CheckCircleFilled,
	ClockCircleFilled,
	SyncOutlined,
	UsergroupAddOutlined,
	UserOutlined,
	FileExcelOutlined,
	SearchOutlined,
	CloseCircleOutlined,
} from "@ant-design/icons"
import FormHeader from "../../Components/FormHeader"
import { routePaths } from "../../Assets/Data/Routes"
import { useLocation } from "react-router"
import Sidebar from "../../Components/Sidebar"
import DialogBox from "../../Components/DialogBox"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import TimelineComp from "../../Components/TimelineComp"
import {
	PendingActionsOutlined,
	DeleteOutline,
	InfoOutlined,
} from "@mui/icons-material"
import { Checkbox } from "antd"
import { DataTable } from "primereact/datatable"
import Column from "antd/es/table/Column"
import { Toast } from "primereact/toast"
import AlertComp from "../../Components/AlertComp"
import { Map } from "lucide-react"
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
// import { format } from "date-fns"
import { saveMasterData } from "../../services/masterService"
import Radiobtn from "../../Components/Radiobtn"
// import { formatDateToYYYYMMDD } from "../../Utils/formateDate"

const s2ab = (s) => {
	const buf = new ArrayBuffer(s.length)
	const view = new Uint8Array(buf)
	for (let i = 0; i < s.length; i++) {
		view[i] = s.charCodeAt(i) & 0xff
	}
	return buf
}
const loan_to = [
	{
		code: "P",
		name: "PACS",
	},
	{
		code: "S",
		name: "SHG",
	}
]

const loan_to_For_Pacs = [
	{
		code: "S",
		name: "SHG",
	}
]

const period_data = [
	{
		code: "12",
		name: "12",
	},
	{
		code: "6",
		name: "6",
	},
	{
		code: "3",
		name: "3",
	},
]

const pay_mode = [
	{
		code: "Monthly",
		name: "Monthly",
	},
	{
		code: "Weekly",
		name: "Weekly",
	}
]

const options_status = [
	{
		label: "Deposit",
		value: "D",
	},
	{
		label: "Withdrawal",
		value: "W",
	},
]

const dataDropdown=[
  { name: "Direct", code: "D" },
  { name: "Member", code: "M" }
]

const dataDropdown_Member=[
  { name: "Member", code: "M" }
]


function DepositFormApprove_BDCCB({ flag }) {


	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const loanAppData = location.state || {}
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))
	// console.log(loanAppData, 'loanAppDataloanAppData');
	const [excelDt, setExcelDt] = useState([loanAppData]);

	const [visible, setVisible] = useState(() => false)
	const [pendingValues, setPendingValues] = useState(null);

	const [SBNoGroupName, setSBNoGroupName] = useState('')
	const [groupDetails, setGroupDetails] = useState([])
	const [groupList, setGroupList] = useState([]);
	const [depositWithdrawStatus, setDepositWithdrawStatus] = useState("D");
	const [actionType, setActionType] = useState("");
	const [societyLoanNo, setSocietyLoanNo] = useState('')
	const [societySrchMsg, setSocietySrchMsg] = useState('')
	
	
	const onChange = (e) => {
		console.log("radio1 checked", e)
		setDepositWithdrawStatus(e)
	}


	const initialValues = {
		// // loan_id: "",
		direct_member: "",
		total_group_amount: "",
		rows: [
			{
				sb_acc_no: "",
				member_id: "",
				member_name: "",
				member_balance: "",
				member_amount: "",
			},
		],
	}
	const [formValues, setValues] = useState(initialValues)
	const exportToExcel = (data) => {
		const wb = XLSX.utils.book_new()
		const ws = XLSX.utils.json_to_sheet(data)
		XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
		const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" })
		const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" })
		saveAs(blob, `details_2026.xlsx`)
	}

	const validationSchema = Yup.object({
		direct_member: Yup.string().required("Direct / Member is required"),
		// total_group_amount: Yup.string().required("Group Amount is required"),
		total_group_amount: Yup.string().when('direct_member', {
			is: (value) => value === 'D',
			then: (schema) => schema.required("Group Amount is required when Direct is selected"),
			otherwise: (schema) => schema.notRequired()
		}),
	})

	// const getValidationSchema = () => {
	// 	return Yup.object({
	// 		direct_member: Yup.string().required("Direct / Member is required"),
	// 		total_group_amount: Yup.string().when('direct_member', {
	// 			is: (value) => value === 'D',
	// 			then: (schema) => schema.test(
	// 				'required-if-not-withdrawal',
	// 				'Group Amount is required when Direct is selected',
	// 				function(value) {
	// 					// If depositWithdrawStatus is 'W' (Withdrawal), field is not required
	// 					if (depositWithdrawStatus === 'W') {
	// 						return true;
	// 					}
	// 					// Otherwise, field is required for Direct
	// 					return value ? true : false;
	// 				}
	// 			),
	// 			otherwise: (schema) => schema.notRequired()
	// 		}),
	// 	})
	// }

	// const validationSchema = getValidationSchema()



	const formatDateToYYYYMMDD_CurrentDT = (date) => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	};



	// wherever you open popup (e.g. on submit)
	// const handleOpenConfirm = (values) => {
	// 	setPendingValues(values);   // store formik values
	// 	setVisible(true);           // open dialog
	// };

	const onSubmit = async (values) => {

		// Log the updated member list with amounts (0 if empty)
		// const updatedMemberList = values.rows.map(row => ({
		// 	sb_acc_no: row.sb_acc_no,
		// 	member_name: row.member_name,
		// 	member_balance: row.member_balance,
		// 	member_amount: row.member_amount ? Number(row.member_amount) : 0
		// }))

		// console.log("Updated Member List:", updatedMemberList, depositWithdrawStatus)
		// console.log("Total Amount:", updatedMemberList.reduce((sum, member) => sum + member.member_amount, 0))
		
		// handleOpenConfirm(values)
	}



	const formik = useFormik({
		initialValues: initialValues,
		// initialValues: formValues,
		onSubmit,
		validationSchema,
		validateOnChange: true,
		validateOnBlur: true,
		enableReinitialize: true,
		validateOnMount: true,
	})



	const getClientIP = async () => {
		const res = await fetch("https://api.ipify.org?format=json")
		const data = await res.json()
		return data.ip
	}


	const handleSubmitSearchAccount = async (value) => {
		// console.log(societyLoanNo, 'ressssssssssssssssssssssssss');
		setLoading(true)
		const creds = {
			branch_code: userDetails[0]?.brn_code,
			pacs_id: userDetails[0]?.user_type == 'B' ? "111" : "0",
			gp_search: value,
			// gp_search: societyLoanNo,
			branch_type: userDetails[0]?.branch_type,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/savings/search_gp`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				console.log(societyLoanNo, 'ressssssssssssssssssssssssss', res?.data?.data);
				
				if(res?.data?.success){
					// Message("success", res?.data?.msg)

					setGroupList(res?.data?.data?.map((item, i) => ({
					code: item?.group_code,
					name: item?.group_name,
					sb_acc: item?.sb_ac_no,
					})))
				
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

	const fetchGroupDetails = async () => {
		// console.log('res?.data?.data', 'rrrrrrrrrrrrr');
		setGroupDetails([])
		setSocietySrchMsg('')
		// return;
		setLoading(true)
		const creds = {
			group_code: societyLoanNo,

			branch_code: userDetails[0]?.brn_code,
			pacs_id: userDetails[0]?.user_type == 'B' ? "111" : "0",
			sb_ac_no: societyLoanNo,
			// gp_search: societyLoanNo,
			branch_type: userDetails[0]?.branch_type,
		}

		// {
		// 	branch_code: userDetails[0]?.brn_code,
		// 	pacs_id: userDetails[0]?.user_type == 'B' ? "111" : "0",
		// 	gp_search: value,
		// 	// gp_search: societyLoanNo,
		// 	branch_type: userDetails[0]?.branch_type,
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/savings/fetch_gp_dtls`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				console.log(res?.data?.data, 'rrrrrrrrrrrrr');

				if(res?.data?.success){
					// Message("success", res?.data?.msg)
					setGroupDetails(res?.data?.data)

					if(res?.data?.data[0]?.memb_dt.length > 0){
						formik.setFieldValue("rows", res?.data?.data[0]?.memb_dt || [])
					}

					if(res?.data?.data.length < 1){
					setSocietySrchMsg(res?.data?.msg)
					}

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


	const fetchGroupDetails_Approve = async (group_code, trans_dt) => {

		setGroupDetails([])
		// return;
		setLoading(true)
		const creds = {
			group_code: group_code,
			trans_dt: trans_dt
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/savings/fetch_sb_transaction_dtls`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				
				if(res?.data?.success){
					// Message("success", res?.data?.msg)
					// console.log(res?.data?.data, 'fetchGroupDetails_fffApprove');
					
					setGroupDetails([res?.data?.data])
					
					// Auto-select Direct/Member based on dep_with_flag
					if(loanAppData?.flag === "D"){
						formik.setFieldValue("direct_member", "D")
					} else if(loanAppData?.flag === "W"){
						formik.setFieldValue("direct_member", "M")
					}
					

					console.log(res?.data?.data?.memb_dt, 'fetchGroupDetails_fffApprove_memb_dt', groupDetails[0]);
					
					// Set deposit/withdraw status
					setDepositWithdrawStatus(res?.data?.data?.dep_with_flag)
					
					formik.setFieldValue("total_group_amount", res?.data?.data?.cr_amt) // Set total group amount for reference, but it won't be editable as per current requirements

					const memberListData = res?.data?.data?.memb_dt?.map(row => ({
						member_id: row?.member_id,
						sb_acc_no: row?.sb_acc_no,
						member_name: row?.member_name,
						member_balance: row.member_balance,
						member_amount : loanAppData?.dep_with_flag == "D" ? row.cr_amt : row.dr_amt, // for withdrawal show the amount in credit column as well for reference, but it won't be editable
					}))

					if(res?.data?.data?.memb_dt.length > 0){
						formik.setFieldValue("rows", memberListData || [])
					}

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



	// const editGroup = async (formData) => {
	// 	if (formik.values.rows.reduce((sum, r) => sum + Number(r.member_amount || 0), 0) > Number(formik.values.disb_amt)) {
	// 		return Message("error", "Total Amount Greater Than Disbursement Amount")
	// 	}
	// 	// return;
	// 	const formattedRows = formData?.rows?.map(row => ({
	// 		mem_loan_id: row.mem_loan_id,
	// 		group_code: row.shg_id,
	// 		member_id: row.member_id,
	// 		member_amount: Number(row.member_amount || 0),
	// 		disburse_amt: Number(row.member_amount || 0),
	// 	}))

	// 	console.log("Formatted Rows for Edit:", formattedRows)

	// 	setLoading(true)

	// 	const ip = await getClientIP()

	// 	const creds = {
	// 		loan_id: loanAppData?.loan_id,
	// 		tran_id: 0,
	// 		tenant_id: userDetails[0]?.tenant_id,
	// 		branch_id: userDetails[0]?.brn_code,
	// 		loan_acc_no: formData?.loan_ac_no,
	// 		loan_to: 'S',
	// 		// branch_shg_id: PACS_SHGList[0]?.code,
	// 		period: formData?.period,
	// 		curr_roi: formData?.curr_roi,
	// 		penal_roi: formData?.over_roi,
	// 		sanction_no: formData?.sanction_no,
	// 		disb_dt: formData?.disb_dt,
	// 		sanction_dt: formData?.sanction_dt,
	// 		disb_amt: formData?.disb_amt,
	// 		tot_grp: formData?.group_total,
	// 		members: formattedRows,
	// 		created_by: userDetails[0]?.emp_id,
	// 		ip_address: ip,
	// 	}

	// 	console.log("Edit Group Credentials:", creds);

	// 	// return;

	// 	await saveMasterData({
	// 		endpoint: "loan/save_disbursement",
	// 		creds,
	// 		navigate,
	// 		successMsg: "Loan Disburse edited saved.",
	// 		onSuccess: () => navigate(-1),

	// 		// 🔥 fully dynamic failure handling
	// 		failureRedirect: routePaths.LANDING,
	// 		clearStorage: true,
	// 	})

	// 	setLoading(false)
	// }

	// const saveGroupData = async (formData) => {
		
	// 	const formattedRows = formData?.rows?.map(row => ({
	// 		// mem_loan_id: 0,

	// 		member_id: row?.member_id,
	// 		sb_acc_no: row?.sb_acc_no,
	// 		member_balance: row.member_balance,
	// 		amount : row.member_amount
	// 	}))

	// 	const total_cr_amt = formData?.rows?.reduce((sum, r) => sum + Number(r.member_amount || 0), 0)

	// 	// setLoading(true)

	// 	const ip = await getClientIP()

	// 	const creds = {
	// 		flag : formik.values.direct_member,
	// 		tenant_id : userDetails[0]?.tenant_id,
	// 		branch_id : userDetails[0]?.brn_code ,
	// 		shg_id : groupDetails[0]?.group_code,
	// 		grp_acc_no : groupDetails[0]?.sb_ac_no,
	// 		dep_with_flag : depositWithdrawStatus,
	// 		cr_amt : formik.values.direct_member == "M" ? total_cr_amt : formik.values.total_group_amount,
	// 		created_by : userDetails[0]?.emp_id,
	// 		created_ip : ip,
	// 		members: formik.values.direct_member === 'D' ? [] : formattedRows
	// 	}

	// 	// console.log(formData, 'formDataformDataformDataformData', creds);
		
	// 	// return;

	// 	await saveMasterData({
	// 		endpoint: "savings/save_sb_transaction",
	// 		creds,
	// 		navigate,
	// 		successMsg: "Deposit/Withdrawal saved.",
	// 		onSuccess: () => navigate(-1),
	// 		// onSuccess: () => navigate('/homepacs/recovery-shg-list'),
	// 		// 🔥 fully dynamic failure handling
	// 		failureRedirect: routePaths.LANDING,
	// 		clearStorage: true,
	// 	})

	// 	setLoading(false)
	// }

	const approveTransaction = async (formData) => {
		
		// const formattedRows = groupDetails[0]?.memb_dt?.map(row => ({
		// 	member_id: row?.member_id,
		// 	sb_acc_no: row?.sb_acc_no,
		// 	member_balance: row.member_balance,
		// 	// amount : row.member_amount
		// }))

		const formattedRows = formik.values.rows?.map(row => ({
			member_id: row?.member_id,
			sb_acc_no: row?.sb_acc_no,
			member_balance: row.member_balance,
			amount : row.member_amount
		}))

		const total_cr_amt = formik.values?.rows?.reduce((sum, r) => sum + Number(r.member_amount || 0), 0)

		// setLoading(true)

		const ip = await getClientIP()

		const creds = {
			flag : loanAppData?.flag,
			tenant_id : userDetails[0]?.tenant_id,
			branch_id : userDetails[0]?.brn_code ,
			shg_id : groupDetails[0]?.shg_id,
			grp_acc_no : groupDetails[0]?.grp_acc_no,
			dep_with_flag : depositWithdrawStatus,
			cr_amt : loanAppData?.flag == "M" ? total_cr_amt : formik.values?.total_group_amount,
			trans_dt : loanAppData?.trans_dt,
			members: loanAppData?.flag === 'D' ? [] : formattedRows,
			approved_by : userDetails[0]?.emp_id,
			approved_ip : ip,
		}

// {
//   "flag" : "",
//   "tenant_id" : "",
//   "branch_id" : "",
//   "shg_id" : "",
//   "grp_acc_no" : "",
//   "dep_with_flag" : "",
//   "cr_amt" : "",
//   "trans_dt" : "",
//   "members" : [
//     {
//       "member_id": "",
//       "sb_acc_no": "",
//       "member_balance": "",
//       "amount" : ""
//     },
//     {
//         "member_id": "",
//         "sb_acc_no": "",
//         "member_balance": "",
//       	"amount" : ""
//       }
//     ],
//   "approved_by" : "",
//   "approved_ip" : ""
// }


		// console.log(depositWithdrawStatus, total_cr_amt,  'formDataformDataformDataformData', creds);

		// return;

		await saveMasterData({
			endpoint: "savings/approve_sb_transaction",
			creds,
			navigate,
			successMsg: "Deposit/Withdrawal saved.",
			onSuccess: () => navigate(-1),
			// onSuccess: () => navigate('/homepacs/recovery-shg-list'),
			// 🔥 fully dynamic failure handling
			failureRedirect: routePaths.LANDING,
			clearStorage: true,
		})

		setLoading(false)
	}

	const rejectDisbursement = async (formData) => {

		const formattedRows = formik.values.rows?.map(row => ({
			member_id: row?.member_id,
			sb_acc_no: row?.sb_acc_no,
			// member_balance: row.member_balance,
			// amount : row.member_amount
		}))

		// {
//       "member_id": ,
//       "sb_acc_no": ""
//     }

		const total_cr_amt = formik.values?.rows?.reduce((sum, r) => sum + Number(r.member_amount || 0), 0)

		const ip = await getClientIP()

		const creds = {
			flag : loanAppData?.flag,
			tenant_id : userDetails[0]?.tenant_id,
			branch_id : userDetails[0]?.brn_code ,
			shg_id : groupDetails[0]?.shg_id,
			grp_acc_no : groupDetails[0]?.grp_acc_no,
			dep_with_flag : depositWithdrawStatus,
			// cr_amt : loanAppData?.flag == "M" ? total_cr_amt : formik.values?.total_group_amount,
			trans_dt : loanAppData?.trans_dt,
			members: loanAppData?.flag === 'D' ? [] : formattedRows,
			modified_by : userDetails[0]?.emp_id,
			modified_ip : ip,
		}
		

		await saveMasterData({
			endpoint: "savings/reject_sb_transaction",
			creds,
			navigate,
			successMsg: "Deposit/Withdrawal saved.",
			onSuccess: () => navigate(-1),
			// onSuccess: () => navigate('/homepacs/recovery-shg-list'),
			// 🔥 fully dynamic failure handling
			failureRedirect: routePaths.LANDING,
			clearStorage: true,
		})

		setLoading(false)
	}

	const acceptReject = (actionType)=>{

		if(actionType == 'A'){
			approveTransaction(groupDetails[0])
		}

		if(actionType == 'R'){
			rejectDisbursement()
		}
	}


	useEffect(() => {
		// formik.setFieldValue("total_group_amount", "")

		if(groupDetails[0]?.memb_dt.length > 0){
		formik.setFieldValue("rows", groupDetails[0]?.memb_dt || [])
		}
					
	}, [formik.values.direct_member, depositWithdrawStatus])


	useEffect(() => {
		if(params?.id > 0){
			fetchGroupDetails_Approve(params?.id, loanAppData?.trans_dt )
		}
	}, [])


	return (
		<>
			<section className=" dark:bg-[#001529] flex justify-center align-middle p-5">
				<div className="p-5 w-4/5 min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader text={`${params?.id == 0 ? "Deposit / Withdrawal" : loanAppData?.approval_status == 'A' ? "View Deposit" : "Edit/Preview Deposit"}`} mode={2} />
					</div>

					<Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					>
						{/* {JSON.stringify(formik.values, null, 2)} hhhhhhhhhhhhhhhhhhhhhhhh
						{JSON.stringify(groupDetails[0]?.cr_amt, null, 2)} */}
					{/* {JSON.stringify(loanAppData?.dep_with_flag, null, 2)} ///////////////////
					{JSON.stringify(groupDetails[0], null, 2)} */}

					{/* {JSON.stringify(groupDetails[0], null, 2)} */}

						<div className="card shadow-lg bg-white border-2 p-5 mx-16 rounded-3xl surface-border border-round surface-ground flex-auto font-medium">

							{params?.id < 1 ? (
								<div className="grid grid-cols-4 gap-5 mb-5">

								{/* <div>
									
									<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800
																		 dark:text-gray-100">Select Group</label>
									

									<Select
									showSearch
									placeholder="Select To"
									style={{ width: "100%" }}
									name="soci_loan_no"
									value={formik.values.soci_loan_no}
									onSearch={(value) => {
									handleSubmitSearchAccount(value);   // your search function
									}}
									onChange={(value) => {
										formik.setFieldValue("soci_loan_no", value);
									}}
									filterOption={(input, option) =>
										option?.children?.toLowerCase().includes(input.toLowerCase())
									}
									>
									<Select.Option value="" disabled>
										Select To
									</Select.Option>

									{groupList?.map((data) => (
									<Select.Option key={data.code} value={data.code}>
									{data.name + ' ('+data.sb_acc+')'}
									</Select.Option>
									))}

									</Select>

								</div> */}

								<div className="sm:col-span-1">
								<TDInputTemplateBr
								placeholder="Group SB Account No."
								type="text"
								label="Group SB Account No."
								name="soci_loan_no"
								formControlName={societyLoanNo}
								handleChange={(e) => setSocietyLoanNo(e.target.value)}
								mode={1}
								/>

								</div>
								{/* )} */}


								<div className="mt-7 sm:col-span-1">
								<button
								className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
								onClick={() => {
								// handleSubmitSearchAccount();
								fetchGroupDetails();
								}}
								>
								<SearchOutlined /> <span className={`ml-2`}>Search</span>
								</button>
								</div>

								{societySrchMsg.length > 0 && (
								<div className="sm:col-span-4 mt-0">

								<p className="text-red-600 bg-red-100 border border-red-400 px-4 py-2 rounded-md text-sm">
								{societySrchMsg}
								</p>

								</div>
								)}

							</div>
							) : (
								<div className="grid grid-cols-4 gap-5 mb-5">
								<div>
											<TDInputTemplateBr
												placeholder="Group SB Account No."
												type="text"
												label="Group SB Account No."
												name="soci_loan_no"
												formControlName={loanAppData?.acc_no}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={true}
											/>
										</div>
										</div>
							)}
							
							{groupDetails.length > 0 && (
							<div className="flex justify-start gap-5">
									<div className={"grid gap-4 sm:grid-cols-2 sm:gap-6 w-full mb-4"}>



										<div>
											<TDInputTemplateBr
												placeholder="Group Name"
												type="text"
												label="Group Name"
												name="grp_name"
												formControlName={groupDetails[0]?.group_name}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={true}
											/>
										</div>


										<div>
											<TDInputTemplateBr
												placeholder="Group Balance"
												type="text"
												label="Group Balance"
												name="group_balance"
												formControlName={groupDetails[0]?.grp_balance}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={true}
											/>
										</div>

									</div>
								</div>

							)}


							<form onSubmit={formik.handleSubmit}>

								{groupDetails && groupDetails[0]?.memb_dt?.length > 0 && (
								<div className="border-2 border-pink-500/50 bg-pink-100 rounded-lg pl-5 pr-5 pb-0 pt-5 mt-0">

									<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-4"}>

										<div>
										{params?.id > 0 ? (
										
											<TDInputTemplateBr
												placeholder="Transaction Type"
												type="text"
												label="Transaction Type"
												name="transacType"
												formControlName={groupDetails[0]?.dep_with_flag === "D" ? "Deposit" : groupDetails[0]?.dep_with_flag === "W" ? "Withdrawal" : ""}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={true}
											/>
										
										) : (
											<Radiobtn
										data={options_status}
										val={depositWithdrawStatus}
										onChangeVal={(value) => {
										onChange(value)
										}}
										/>
										)}
										
										</div>

										<div>
											{/* {JSON.stringify(formik.values.direct_member, null, 2)} */}
											{params?.id > 0 ? (

											<TDInputTemplateBr
											placeholder="Direct / Member"
											type="text"
											label="Direct / Member"
											name="direct_member_custom"
											formControlName={loanAppData?.flag === "M" ? "Member" : loanAppData?.flag === "D" ? "Direct" : ""}
											handleChange={formik.handleChange}
											handleBlur={formik.handleBlur}
											mode={1}
											disabled={true}
											/>

											) : (
											<>
											<TDInputTemplateBr
												placeholder="Select Direct / Member"
												type="text"
												label="Direct / Member"
												name="direct_member"
												formControlName={formik.values.direct_member}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={2}

												data={depositWithdrawStatus == "D" ? dataDropdown?.map((item) => ({
													code: item?.code,
													name: item?.name,
												})) : dataDropdown_Member?.map((item) => ({
													code: item?.code,
													name: item?.name,
												}))}
											/>
											{formik.errors.direct_member && formik.touched.direct_member ? (
											<VError title={formik.errors.direct_member} />
											) : null}
											</>
											)}
											
										</div>
										
										{formik.values.direct_member === 'D' && depositWithdrawStatus == "D" && (
											<div className="transition-all duration-500 ease-in-out opacity-100 scale-100 transform">
											{params?.id > 0 ? (
												<> 
											{/* <TDInputTemplateBr
											placeholder="Group Amount"
											type="text"
											label="Group Amount"
											name="total_group_amount_custom"
											formControlName={groupDetails[0]?.cr_amt}
											handleChange={formik.handleChange}
											handleBlur={formik.handleBlur}
											mode={1}
											disabled={true}
											/> */}
											{/* {JSON.stringify(groupDetails[0]?.cr_amt, null, 2)} */}
											
											<TDInputTemplateBr
												placeholder="Group Amount"
												type="text"
												label="Group Amount"
												name="total_group_amount"
												formControlName={formik.values.total_group_amount}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												
											/>
											</>

											) : (
											<>
											<TDInputTemplateBr
												placeholder="Group Amount"
												type="text"
												label="Group Amount"
												name="total_group_amount"
												formControlName={formik.values.total_group_amount}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												
											/>
											{formik.errors.total_group_amount && formik.touched.total_group_amount ? (
											<VError title={formik.errors.total_group_amount} />
											) : null}
											</>
											)}
											
										</div>
										)}
										

									</div>
								</div>
								)}





								{groupDetails.length > 0 && (
								<div className="sm:col-span-3 mt-6">
									{/* {formik.values.rows.length > 0 && ( */}
										{/* <Tag color="#2563eb" className="text-white mb-3 font-bold"> */}
										<Tag className={`text-white mb-3 rounded-md text-sm font-bold pl-3 pr-3 pt-2 pb-2 ${formik.values.direct_member === 'D' ? 'bg-[#DA4167]' : 'bg-[#2563eb]'}`}>	
											{groupDetails && groupDetails[0]?.memb_dt?.length > 0 ? (
												<>
												Member Details {formik.values.direct_member === 'D' ? "(You can't Add Member Amount)" : ""} 
												</>
											) : (
												<>
												Member Is Not Available 
												</>
											)}
											
										</Tag>
									{/* )} */}

								
										
									{groupDetails && groupDetails[0]?.memb_dt?.length > 0 && (
										<>
										{formik.values.rows.map((row, index) => {

										return (
											<div
												key={index}
												className={`grid grid-cols-12 gap-3 mb-3 p-3 border rounded-md relative transition-all duration-500 ease-in-out ${formik.values.direct_member === 'D' ? 'bg-gray-300 opacity-60' : 'bg-slate-50'}`}
											>
 
												{/* Account Number */}
												<div className="col-span-2">


													<TDInputTemplateBr
														placeholder="SB Account No."
														type="text"
														label="SB Acc No."
														name={`rows[${index}].sb_acc_no`}
														formControlName={formik.values.rows[index].sb_acc_no}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														disabled={true}
													/>


												</div>

												{/* SHG / PACS */}
												<div className="col-span-3">
													<TDInputTemplateBr
														placeholder="Member Name"
														type="text"
														label="Member Name"
														name={`rows[${index}].member_name`}
														formControlName={formik.values.rows[index].member_name}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														disabled={true}
													/>
												</div>

												{/* Member Balance */}
												<div className="col-span-4">
													<TDInputTemplateBr
														placeholder="Member Balance"
														type="text"
														label="Member Balance"
														name={`rows[${index}].member_balance`}
														formControlName={formik.values.rows[index].member_balance}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														disabled={true}
													/>
												</div>

												{/* Amount */}
												<div className="col-span-3">
													{/* <TDInputTemplateBr
														placeholder="Enter Amount (0 if empty)"
														type="number"
														label="Member Amount"
														name={`rows[${index}].member_amount`}
														formControlName={formik.values.rows[index].member_amount || "0"}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														disabled={formik.values.direct_member === 'D' ? true : false}
														mode={1}
													/> */}

													<TDInputTemplateBr
													placeholder="Enter Amount (0 if empty)"
													type="number"
													label="Member Amount"
													name={`rows[${index}].member_amount`}
													formControlName={formik.values.rows[index].member_amount || 0}
													handleBlur={formik.handleBlur}
													disabled={formik.values.direct_member === 'D' ? true : false}
													mode={1}
													handleChange={(e) => {
													let value = Number(e.target.value || 0);

													const balance = Number(formik.values.rows[index].member_balance || 0);

													// Withdrawal validation
													if (
													depositWithdrawStatus === "W" ||
													groupDetails[0]?.dep_with_flag === "W"
													) {
													if (value > balance) {
													value = balance;

													message.error(
													`Amount cannot be greater than Member Balance (${balance})`
													);
													}
													}

													formik.setFieldValue(
													`rows[${index}].member_amount`,
													value
													);
													}}
													/>
												</div>

											</div>
										);
									})}

									{/* Total */}
									<div className="text-right mt-3">
										<Tag color="blue" style={{ fontSize: 14 }}>
											Total Amount : ₹{" "}
											{formik.values.rows.reduce(
												(sum, r) => sum + Number(r.member_amount || 0),
												0
											)}
										</Tag>
									</div>
										
										</>
									 )}
									
								</div>
								)}



								{/* {loanAppData?.approval_status != 'A' && ( */}
								{/* {loanAppData?.approval_status == 'U' && (
									<BtnComp mode="A" onReset={formik.resetForm} param={params?.id}/>
								)} */}
								{groupDetails && groupDetails[0]?.memb_dt?.length > 0 && (
									<>
									{params?.id < 1 && (
									<BtnComp mode="A" onReset={formik.resetForm} param={params?.id} />
									)}
									</>
								)}

								{loanAppData?.approval_flag == 'U' &&(	
								<div className="flex justify-center  sm:gap-6 mt-8">
								<button
								className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
								onClick={async () => {
								setActionType("A");
								setVisible(true);
								}}

								>
								<CheckCircleOutlined /> <span className={`ml-2`}>Accept Transaction</span>
								</button>

								<button
								className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-[#DA4167] border-[#DA4167] bg-[#DA4167] transition ease-in-out hover:bg-[#DA4167] duration-300 rounded-full  dark:focus:ring-primary-900`}
								onClick={async () => {
								setActionType("R")
								setVisible(true)

								}}
								>
								<CloseCircleOutlined /> <span className={`ml-2`}>Reject Transaction</span>
								</button>


								</div>
								)}

								
								

								{/* } */}
							</form>

							
							{/* <div className="flex justify-end gap-4">
											<Tooltip title="Export to Excel">
												<button
													onClick={() => exportToExcel(excelDt)}
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
						</div>

					</Spin>
				</div>
				{/* {reportData.length !== 0 && ( */}

				{/* )} */}
			</section>

			<DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {

					
						if (params?.id > 0) {
							// editGroup(pendingValues);
							acceptReject(actionType)
						} else {
							// if (pendingValues) {
							// saveGroupData(pendingValues)
							// }
						}


						// 🔥 pass values here
					
					setVisible(false);
				}}
				onPressNo={() => setVisible(!visible)}
			/>








		</>
	)
}

export default DepositFormApprove_BDCCB
