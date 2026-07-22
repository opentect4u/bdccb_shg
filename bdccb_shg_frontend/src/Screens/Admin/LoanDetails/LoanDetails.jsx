import React, { useEffect, useMemo, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin, Button, Modal, Tooltip, DatePicker, Popconfirm, Tag } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	PrinterOutlined,
	FileExcelOutlined,
	CheckCircleOutlined,
	WalletOutlined,
	SaveOutlined,
} from "@ant-design/icons"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { printTableRegular } from "../../../Utils/printTableRegular"
import { exportToExcel } from "../../../Utils/exportToExcel"
import {
	absenteesReportHeader,
	attendanceReportHeader,
} from "../../../Utils/Reports/headerMap"
import DynamicTailwindAccordion from "../../../Components/Reports/DynamicTailwindAccordion"
import DynamicTailwindTable from "../../../Components/Reports/DynamicTailwindTable"
import Radiobtn from "../../../Components/Radiobtn"
import { printTableReport } from "../../../Utils/printTableReport"
import { useNavigate } from "react-router"
import { routePaths } from "../../../Assets/Data/Routes"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { useFormik } from "formik"
import * as Yup from "yup"
import VError from "../../../Components/VError"
import BtnComp from "../../../Components/BtnComp"
import { saveMasterData } from "../../../services/masterService"

// const { RangePicker } = DatePicker
// const dateFormat = "YYYY/MM/DD"

const options = [
	{
		label: "All",
		value: "",
	},
	{
		label: "Late In",
		value: "L",
	},
	{
		label: "Early Out",
		value: "E",
	},
	// {
	// 	label: "Absent",
	// 	value: "A",
	// },
]

