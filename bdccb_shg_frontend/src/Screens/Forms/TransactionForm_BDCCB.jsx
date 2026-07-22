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
} from "antd"
import {
	LoadingOutlined,
	InfoCircleFilled,
	CheckCircleOutlined,
	EditOutlined,
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
// import { formatDateToYYYYMMDD } from "../../Utils/formateDate"


const trans_type = [
		{
		code: "D",
		name: "Deposit",
		},
		{
		code: "W",
		name: "Withdrawal",
		}
]


const trans_type_ = [
		{
		code: "D",
		name: "Deposit__",
		},
		{
		code: "W",
		name: "Withdrawal__",
		}
]




function TransactionForm_BDCCB({ flag }) {


	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const  loanAppData  = location.state || {}
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))

	const [districts, setDistricts] = useState(
			userDetails[0]?.district_list?.map((item, i) => ({
			code: item?.dist_code,
			name: item?.dist_name,
			}))
		)

	
	const [blocks, setBlocks] = useState(() => [])
	const [gpList, setGPList] = useState(() => [])
	const [policeStation, setPoliceStation] = useState(() => [])
	const [postOffice, setPostOffice] = useState(() => [])
	const [gpName, setGpName] = useState(() => [])
	const [villName, setVillName] = useState(() => [])
	const [branch, setBranch] = useState(() => [])

	const [groupData, setGroupData] = useState(() => [])
	const [sahayikaList, setSahayikaList] = useState(() => [])

	const [visible, setVisible] = useState(() => false)
	const [pendingValues, setPendingValues] = useState(null);
	const [PACS_SHGList, setPACS_SHGList] = useState([]);
	const [remainDisburseAmt, setRemainDisburseAmt] = useState(null);
	const [SBAccountList, setSBAccountList] = useState([]);

	const initialValues = {
		// branch_name: "",
		acc_open_date: "",
		// loan_to: "",
		// acc_no: "", /// Not
		group_name: "",
		// depo_amt: "",
		transaction_type: "",
		sb_accounts: []   // 👈 add this
	}
	const [formValues, setValues] = useState(initialValues)

	
	// const validationSchema = Yup.object({
	// acc_open_date: Yup.string().required("Account Open Date is required"),
	// group_name: Yup.mixed().required("Group is required"),
	// transaction_type: Yup.mixed().required("Transaction Type is required"),
	// })

	const validationSchema = Yup.object({
	acc_open_date: Yup.string().required("Account Open Date is required"),
	group_name: Yup.mixed().required("Group is required"),
	transaction_type: Yup.mixed().required("Transaction Type is required"),

	sb_accounts: Yup.array().of(
		Yup.object().shape({
		amount: Yup.number()
			.typeError("Amount must be a number")
			.required("Amount is required")
			.positive("Amount must be greater than 0")
			.when("$transaction_type", (transaction_type, schema) => {
			if (transaction_type === "W") {
				return schema.test(
				"balance-check",
				"Amount cannot exceed balance",
				function (value) {
					const { balance } = this.parent
					if (!value) return true
					return value <= balance
				}
				)
			}
			return schema
			})
		})
	)
	})



	const formatDateToYYYYMMDD_CurrentDT = (date) => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
	};

	

	// wherever you open popup (e.g. on submit)
	const handleOpenConfirm = (values) => {
	setPendingValues(values);   // store formik values
	setVisible(true);           // open dialog
	};
	
	const onSubmit = async (values) => {
		handleOpenConfirm(values)
	}

	

	const formik = useFormik({
		initialValues: + params.id > 0 ? formValues : initialValues,
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




	useEffect(() => {
		if(params.id > 0){
		// handleSearchChange(loanAppData?.loan_to_name)
		// fetchDisburseDetails()
		}
	}, [])

	const fetchDisburseDetails = async () => {
		setValues({
		// loan_ac_no: loanAppData?.loan_acc_no,
		// loan_to: loanAppData?.loan_to,
		group_name: loanAppData?.loan_to_name,
		// group_name: loanAppData?.group_name, 
		branch_shg_SearchField: '',
		period: loanAppData?.period,
		curr_roi: loanAppData?.curr_roi,
		over_roi: loanAppData?.over_roi,
		disb_dt: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.disb_dt)),
		disb_amt: loanAppData?.disb_amt,

		})
	}



	const editGroup = async (formData) => {
			console.log(formData, 'editGroup');
			
				return;
				setLoading(true)
			
				const ip = await getClientIP()
			
				const creds = {
				loan_id : loanAppData?.loan_id,
    			tran_id : loanAppData?.trans_id,
				tenant_id: userDetails[0]?.tenant_id,
				branch_id: userDetails[0]?.brn_code,
				// loan_acc_no: formData?.loan_ac_no,
				loan_to: formData?.loan_to,
				created_by: userDetails[0]?.emp_id,
				ip_address: ip,
				}

				
				console.log(formData, 'formDataformDataformDataformData', creds, '>>>', userDetails[0]);

				// return;

				await saveMasterData({
				endpoint: "loan/save_disbursement",
				creds,
				navigate,
				successMsg: "Loan Disburse edited saved.",
				onSuccess: () => navigate(-1),
			
				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
				})
			
				setLoading(false)
				}

	const saveGroupData = async (formData) => {
			
			setLoading(true)
			
			const ip = await getClientIP()

			const formattedRows = formData?.sb_accounts?.map(row => ({
			trans_no: 0,
			sb_id: row.sb_id,
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			acc_no: row.acc_no,
			dep_with_flag: formData?.transaction_type,
			amt: row?.amount,
			remarks: '',
			trans_date: formData?.acc_open_date,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
			}))

			console.log(formData, 'saveGroupData', formattedRows);



			// return;
				
			
				const creds = {
				rows: formattedRows
				}

				
				console.log(formData, 'formDataformDataformDataformData', creds);

				await saveMasterData({
				endpoint: "depsav/save_dept_trans",
				creds,
				navigate,
				successMsg: "Loan Disburse details saved.",
				onSuccess: () => navigate(-1),
			
				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
				})
			
				setLoading(false)
				}


	const handleSearchChange = async (value) => {
		if(value.length < 3){
			// Message("error", "Minimum type 3 character")
			return;
		}


		setPACS_SHGList([])
		setLoading(true)
		const creds = {
		// loan_to : formik.values.loan_to,
		loan_to : userDetails[0]?.user_type == 'B' ? 'S' : '',
		branch_code : userDetails[0]?.brn_code,
		branch_shg_id : value,
		tenant_id: userDetails[0]?.user_type == 'B' ? userDetails[0]?.tenant_id : 0,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
		.then((res) => {

		if(res?.data?.success){
			// console.log(res?.data?.data, 'mmmmmmmmmmmmmmmmmmm'); 
			
		// console.log(res?.data?.data, 'ddddddddddddddddddddddd');
	
		// if(userDetails[0]?.user_type == 'B'){
		setPACS_SHGList(res?.data?.data?.map((item, i) => ({
		code: item?.group_code,
		name: item?.group_name,
		})))
		// }

		// if(res?.data?.data.length > 0){
		// 	Message("success", res?.data?.msg)
		// } else {
		// 	Message("error", res?.data?.msg)
		// }
		

		} else {
		navigate(routePaths.LANDING)
		localStorage.clear()
		}
		})
		.catch((err) => {
		Message("error", "Some error occurred while fetching group form")
		})

		setLoading(false)
	};


	const fetchSBAccList = async (value) => {
		console.log(value, 'ddddddddddddddddddddddd');

		setLoading(true)

		const creds = {
		shg_id : value,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/depsav/get_meb_acc_dtls`, creds, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
		.then((res) => {

		if(res?.data?.success){
		console.log(res?.data?.data, 'ddddddddddddddddddddddd');

		const formattedList = res?.data?.data?.map(item => ({
			sb_id: item.sb_id,
			acc_no: item.acc_no,
			member_name: item.member_name,
			balance: parseFloat(item.balance),
			amount: ""   // 👈 user will enter this
		}))

		setSBAccountList(formattedList)

		formik.setFieldValue("sb_accounts", formattedList) // 👈 important

		// setSBAccountList(res?.data?.data)
	
		// if(userDetails[0]?.user_type == 'B'){
		// setPACS_SHGList(res?.data?.data?.map((item, i) => ({
		// code: item?.group_code,
		// name: item?.group_name,
		// })))
		// }

		} else {
		navigate(routePaths.LANDING)
		localStorage.clear()
		}
		})
		.catch((err) => {
		Message("error", "Some error occurred while fetching group form")
		})

		setLoading(false)
	};

useEffect(() => {
  if (!formik.values.sb_accounts?.length) return;

  const resetAccounts = formik.values.sb_accounts.map((item) => ({
    ...item,
    amount: ""   // reset amount
  }));

  formik.setFieldValue("sb_accounts", resetAccounts);

}, [formik.values.transaction_type]);



	return (
		<>
		<section className=" dark:bg-[#001529] flex justify-center align-middle p-5">
			<div className="p-5 w-4/5 min-h-screen rounded-3xl">
			<div className="w-auto mx-14 my-4">
			<FormHeader text={`${params?.id == 0 ? "Deposit / Withdrawal  Transaction" : loanAppData?.approval_status == 'A' ? "View Deposit / Withdrawal  Transaction" : "Edit/Preview Deposit / Withdrawal  Transaction"}`} mode={2} />
			</div>

			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>	
				{/* {JSON.stringify(SBAccountList, 2)}  */}
				<div className="card shadow-lg bg-white border-2 p-5 mx-16 rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
				<form onSubmit={formik.handleSubmit}>
					<div className="flex justify-start gap-5">
						<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-4"}>

					{/* {JSON.stringify(userDetails[0], null, 2)} */}

							

							<div>
							<TDInputTemplateBr
							// placeholder="Select Disbursement Date..."
							type="date"
							label="Transaction Date"
							name="acc_open_date"
							formControlName={formik.values.acc_open_date}
							handleChange={formik.handleChange} 
							handleBlur={formik.handleBlur}
							max={formatDateToYYYYMMDD_CurrentDT(new Date())}
							mode={1}
							// disabled={loanAppData?.approval_status == 'A' ? true : false}
							/>
							{formik.errors.acc_open_date && formik.touched.acc_open_date ? (
							<VError title={formik.errors.acc_open_date} />
							) : null}
						</div>

							<div>
								<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800
				 dark:text-gray-100"> 
				 Select Group
				 {/* Select PACS/SHG * */}
				 </label>
								<Select
									showSearch
									placeholder={userDetails[0]?.user_type == 'B' ? 'Choose Group ' : userDetails[0]?.user_type == 'P' === 'S' ? 'Choose Group ' : 'Choose '}
									value={formik.values.group_name}
									style={{ width: "100%" }}
									optionFilterProp="children"
									name="group_name"
									// 🔍 typing search
									onSearch={(value) => {
									handleSearchChange(value);   // your search function
									// userDetails[0]?.user_type == 'B' ? 'P' : userDetails[0]?.user_type == 'P' ? 'S' : '',
									}}
									onChange={(value) => {

										formik.setFieldValue("group_name", value)
										fetchSBAccList(value)
									}}
									onBlur={formik.handleBlur}
									filterOption={(input, option) =>
									option?.children?.toLowerCase().includes(input.toLowerCase())
									}
									
									>
									<Select.Option value="" disabled>{userDetails[0]?.user_type == 'B' ? 'Choose Group ' : userDetails[0]?.user_type == 'P' ? 'Choose Group ' : 'Choose '}</Select.Option>

									{PACS_SHGList?.map((data) => (
									<Select.Option key={data.code} value={data.code}>
									{data.name}
									</Select.Option>
									))}
									</Select>

								
									{formik.errors.group_name && formik.touched.group_name ? (
										<VError title={formik.errors.group_name} />
									) : null}

							</div>

							<div>
								<TDInputTemplateBr
								placeholder="Transaction Type"
								type="text"
								label="Transaction Type *"
								name="transaction_type"
								handleChange={formik.handleChange}
								// handleChange={handleFormikMasterChange} 
								handleBlur={formik.handleBlur}
								formControlName={formik.values.transaction_type}
								data={trans_type}
								mode={2}
								// disabled={params.id > 0 ? true : false}
							/>
							{formik.errors.transaction_type && formik.touched.transaction_type ? (
								<VError title={formik.errors.transaction_type} />
							) : null}
							</div>

							</div>
							</div>

		<div className="sm:col-span-3 mt-6">
		
		
	

		{formik.values.sb_accounts?.length > 0 && (
		<div className="mt-6">
		<Tag color="#2563eb" className="text-white mb-3 font-bold">
		SB Account Holder
		</Tag>

		{formik.values.sb_accounts.map((item, index) => (
		<div key={item.sb_id} className="grid grid-cols-12 gap-3 mb-3 p-3 border rounded-md bg-slate-50 relative">

		{/* 1️⃣ Account No + Member Name */}
		<div className="col-span-3">
			<TDInputTemplateBr
				placeholder="Account Number"
				label="Account Number"
				type="text"
				formControlName={item.acc_no}
				disabled
				mode={1}
			/>
		</div>

		<div className="col-span-4">
			<TDInputTemplateBr
				placeholder="Member Name"
				label="Member Name"
				type="text"
				formControlName={item.member_name}
				disabled
				mode={1}
			/>
		</div>
		{/* <div className="font-medium">
		{item.acc_no} - {item.member_name}
		</div> */}

		{/* 2️⃣ Amount Input */}
		<div className="col-span-3">
			<TDInputTemplateBr
			placeholder="Enter Amount"
			label="Amount"
			type="number"
			name={`sb_accounts[${index}].amount`}
			formControlName={item.amount}
			handleChange={(e) => {
			const value = e.target.value;

			// Optional validation
			if(formik.values.transaction_type == 'W'){
			if (parseFloat(value) > item.balance) {
			  Message("error", "Amount cannot exceed balance");
			  return;
			}
			}

			formik.setFieldValue(
			`sb_accounts[${index}].amount`,
			value
			);
			}}
			mode={1}
			/>

		</div>

		{/* 3️⃣ Balance */}
		<div className="col-span-2">
			<TDInputTemplateBr
			placeholder="Balance"
			label="Balance"
			type="text"
			formControlName={item.balance}
			disabled
			mode={1}
			/>
		{/* Balance: ₹ {item.balance} */}
		</div>

		</div>
		))}
		</div>
		)}

		</div>


							
							
						



					{/* {userDetails?.id != 3 &&  */}
					{loanAppData?.approval_status != 'A' &&(
						<BtnComp mode="A" onReset={formik.resetForm} param={params?.id} />
					)}
					
					{/* } */}
				</form>
				</div>
			</Spin>
			</div>
			</section>

			<DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				 onPressYes={() => {
		if (pendingValues) {
		if(params?.id > 0) {
			editGroup(pendingValues);
		} else {
			saveGroupData(pendingValues) 
		}
	  
	 	// 🔥 pass values here
		}
		setVisible(false);
		}}
				onPressNo={() => setVisible(!visible)}
		/>

		</>
	)
}

export default TransactionForm_BDCCB
