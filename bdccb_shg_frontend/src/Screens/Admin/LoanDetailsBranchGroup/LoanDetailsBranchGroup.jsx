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
	AppstoreAddOutlined,
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

function LoanDetailsBranchGroup() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [societyLoanNo, setSocietyLoanNo] = useState('')
	const [loanDetails, setLoanDetails] = useState([])
	const [recoveryBtnShowOff, setRecoveryBtnShowOff] = useState(false)
	const [allRecoverySubBtnShowOff, setAllRecoverySubBtnShowOff] = useState(false)
	const [memberAmount, setMemberAmount] = useState(false)
	const [societySrchMsg, setSocietySrchMsg] = useState('')
	const [groupList, setGroupList] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState([]);

	const navigate = useNavigate()


	const initialValues = {
		transaction_date: new Date().toISOString().split("T")[0],
		principal_amount: "",
		interest_amount: "",
		members: [
			{
				loan_id: "",
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

		transaction_date: Yup.date()
			.required("Transaction Date is required")
			.max(new Date().toISOString().split("T")[0], "Future dates are not allowed")
			.test(
				"is-greater-or-equal",
				"Transaction Date must be greater than or equal to Disbursement Date",
				function (value) {
					const disbDate = loanDetails[0]?.disb_dt?.substring(0, 10);
					if (!disbDate || !value) return true;
					return new Date(value) >= new Date(disbDate);
				}
			),

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


	const handlePopulate = async () => {
		// setSocietySrchMsg('')

		// setLoading(true)
		// setRecoveryBtnShowOff(false)
		// setAllRecoverySubBtnShowOff(false)
		// setMemberAmount(false)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			ccb_acc_no: societyLoanNo,
			ccb_loan_id: selectedGroup?.loan_id
		}

		console.log(selectedGroup?.loan_id, 'groupegroupegroupe', creds);

		// return;
		// {
		// "ccb_acc_no" : "",
		// "branch_id" : "",
		// "tenant_id" : "",
		// "ccb_loan_id" : ""
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/fetch_loan_details`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {


				if (res?.data?.success) {

					setLoanDetails(res?.data?.data || [])

					const members = (res?.data?.data[0]?.members || []).map(item => ({
						...item,
						loan_id: item.mem_loan_id,
						member_name: item.member_name,
						mem_outstanding: item.principal_amt,
						loan_amt: "",
						sb_amt: ""
					}))

					console.log(res?.data, 'resresresresresresres');
					Message("success", res?.data?.msg)
					if (res?.data?.data.length < 1) {
						setSocietySrchMsg(res?.data?.msg)
					}


					setValues({
						...formValues,
						transaction_date: new Date().toISOString().split("T")[0],
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

	const handleSubmit = async () => {
		setSocietySrchMsg('')

		setLoading(true)
		setRecoveryBtnShowOff(false)
		setAllRecoverySubBtnShowOff(false)
		setMemberAmount(false)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			emp_id: societyLoanNo
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/fetch_loan_details`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`,
				"Content-Type": "application/json",
			},
		})
			.then((res) => {


				if (res?.data?.success) {
					if (res?.data?.data.length === 1) {
						setLoanDetails(res?.data?.data || [])

						const members = (res?.data?.data[0]?.members || []).map(item => ({
							...item,
							loan_id: item.mem_loan_id,
							member_name: item.member_name,
							mem_outstanding: item.principal_amt,
							loan_amt: "",
							sb_amt: ""
						}))

						Message("success", res?.data?.msg)
						
						const groupName = res?.data?.data[0]?.members?.[0]?.group_name || '';
						const groupCode = res?.data?.data[0]?.members?.[0]?.group_code || '';
						if (groupName && groupCode) {
							setSocietyLoanNo(`${groupName} (${groupCode})`);
						}

						setValues({
							...formValues,
							transaction_date: new Date().toISOString().split("T")[0],
							principal_amount: "",
							interest_amount: "",
							members: members || []
						})
						setGroupList([]);
						setSocietySrchMsg('');
					} else if (res?.data?.data.length > 1) {
						setGroupList(res.data.data);
						setLoanDetails([]);
						Message("success", "Multiple groups found. Please select one from the dropdown.");
						setSocietySrchMsg('');
					} else {
						setSocietySrchMsg(res?.data?.msg || "No groups found");
						setLoanDetails([]);
						setGroupList([]);
						setValues({
							...formValues,
							transaction_date: new Date().toISOString().split("T")[0],
							principal_amount: "",
							interest_amount: "",
							members: []
						});
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

		const trnDate = formik.values.transaction_date;
		const disbDate = loanDetails[0]?.disb_dt?.substring(0, 10);

		if (trnDate && disbDate && new Date(trnDate) < new Date(disbDate)) {
			return Message("error", "Transaction Date must be greater than or equal to Disbursement Date");
		}

		const princAmt = formik.values.principal_amount || 0
		const intAmt = formik.values.interest_amount || 0
		console.log(Number(princAmt), 'ffffffffffffff', intAmt);

		// if(princAmt.length < 1 &&  intAmt.length < 1){
		// 	return Message("error", "Principal amount or Interest amount cannot be empty")
		// }

		if (!princAmt || !intAmt) {
			return Message("error", "Principal amount or Interest amount cannot be empty")
		}

		// 🔥 NEW VALIDATION

		if (princAmt + intAmt !== totalMemberAmount) {
			return Message(
				"error",
				"Sum Of Principal And Interest Must Match With Total Deposited Amount"
			);
		}


		// console.log(formik.values.members, 'member_listmember_list');


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
			curr_prn: loanDetails[0]?.loan_outstanding,
			prn_amt: formik.values.principal_amount,
			intt_amt: formik.values.interest_amount,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
			memb_loan: member_list
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


				if (res?.data?.success) {

					// setLoanDetails(res?.data?.data || [])
					const members = (res?.data?.data || []).map(item => ({
						...item,
						cr_amt: item.mem_amount,
						mem_outstanding: item.mem_outstanding,
						princAmt: item.principal_amount || 0,
						intAmt: item.interest_amount || 0, // replace mem_amount with cr_amt
						calc_interest: item.calculated_interest,

					}))

					// console.log(res?.data?.data, 'resresresresresresres', members, 'mmmmmmmmmmmmmmmmmm');

					setValues({
						...formValues,
						transaction_date: formik.values?.transaction_date || new Date().toISOString().split("T")[0],
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
			memb_loan_amt: member_list
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/calculate_prn_intt_recov`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				if (res?.data?.success) {

					const members = (res?.data?.data || []).map(item => ({
						...item,
						cr_amt: item.mem_amount,
						mem_outstanding: item.mem_outstanding,
						princAmt: item.prn_recov,
						intAmt: item.intt_recov, // replace mem_amount with cr_amt
						calc_interest: item.calculated_interest,
					}))

					setValues({
						...formValues,
						transaction_date: formik.values?.transaction_date || new Date().toISOString().split("T")[0],
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
			ccb_loan_id: loanDetails[0]?.member_list[0]?.ccb_loan_id,
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			loan_acc_no: societyLoanNo,
			loan_to: userDetails[0]?.user_type,
			society_recov: member_list
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/submit_society_recovery`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				if (res?.data?.success) {

					console.log(res?.data?.data, 'fffffffffffffffffffffff', creds, 'lll');

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


	const allRecoverySubmit = async () => {
		setLoading(true);

		const ip = await getClientIP();

		const member_list = formik.values.members.map(item => ({
			mem_trn_id: "0",
			mem_loan_id: item.mem_loan_id,
			principal_amt: item.principal_amt,
			cr_amt: item.loan_amt || 0,
			sb_amt: item.sb_amt || 0
		}));

		const creds = {
			tenant_id: loanDetails[0]?.tenant_id,
			branch_id: loanDetails[0]?.branch_id,
			loan_acc_no: loanDetails[0]?.ccb_loan_acc_no || "",
			loan_to: "S",
			branch_shg_id: loanDetails[0]?.branch_shg_id || "",
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
			loan_id: loanDetails[0]?.loan_id || "",
			trans_date: formik.values.transaction_date,
			members: member_list
		};

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/save_grp_recovery`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`,
				"Content-Type": "application/json",
			},
		})
			.then((res) => {
				if (res?.data?.success) {
					Message("success", res?.data?.msg || "Collection successful!");
					navigate("/homebm/loan-recovery-group-list");
				} else {
					Message("error", res?.data?.msg || "Failed to collect amount");
				}
			})
			.catch((err) => {
				Message("error", "Some error occurred while submitting collection");
			});

		setLoading(false);
	}

	const groupDropdown = groupList.map(item => ({
		code: item.code,
		loan_id: item.loan_id,
		original_name: item.name, // keep original
		name: `${item.name} (${item.loan_id})` // display
	}));

	const handleTransactionDateChange = async (e) => {
		const trnDate = e.target.value;
		formik.setFieldValue("transaction_date", trnDate);

		const disbDate = loanDetails[0]?.disb_dt?.substring(0, 10);

		if (trnDate && disbDate && new Date(trnDate) < new Date(disbDate)) {
			Message("error", "Transaction Date must be greater than or equal to Disbursement Date");
		}

		if (trnDate && selectedGroup?.loan_id) {
			const creds = {
				ccb_loan_id: selectedGroup?.loan_id,
				trans_date: trnDate
			};

			const tokenValue = await getLocalStoreTokenDts(navigate);
			try {
				const res = await axios.post(`${url_bdccb}/recov/check_recovery_date`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				});

				if (res?.data?.success && res?.data?.recovery_exists) {
					Message("error", "Recovery already done on this date");
					formik.setFieldValue("transaction_date", "");
					return;
				}
			} catch (err) {
				console.error("Error checking recovery date", err);
			}
		}
	};

	return (
		<div>
			{/* <Sidebar mode={2} /> */}
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="pb-5 bg-slate-50 rounded-lg shadow-lg h-auto my-0">
					{/* <div className="flex flex-row gap-3 py-3 rounded-xl">
						<div className="text-3xl text-slate-700 font-bold">
							Loan Recovery Of Group
						</div>
					</div> */}



					<div className="grid grid-cols-4 gap-5 mt-0">
						<div className="sm:col-span-2">
							{groupList.length > 0 ? (
								<TDInputTemplateBr
									placeholder="-- Select Group to Populate / Clear to Search Again --"
									type="text"
									label="Type group name / group code"
									name="selected_group"
									formControlName={selectedGroup}
									handleChange={(e) => {
										const selectedCode = e.target.value;
										if (!selectedCode) {
											setGroupList([]);
											setSelectedGroup("");
											setSocietyLoanNo("");
											setLoanDetails([]);
											return;
										}
										setSelectedGroup(selectedCode);
										setSocietyLoanNo(selectedCode); // Sets the exact group code to be searched when the user clicks 'Search'
									}}
									data={groupList.map(item => ({
										code: item.members?.[0]?.group_code,
										name: `${item.members?.[0]?.group_name || 'Unknown'} (${item.members?.[0]?.group_code || 'Unknown'})`
									}))}
									mode={2}
								/>
							) : (
								<TDInputTemplateBr
									placeholder="Type group name / group code"
									type="text"
									label="Type group name / group code"
									name="soci_loan_no"
									formControlName={societyLoanNo}
									handleChange={(e) => setSocietyLoanNo(e.target.value)}
									mode={1}
								/>
							)}
						</div>


						<div className="mt-7 sm:col-span-1">
							{/* <button
								className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
								onClick={formik.handleSubmit}
							>
								<SearchOutlined /> <span className={`ml-2`}>Search</span>
							</button> */}

							<button
								className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border transition ease-in-out duration-300 rounded-full ${!societyLoanNo
									? "bg-teal-500/50 border-teal-500/50 cursor-not-allowed"
									: "bg-teal-500 hover:bg-green-600 hover:border-green-600 border-teal-500 dark:focus:ring-primary-900"
									}`}
								onClick={() => {
									if (societyLoanNo) handleSubmit()
								}}
								disabled={!societyLoanNo}
							>
								<SearchOutlined /> <span className={`ml-2`}>Search</span>
							</button>
							{/* <BtnComp mode="A" onReset={formik.resetForm} /> */}
						</div>



						<div className="sm:col-span-4 mt-0">
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
									type="text"
									label="Disburse Date"
									name="disburse_date"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={loanDetails[0]?.disb_dt || ""}
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
									placeholder="Transaction Date"
									type="date"
									label="Transaction Date"
									name="transaction_date"
									handleChange={handleTransactionDateChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.transaction_date || ""}
									min={loanDetails[0]?.disb_dt ? loanDetails[0]?.disb_dt.substring(0, 10) : ""}
									max={new Date().toISOString().split("T")[0]}
									mode={1}
								/>
								{formik.errors.transaction_date && formik.touched.transaction_date ? (
									<VError title={formik.errors.transaction_date} />
								) : null}
							</div>

						</div>
						{/* <div>{JSON.stringify(formik.values.members, null, 2)}</div> */}
						{/* <div className="grid grid-cols-4 gap-5 mt-5"> */}

						{formik.values.members?.length > 0 && (
							<>
								{/* <div className="border-2 border-slate-500/50 bg-green-50 rounded-lg p-5 mt-5"> */}

								<div className="text-[#DA4167] text-lg font-bold mb-0 mt-5">
									Members
								</div>

								{/* <div>{JSON.stringify(formik.values.members, null, 2)}</div> */}

								<div className="grid grid-cols-5 gap-5 mt-2">
									<div>
										<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Member Loan ID</label>
									</div>

									<div>
										<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Member Name</label>
									</div>

									<div>
										<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Outstanding Amount</label>
									</div>

									<div>
										<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> Loan Amount</label>
									</div>

									<div>
										<label for="members.0.loan_id" class="block mb-0 text-sm capitalize font-bold text-slate-800
							dark:text-gray-100"> SB Amount</label>
									</div>
								</div>

								{formik.values.members.map((member, index) => (

									<div key={index} className="grid grid-cols-5 gap-5 mt-0">

										<div>
											<TDInputTemplateBr
												placeholder="Member Loan ID"
												type="text"
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
												name={`members.${index}.member_name`}
												formControlName={member.member_name}
												disabled={true}
												mode={1}
											/>
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="Outstanding Amount"
												type="number"
												name={`members.${index}.mem_outstanding`}
												formControlName={member.mem_outstanding}
												disabled={true}
												mode={1}
											/>
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="Loan Amount"
												type="number"
												name={`members.${index}.loan_amt`}
												formControlName={formik.values.members[index].loan_amt}
												value={formik.values.members[index].loan_amt}
												handleChange={formik.handleChange}
												mode={1}
											/>
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="SB Amount"
												type="number"
												name={`members.${index}.sb_amt`}
												formControlName={formik.values.members[index].sb_amt}
												value={formik.values.members[index].sb_amt}
												handleChange={formik.handleChange}
												mode={1}
											/>
										</div>

									</div>

								))}

								<div className="grid grid-cols-5 gap-2 mt-2 bg-slate-100 p-2 rounded-lg bg-slate-200">
									<div className="text-black font-semibold text-base col-span-3 text-center pr-10">Total</div>
									<div className="pl-3 text-base">
										{Math.round(formik.values.members.reduce(
											(sum, item) => sum + Number(item.loan_amt || 0),
											0
										)
										)}
									</div>
									<div className="pl-3 text-base">
										{Math.round(formik.values.members.reduce(
											(sum, item) => sum + Number(item.sb_amt || 0),
											0
										)
										)}
									</div>
								</div>

								<div className="flex justify-center mt-7">
									<Popconfirm
										title={`Collect Loan Amount ${Math.round(formik.values.members.reduce((sum, item) => sum + Number(item.loan_amt || 0) + Number(item.sb_amt || 0), 0))}/-?`}
										description="Are you sure, you want to deposit this amount?"
										onConfirm={() => allRecoverySubmit()}
										okText="YES"
										cancelText="NO"
										disabled={formik.values.members.reduce((sum, item) => sum + Number(item.loan_amt || 0) + Number(item.sb_amt || 0), 0) === 0}
									>
										<button
											className={`inline-flex items-center px-6 py-2 mt-0 text-sm font-small text-center text-white border transition ease-in-out duration-300 rounded-full ${formik.values.members.reduce((sum, item) => sum + Number(item.loan_amt || 0) + Number(item.sb_amt || 0), 0) > 0
												? "bg-teal-500 hover:bg-green-600 border-teal-500 hover:border-green-600 dark:focus:ring-primary-900"
												: "bg-teal-500/50 border-teal-500/50 cursor-not-allowed"
												}`}
											disabled={formik.values.members.reduce((sum, item) => sum + Number(item.loan_amt || 0) + Number(item.sb_amt || 0), 0) === 0}
										>
											<SaveOutlined /> <span className={`ml-2`}>Collect Amount</span>
										</button>
									</Popconfirm>
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

export default LoanDetailsBranchGroup