function LoanDetails() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [societyLoanNo, setSocietyLoanNo] = useState('')
	const [loanDetails, setLoanDetails] = useState([])
	const [recoveryBtnShowOff, setRecoveryBtnShowOff] = useState(false)
	const [allRecoverySubBtnShowOff, setAllRecoverySubBtnShowOff] = useState(false)
	const [memberAmount, setMemberAmount] = useState(false)
	const [societySrchMsg, setSocietySrchMsg] = useState('')

	const navigate = useNavigate()


	const initialValues = {
		principal_amount: "",
		interest_amount: "",
		members: [
				{
				loan_id : "",
				member_code: "",
				member_name: "",
				ccb_loan_id: "",
				cr_amt: "",
				mem_outstanding: "",
				calc_interest: "",
				princAmt: "",
				intAmt: "",
				},
			],
	}

	const [formValues, setValues] = useState(initialValues)


	// const validationSchema = Yup.object({
	// 		socie_loan_ac_no: Yup.string().required("Type Society Loan A/C No. is required"),
	// 	})

	const validationSchema = Yup.object({
	// socie_loan_ac_no: Yup.string().required("Type Society Loan A/C No. is required"),

	principal_amount: Yup.number().required("Principal amount is required"),
		// .test(
		// "principal-check",
		// "Principal amount must be less than Interest amount",
		// function (value) {
		// 	const { interest_amount } = this.parent
		// 	return Number(value) < Number(interest_amount)
		// }
		// ),

	interest_amount: Yup.number().required("Interest amount is required"),

	})

	const onSubmit = async (values) => {
		// setVisible(true)
		// if (params?.id > 0) {
		// 	editGroup(values)
		// }
		
		handleSubmit(values)
			
	}


	const formik = useFormik({
		initialValues: formValues,
		onSubmit,
		validationSchema,
		validateOnChange: true,
		validateOnBlur: true,
		enableReinitialize: true,
		validateOnMount: true,
	})


	const handleSubmit = async () => {
		setSocietySrchMsg('')

		setLoading(true)
		setRecoveryBtnShowOff(false)
		setAllRecoverySubBtnShowOff(false)
		setMemberAmount(false)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			society_acc_no: societyLoanNo,
			loan_to : userDetails[0]?.user_type
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/fetch_loan_dtls_based_socacc_no`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				
				if(res?.data?.success){
					
					setLoanDetails(res?.data?.data || [])

					const members = (res?.data?.data[0]?.member_list || []).map(item => ({
						...item,
						princAmt: "",
						intAmt: ""  // replace mem_amount with cr_amt
					}))

					// console.log(res?.data, 'resresresresresresres', res?.data?.data.length);
					Message("success", res?.data?.msg)
					if(res?.data?.data.length < 1){
					setSocietySrchMsg(res?.data?.msg)
					}
					

					setValues({
						...formValues,
						principal_amount: "",
    					interest_amount: "",
						// members: res?.data?.data[0]?.member_list || []
						members: members || []
					})
					// setValues({
					// 	g_group_name: res?.data?.data[0]?.group_name || "",
					// 	disburse_date: res?.data?.data[0]?.disb_dt || "",
					// 	period_month: res?.data?.data[0]?.period || "",
					// 	current_roi: res?.data?.data[0]?.curr_roi || "",
					// 	ovd_roi: res?.data?.data[0]?.penal_roi || "",
					// 	disbursed_amount: res?.data?.data[0]?.disb_amt || "",
					// 	loan_outstanding: res?.data?.data[0]?.loan_outstanding || "",
					// })
					
				
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

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const totalMemberAmount = useMemo(() => {
		return Math.round(
			formik.values.members.reduce(
				(sum, item) => sum + Number(item.cr_amt || 0),
				0
			)
		)
	}, [formik.values.members])


	const calculatePrincIntarest = async () => {

		setRecoveryBtnShowOff(false)
		
		const princAmt = formik.values.principal_amount || 0
		const intAmt = formik.values.interest_amount || 0	
		console.log(Number(princAmt), 'ffffffffffffff', intAmt);
		
		// if(princAmt.length < 1 &&  intAmt.length < 1){
		// 	return Message("error", "Principal amount or Interest amount cannot be empty")
		// }

		if(!princAmt || !intAmt){
			return Message("error", "Principal amount or Interest amount cannot be empty")
		}

		// 🔥 NEW VALIDATION
		if (princAmt + intAmt !== totalMemberAmount) {
			return Message(
				"error",
				"Sum Of Principal And Interest Must Match With Total Deposited Amount"
			);
		}


		console.log(formik.values.members, 'member_listmember_list');
		

		// const member_list = loanDetails[0]?.member_list.map(item => ({
		// loan_id: item.loan_id,
		// member_name: item.member_name,
		// mem_amount: item.cr_amt,
		// mem_outstanding: item.mem_outstanding,
		// }));


		const member_list = formik.values.members.map(item => ({
		loan_id: item.loan_id,
		member_name: item.member_name,
		mem_amount: item.cr_amt,
		mem_outstanding: item.mem_outstanding,
		}));

		

		setLoading(true)

		const ip = await getClientIP()

		const creds = {
		curr_prn : loanDetails[0]?.loan_outstanding,
		prn_amt: formik.values.principal_amount,
		intt_amt : formik.values.interest_amount,
		created_by: userDetails[0]?.emp_id,
		ip_address : ip,
		memb_loan :  member_list
		}

		// console.log(member_list, 'ffffffffffffffffffffffffffff', creds);

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/calculate_prn_intt_amt`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				
				if(res?.data?.success){
					
					// setLoanDetails(res?.data?.data || [])
					const members = (res?.data?.data || []).map(item => ({
						...item,
						cr_amt: item.mem_amount ,
						mem_outstanding: item.mem_outstanding ,
						princAmt: item.principal_amount || 0,
						intAmt: item.interest_amount || 0, // replace mem_amount with cr_amt
						calc_interest: item.calculated_interest,

					}))

					console.log(res?.data?.data, 'resresresresresresres', members, 'mmmmmmmmmmmmmmmmmm');

					setValues({
						...formValues,
						principal_amount: princAmt || "",
    					interest_amount: intAmt || "",
						members: members
						// members: {
						// 	loan_id : res?.data?.data?.loan_id,
						// }
					})
					setRecoveryBtnShowOff(true)
					setMemberAmount(true)

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


	const recoveryLoan = async () => {

		setLoading(true)
		
		// const member_list = loanDetails[0]?.member_list.map(item => ({
		const member_list = formik.values.members.map(item => ({	
		loan_id: item.loan_id,
		member_name: item.member_name,
		mem_amount: item.cr_amt,
		mem_outstanding: item.mem_outstanding,
		calculated_interest: item.calculated_interest,
		}));

		const ip = await getClientIP()

		const creds = {
		memb_loan_amt :  member_list
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/calculate_prn_intt_recov`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				if(res?.data?.success){
					
				const members = (res?.data?.data || []).map(item => ({
				...item,
				cr_amt: item.mem_amount ,
				mem_outstanding: item.mem_outstanding ,
				princAmt: item.prn_recov,
				intAmt: item.intt_recov, // replace mem_amount with cr_amt
				calc_interest: item.calculated_interest,
				}))

				setValues({
				...formValues,
				principal_amount: formik.values?.principal_amount || "",
				interest_amount: formik.values?.interest_amount || "",
				members: members
				})

				setAllRecoverySubBtnShowOff(true)
				Message("success", res?.data?.msg)

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

	const allRecoverySubmit___ = async () => {
		setLoading(true)
		
		const member_list = formik.values.members.map(item => ({	
		loan_id: item.loan_id,
		calculated_interest: item.calculated_interest,
		curr_prn: item.mem_outstanding,
		amount: item.cr_amt,
		prn_recov: item.princAmt,
		intt_recov: item.intAmt,
		}));


		const ip = await getClientIP()

		const creds = {
		ccb_loan_id : loanDetails[0]?.member_list[0]?.ccb_loan_id,
		tenant_id : userDetails[0]?.tenant_id,
		branch_id : userDetails[0]?.brn_code,
		loan_acc_no : societyLoanNo,
		loan_to : userDetails[0]?.user_type,
		society_recov :  member_list
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/submit_society_recovery`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				if(res?.data?.success){

				console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
					
				setAllRecoverySubBtnShowOff(true)
				Message("success", res?.data?.msg)

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


	const allRecoverySubmit = async (formData) => {
					setLoading(true)
				
					const ip = await getClientIP()

					const member_list = formik.values.members.map(item => ({	
					loan_id: item.loan_id,
					calculated_interest: item.calculated_interest,
					curr_prn: item.mem_outstanding,
					amount: item.cr_amt,
					prn_recov: item.princAmt,
					intt_recov: item.intAmt,
					}));
				
					const creds = {
					ccb_loan_id : loanDetails[0]?.member_list[0]?.ccb_loan_id,
					tenant_id : userDetails[0]?.tenant_id,
					branch_id : userDetails[0]?.brn_code,
					loan_acc_no : societyLoanNo,
					loan_to : userDetails[0]?.user_type,
					society_recov :  member_list,
					prn_amt: formik.values.principal_amount,
					intt_amt : formik.values.interest_amount,
					loan_outstanding : loanDetails[0]?.loan_outstanding,
					}
	
	
					// console.log(creds, 'credscredscredscreds', loanDetails[0]);
	
					// return;
					
				
					await saveMasterData({
					endpoint: "recov/submit_society_recovery",
					creds,
					navigate,
					successMsg: "Group details saved.",
					// onSuccess: () => navigate(-1),
					onSuccess: () => navigate('/homepacs/recovery-shg-list'),
				
					// 🔥 fully dynamic failure handling
					failureRedirect: routePaths.LANDING,
					clearStorage: true,
					})
				
					setLoading(false)
					}



					

	return (
		<div>
			{/* <Sidebar mode={2} /> */}
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="bg-slate-50 rounded-lg shadow-lg h-auto my-0">
					{/* <div className="flex flex-row gap-3 py-3 rounded-xl">
						<div className="text-3xl text-slate-700 font-bold">
							Loan Recovery
						</div>
					</div> */}

					

					<div className="grid grid-cols-3 gap-5 mt-0">
						<div>
							<TDInputTemplateBr
								placeholder="Society Loan A/C No..."
								type="text"
								label="Type Society Loan A/C No."
								name="soci_loan_no"
								formControlName={societyLoanNo}
								handleChange={(e) => setSocietyLoanNo(e.target.value)}
								mode={1}
							/>

						</div>
						{/* )} */}
						

						<div className="mt-7">
							{/* <button
								className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
								onClick={formik.handleSubmit}
							>
								<SearchOutlined /> <span className={`ml-2`}>Search</span>
							</button> */}

							<button
							className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
							onClick={() => {
							handleSubmit()
							// if (searchType2 !== "A") {
							// handleSubmit()
							// } else {
							// handleFetchAbsentList()
							// }
							}}
							>
							<SearchOutlined /> <span className={`ml-2`}>Search</span>
							</button>
							{/* <BtnComp mode="A" onReset={formik.resetForm} /> */}
						</div>

						<div className="sm:col-span-12 mt-0">
  {societySrchMsg.length > 0 && (
    <p className="text-red-600 bg-red-100 border border-red-400 px-4 py-2 rounded-md text-sm">
      {societySrchMsg}
    </p>
  )}
</div>
					</div>

					{/* {JSON.stringify(loanDetails[0], null, 2)} */}
					
					{/* {loanDetails.length > 0 && ( */}
					<>
					{/* <div className="border-2 border-slate-500/50 bg-blue-100 rounded-lg p-5 mt-5"> */}
					<div className="grid grid-cols-4 gap-3 mt-5">
						
						

						<div>
						<TDInputTemplateBr
						placeholder="Disburse Date"
						type="date"
						label="Disburse Date"
						name="disburse_date"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={loanDetails[0]?.disb_dt ? formatDateToYYYYMMDD(loanDetails[0]?.disb_dt) : ""}
						disabled={true}
						mode={1}
						/>
					
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Period (In Month)"
						type="number"
						label="Period (In Month)"
						name="period_month"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={loanDetails[0]?.period || ""}
						disabled={true}
						mode={1}
						/>
					
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Current ROI"
						type="number"
						label="Current ROI"
						name="current_roi"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={loanDetails[0]?.curr_roi || ""}
						disabled={true}
						mode={1}
						/>
						
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Ovd ROI"
						type="number"
						label="Ovd ROI"
						name="ovd_roi"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={loanDetails[0]?.penal_roi || ""}
						disabled={true}
						mode={1}
						/>
						
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Total Disbursed Amount"
						type="number"
						label="Total Disbursed Amount"
						name="disbursed_amount"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={loanDetails[0]?.disb_amt || ""}
						disabled={true}
						mode={1}
						/>
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Loan Outstanding"
						type="number"
						label="Loan Outstanding"
						name="loan_outstanding"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						formControlName={loanDetails[0]?.loan_outstanding || ""}
						disabled={true}
						mode={1}
						/>
						</div>

						</div>
						{/* </div> */}

						<div className="border-2 border-pink-500/50 bg-pink-100 rounded-lg p-5 mt-5">
						<div className="text-[#DA4167] text-lg font-bold mb-2 mt-0">
						Recovery
						</div>
						<div className="grid grid-cols-4 gap-5 mt-0">
						<div className="sm:col-span-1">
						<TDInputTemplateBr
						placeholder="Principal Amount"
						type="number"
						label="Principal Amount"
						name="principal_amount"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						// formControlName={loanDetails[0]?.principal_amount}
						formControlName={formik.values.principal_amount || ""}
						// disabled={true}
						mode={1}
						/>
						{formik.errors.principal_amount && formik.touched.principal_amount ? (
						<VError title={formik.errors.principal_amount} />
						) : null}
						</div>

						<div className="sm:col-span-1">
						<TDInputTemplateBr
						placeholder="Interest Amount"
						type="number"
						label="Interest Amount"
						name="interest_amount"
						handleChange={formik.handleChange}
						handleBlur={formik.handleBlur}
						// formControlName={loanDetails[0]?.interest_amount}
						formControlName={formik.values.interest_amount || ""}
						// disabled={true}
						mode={1}
						/>
						{formik.errors.interest_amount && formik.touched.interest_amount ? (
						<VError title={formik.errors.interest_amount} />
						) : null}
						</div>

						

						<div className="sm:col-span-2 mt-7">
							{/* <button
							className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-slate-600 border-slate-500 bg-slate-700 transition ease-in-out hover:bg-slate-600 duration-300 rounded-full dark:focus:ring-primary-900`}
							onClick={() => {
							calculatePrincIntarest()
							}}
							>
							<SearchOutlined /> <span className={`ml-2`}>Calculate</span>
							</button> */}

							<button
							className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border 
							${
							Number(formik.values.principal_amount || 0) +
							Number(formik.values.interest_amount || 0) !== totalMemberAmount
							? "bg-gray-400 cursor-not-allowed"
							: "border-slate-500 bg-slate-700 hover:bg-slate-600"
							}
							rounded-full`}
							onClick={calculatePrincIntarest}
							disabled={
							Number(formik.values.principal_amount || 0) +
							Number(formik.values.interest_amount || 0) !== totalMemberAmount
							}
							>
							<SearchOutlined /> <span className="ml-2">Calculate</span>
							</button>

							<button
							className={`inline-flex items-center text-white ml-6 disabled:bg-[#ee7c98] bg-[#DA4167] hover:bg-[#DA4167] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800`}
							onClick={() => {
							recoveryLoan()
							}}
							disabled={!recoveryBtnShowOff}
							>
							<WalletOutlined /> <span className={`ml-2`}>Recovery</span>
							</button>
						</div>

						
						{Number(formik.values?.principal_amount || 0) +
						Number(formik.values?.interest_amount || 0) !== totalMemberAmount && (
						<div className="sm:col-span-4">
						<p className="bg-red-500 text-white text-sm px-4 py-2 rounded-md shadow-sm">
						
						Sum Of Principal And Interest Must Match With <u><b>Total Deposited Amount</b></u>
						</p>
						</div>
						)}
						

						</div>
						</div>
							{/* <div>{JSON.stringify(formik.values.members, null, 2)}</div> */}
						{/* <div className="grid grid-cols-4 gap-5 mt-5"> */}

						{formik.values.members?.length > 0 && (
						<>
						{/* <div className="border-2 border-slate-500/50 bg-green-50 rounded-lg p-5 mt-5"> */}

						<div className="text-[#DA4167] text-lg font-bold mb-0 mt-5">
						Member Loan List
						</div>

						{/* <div>{JSON.stringify(formik.values.members, null, 2)}</div> */}

						<div className="grid grid-cols-7 gap-5 mt-2">
							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Loan ID</label>
							</div>

							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Member Name</label>
							</div>

							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Amount</label>
							</div>

							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100">  Outstanding Amount</label>
							</div>

							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100">  Calculated Interest</label>
							</div>

							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100">  Principal Recovery</label>
							</div>

							<div>
							<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100">  Interest Recovery</label>
							</div>


						</div>

						{formik.values.members.map((member, index) => (

						<div key={index} className="grid grid-cols-7 gap-5 mt-0">

						<div>
						<TDInputTemplateBr
						placeholder="Loan ID"
						type="text"
						// label="Loan ID"
						name={`members.${index}.loan_id`}
						formControlName={member.loan_id}
						disabled={true}
						mode={1}
						/>
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Member Name"
						type="text"
						// label="Member Name"
						name={`members.${index}.member_name`}
						formControlName={member.member_name}
						disabled={true}
						mode={1}
						/>
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Amount"
						type="number"
						// label="Amount"
						name={`members.${index}.cr_amt`}
						formControlName={formik.values.members[index].cr_amt}
						  value={formik.values.members[index].cr_amt}
						  handleChange={formik.handleChange}
						disabled={memberAmount}
						mode={1}
						/>

						{/* <TDInputTemplateBr
						placeholder="Amount"
						type="number"
						name={`members.${index}.cr_amt`}
						value={formik.values.members[index].cr_amt}
						onChange={formik.handleChange}
						disabled={memberAmount}
						mode={1}
						/>  */}

						{/* <TDInputTemplateBr
    placeholder="Amount"
    type="number"
    name={`members.${index}.cr_amt`}
    value={formik.values.members[index].cr_amt}
    handleChange={formik.handleChange}
    handleBlur={formik.handleBlur}
    disabled={memberAmount}
    mode={1}
/> */}

						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Outstanding Amount"
						type="number"
						// label="Outstanding Amount"
						name={`members.${index}.mem_outstanding`}
						formControlName={member.mem_outstanding}
						disabled={true}
						mode={1}
						/>
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Calculated Interest"
						type="number"
						// label="Calculated Interest"
						name={`members.${index}.calc_interest`}
						formControlName={member.calc_interest}
						disabled={true}
						mode={1}
						/>
						</div>

						<div>
						<TDInputTemplateBr
						placeholder="Principal Recovery"
						type="text"
						// label="Principal Recovery"
						name={`members.${index}.princAmt`}
						formControlName={member.princAmt}
						disabled={true}
						mode={1}
						/>
						</div>

						<div>
						<TDInputTemplateBr
						placeholder=" Interest Recovery"
						type="text"
						// label=" Interest Recovery"
						name={`members.${index}.intAmt`}
						formControlName={member.intAmt}
						disabled={true}
						mode={1}
						/>
						</div>

						</div>

						))}

						<div className="grid grid-cols-7 gap-2 mt-2 bg-slate-100 p-2 rounded-lg bg-slate-200">
							<div className="text-black font-semibold text-base">Total</div>
							<div></div>
							<div className="pl-3 text-base">
							{Math.round(formik.values.members.reduce(
                            (sum, item) => sum + Number(item.cr_amt || 0),
                            0
                            )
							)}
							</div>
							<div className="pl-3 text-base">
							{Math.round(formik.values.members.reduce(
                            (sum, item) => sum + Number(item.mem_outstanding || 0),
                            0
                            )
							)}
							</div>
							<div className="pl-3 text-base">
							{Math.round(
							formik.values.members.reduce(
								(sum, item) => sum + Number(item.calc_interest || 0),
								0
							)
							)}
							</div>
							<div className="pl-3 text-base">
							{Math.round(formik.values.members.reduce(
                            (sum, item) => sum + Number(item.princAmt || 0),
                            0
                            )
							)}
							</div>
							<div className="pl-3 text-base">
							{Math.round(formik.values.members.reduce(
                            (sum, item) => sum + Number(item.intAmt || 0),
                            0
                            )
							)}
							</div>
						</div>

						{/* </div> */}
						</>
						)}

						{allRecoverySubBtnShowOff && (
						<>
						{/* <div className="border-2 border-slate-500/50 bg-blue-100 rounded-lg p-5 mt-5"> */}
						<div className="flex justify-center mt-7">
						
							<button
							className={`inline-flex items-center px-6 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
							onClick={() => {
							allRecoverySubmit()
							}}
							disabled={!recoveryBtnShowOff}
							>
							<SaveOutlined /> <span className={`ml-2`}>Submit</span>
							</button>

						</div>
						</>
						)}

						{/* </div> */}
					
					</>
					{/* )} */}

					
					
					
				</main>
			</Spin>
		</div>
	)
}

export default LoanDetails
