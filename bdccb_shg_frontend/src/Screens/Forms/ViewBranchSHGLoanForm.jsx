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
import { Spin, Button, Popconfirm, Tag, Timeline, Divider, Modal } from "antd"
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
} from "@ant-design/icons"
import FormHeader from "../../Components/FormHeader"
import { routePaths } from "../../Assets/Data/Routes"
import { useLocation } from "react-router"
import Sidebar from "../../Components/Sidebar"
import DialogBox from "../../Components/DialogBox"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import TimelineComp from "../../Components/TimelineComp"
import DynamicTailwindTable from "../../Components/Reports/DynamicTailwindTable"
import { disbursementDetailsHeader, disbursementDetailsHeader_SOCIE } from "../../Utils/Reports/headerMap"
import { getOrdinalSuffix } from "../../Utils/ordinalSuffix"
import AlertComp from "../../Components/AlertComp"
import moment from "moment"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
const formatINR = (num) =>
	new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(num || 0)
function ViewBranchSHGLoanForm({ groupDataArr }) {
	const [loanDtls, setLoanDtls] = useState([]);
	const [isOverdue, setIsOverdue] = useState('N');
	const [overDueAmt, setOverDueAmt] = useState(0);
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const loanAppData = location.state || {}
	console.log("loanAppData in view branch shg loan form", loanAppData)
	// const loanAppData = location.state?.item || {};
	// const branch_id = location.state?.branch_id || {};
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))
	const [count, setCount] = useState(0)
	const [groupData, setGroupData] = useState(() => [])
	const [memberData, setMemberData] = useState(() => [])
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
	const [memDetails, setMemDetails] = useState(() => [])
	const [ccbLoanDetails, setCcbLoanDetails] = useState(() => [])
	const containerRef = useRef(null)

	const [isHovered, setIsHovered] = useState(false)

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

	{
		/* purpose,scheme name,interest rate,period,period mode,fund name,total applied amount,total disbursement amount,disbursement date,current outstanding */
	}
	// const WEEKS = [
	// 	{
	// 		code: "1",
	// 		name: "Sunday",
	// 	},
	// 	{
	// 		code: "2",
	// 		name: "Monday",
	// 	},
	// 	{
	// 		code: "3",
	// 		name: "Tuesday",
	// 	},
	// 	{
	// 		code: "4",
	// 		name: "Wednesday",
	// 	},
	// 	{
	// 		code: "5",
	// 		name: "Thursday",
	// 	},
	// 	{
	// 		code: "6",
	// 		name: "Friday",
	// 	},
	// 	{
	// 		code: "7",
	// 		name: "Saturday",
	// 	},
	// ]

	// const WEEKS_FOURT_NIGHT = [
	// 	{
	// 		code: "1",
	// 		name: "Sunday",
	// 	},
	// 	{
	// 		code: "2",
	// 		name: "Monday",
	// 	},
	// 	{
	// 		code: "3",
	// 		name: "Tuesday",
	// 	},
	// 	{
	// 		code: "4",
	// 		name: "Wednesday",
	// 	},
	// 	{
	// 		code: "5",
	// 		name: "Thursday",
	// 	},
	// 	{
	// 		code: "6",
	// 		name: "Friday",
	// 	},
	// 	{
	// 		code: "7",
	// 		name: "Saturday",
	// 	},
	// ]

	// const Fortnight = [
	// {
	// 	code: "1",
	// 	name: "Week (1-3)",
	// },
	// {
	// 	code: "2",
	// 	name: "Week (2-4)",
	// }
	// ]
	const society_member_details = async () => {
		const tokenValue = await getLocalStoreTokenDts(navigate);

		const payload = {
			"group_code": loanAppData?.group_code,

		}
		axios.post(`${url_bdccb}/recov/fetch_mem_details`, payload, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {
				console.log(res?.data);
				setMemDetails(res?.data?.data || [])
			})
			.catch((err) => {
				setLoading(false);
				console.log("Error occurred while calling API:", err);
			});



	}
	const initialValues = {

		g_group_name: "",
		g_branch_name: "",
		pacs_name: "",
		sahayika_name: "",
		g_phone1: "",
		g_address: "",
		dist_name: "",
		g_group_block: "",

		ps_name: "",
		post_name: "",
		gp_name: "",
		vill_name: "",
		pin_no: "",

	}
	const [formValues, setValues] = useState(initialValues)

	const validationSchema = Yup.object({
		g_group_name: Yup.string(),
		g_group_type: Yup.string(),
		g_address: Yup.string(),
		g_pin: Yup.string(),
		// g_group_block: Yup.string().required("Group block is required"),
		g_phone1: Yup.string(),
	})




	const fetchLoanDetails = async () => {
		setLoading(true)
		const creds = {
			// group_code: params?.id,
			tenant_id: userDetails[0]?.tenant_id,
			branch_code: userDetails[0]?.brn_code,
			group_code: loanAppData?.group_code,
			society_acc_no: loanAppData?.group_details[0]?.society_acc_no,
			branch_type: userDetails[0]?.branch_type
		}


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/fetch_society_loan_dtls`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				// console.log(res?.data?.data, 'dataaaaaaaaaaaaaaaaaaa', creds);
				if (res?.data?.success) {
					// setGroups(res?.data?.data)
					// setCopyLoanApplications(res?.data?.data)
					setGroupData(res?.data?.data)
					fetchLoanMemberDetails(res?.data?.data[0]?.loan_id)

				} else {
					// navigate(routePaths.LANDING)
					// localStorage.clear()
				}

			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}

	const fetchLoanMemberDetails = async (loan_id) => {
		setLoading(true)
		const creds = {
			// group_code: params?.id,
			loan_id: loan_id,
			tenant_id: userDetails[0]?.tenant_id,
			// branch_code: userDetails[0]?.brn_code,
			branch_code: userDetails[0]?.brn_code,
			group_code: loanAppData?.group_code,
			loan_acc_no: loanAppData?.loan_acc_no,
			///////
			society_acc_no: loanAppData?.group_details[0]?.society_acc_no,
			branch_type: userDetails[0]?.branch_type,
			pacs_id: loanAppData?.group_details[0]?.pacs_id
		}


		// {
		// "loan_id" : "CCB_LOAN_ID",
		// "tenant_id" : "",
		// "branch_code" : "",
		// "group_code" : "",
		// "society_acc_no" : ""
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/fetch_indivitual_shg_member`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				console.log(res?.data?.data, 'dataaaaaaaaaaaaaaaaaaa', creds);
				if (res?.data?.success) {
					// setGroupData(res?.data?.data)
					setMemberData(res?.data?.data)

				} else {
					// navigate(routePaths.LANDING)
					// localStorage.clear()
				}

			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}

	const fetchGroupDetails = async () => {
		setLoading(true)

		setValues({
			// g_branch_name: res?.data?.msg[0]?.emp_name,
			g_group_name: loanAppData?.group_details[0]?.group_name,
			g_branch_name: loanAppData?.group_details[0]?.branch_name,
			pacs_name: loanAppData?.group_details[0]?.pacs_name,
			sahayika_name: loanAppData?.group_details[0]?.sahayika_name,
			g_phone1: loanAppData?.group_details[0]?.phone1,
			g_address: loanAppData?.group_details[0]?.group_addr,
			dist_name: loanAppData?.group_details[0]?.dist_name,
			g_group_block: loanAppData?.group_details[0]?.block_name,
			ps_name: loanAppData?.group_details[0]?.ps_name,
			post_name: loanAppData?.group_details[0]?.post_name,
			gp_name: loanAppData?.group_details[0]?.gp_name,
			vill_name: loanAppData?.group_details[0]?.vill_name,
			pin_no: loanAppData?.group_details[0]?.pin_no,
		})
		// setGroupData(res?.data?.msg)
		// setPeriodMode(res?.data?.msg[0].disb_details[0]?.period_mode)
		// setPeriodModeVal(res?.data?.msg[0].disb_details[0]?.recovery_day)
		// setWeekOfRecovery(res?.data?.msg[0].disb_details[0]?.week_no)
		// setBranch(
		// 	res?.data?.msg[0]?.disctrict + "," + res?.data?.msg[0]?.branch_code
		// )
		// setBlock(res?.data?.msg[0]?.block)
		// setIsOverdue(res?.data?.msg[0]?.overdue_flag);
		// setOverDueAmt(res?.data?.msg[0]?.overdue_amt);

		setLoading(false)
	}
    const ccbloandetails = async()=>{
	setLoading(true)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			group_code: loanAppData?.group_code,
			pacs_id: loanAppData?.group_details[0]?.pacs_id,
			loan_acc_no: loanAppData?.loan_acc_no,
			//////
			branch_type: userDetails[0]?.branch_type,
			society_acc_no: loanAppData?.group_details[0]?.society_acc_no
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/fetch_ccb_loan_dtls`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				console.log(res?.data?.data, 'dataaaaaaaaaaaaaaaaaaa', creds);
				if (res?.data?.success) {
					setCcbLoanDetails(res?.data?.data)
					fetchLoanMemberDetails(res?.data?.data[0]?.loan_id)

					// setGroupData(res?.data?.data)
					// setMemberData(res?.data?.data)

				} else {
					// navigate(routePaths.LANDING)
					// localStorage.clear()
				}

			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
		setLoading(false)
	}
	useEffect(() => {
		fetchGroupDetails()
		fetchLoanDetails()
		society_member_details()
		ccbloandetails()
		console.log(userDetails[0]?.user_type, 'gggggggggggggggggggg');

	}, [])

   

	const onSubmit = async (values) => {
		console.log("onsubmit called")
		console.log(values, "onsubmit vendor")
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



	const callAPi = async (item) => {
		// console.log(item);
		setLoading(true);
		setLoanDtls([]);
		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {
			const payload = {
				branch_code: userDetails?.brn_code,
				loan_id: item?.loan_id,
			}
			axios.post(`${url}/admin/look_overdue_details`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
				.then((res) => {
					// console.log(res?.data?.msg, 'testtttttttttt');

					if (res?.data?.suc === 0) {
						// Message('error', res?.data?.msg)
						// navigate(routePaths.LANDING)
						// localStorage.clear()
					} else {

						// console.log("API response:", res.data);
						setOpenModal(true);
						setLoanDtls(res?.data?.msg || []);
						setLoading(false);

					}

				})
				.catch((err) => {
					setLoading(false);
					console.log("Error occurred while calling API:", err);
				});
		}
		catch (err) {
			setLoading(false);
			console.log("Error occurred while calling API:", err);
		}
	}


	// const getFortnightDayName = (code) => {
	// const day = WEEKS_FOURT_NIGHT.find((d) => d.code === String(code));
	// return day ? day.name : "";
	// };

	// const getWeekOfRecoveryName = (code) => {
	// const day = Fortnight.find((d) => d.code === String(code));
	// return day ? day.name : "--";
	// };

	const totalOutstanding = memberData?.reduce(
		(sum, item) => sum + Number(item?.member_outstanding || 0),
		0
	)


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
					<div className="flex flex-col justify-start gap-5">
						{/* {JSON.stringify(loanAppData)}  */}
						<div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
							{/* {params?.id > 0 && (
								<div className="sm:col-span-2">
									<TDInputTemplateBr
										placeholder="Form filled by / CO Name"
										type="text"
										label="Form filled by / CO Name"
										name="co_name"
										formControlName={groupData[0]?.emp_name}
										mode={1}
										disabled
									/>
								</div>
							)} */}
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
								{/* {formik.errors.g_group_name && formik.touched.g_group_name ? (
									<VError title={formik.errors.g_group_name} />
								) : null} */}
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
								{/* {formik.errors.g_group_name && formik.touched.g_group_name ? (
									<VError title={formik.errors.g_group_name} />
								) : null} */}
							</div>

							<div className="sm:col-span-1">
								<TDInputTemplateBr
									placeholder="Branch Name"
									type="text"
									label="Branch Name"
									name="g_branch_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_branch_name}
									mode={1}
									disabled
								/>
								{/* {formik.errors.g_group_name && formik.touched.g_group_name ? (
									<VError title={formik.errors.g_group_name} />
								) : null} */}
							</div>

							<div className="sm:col-span-1">
								<TDInputTemplateBr
									placeholder="PACS Name"
									type="text"
									label="PACS Name"
									name="pacs_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.pacs_name}
									mode={1}
									disabled
								/>
							</div>


							<div>

								<TDInputTemplateBr
									placeholder="Sahayika Name"
									type="text"
									label="Sahayika Name"
									name="sahayika_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.sahayika_name}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Mobile No. 1"
									type="number"
									label="Mobile No. 1"
									name="g_phone1"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_phone1}
									mode={1}
									disabled
								/>
							</div>

							<div className="sm:col-span-2">
								<TDInputTemplateBr
									placeholder="Type Address..."
									type="text"
									label={`Address and PIN`}
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
									placeholder="District Name"
									type="text"
									label={`District Name`}
									name="dist_name"
									formControlName={formik.values.dist_name}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Block Name"
									type="text"
									label={`Block Name`}
									name="g_group_block"
									formControlName={formik.values.g_group_block}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Police Station"
									type="text"
									label={`Police Station`}
									name="ps_name"
									formControlName={formik.values.ps_name}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Post Office"
									type="text"
									label={`Post Office`}
									name="post_name"
									formControlName={formik.values.post_name}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="GP Name"
									type="text"
									label={`GP Name`}
									name="gp_name"
									formControlName={formik.values.gp_name}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Village Name"
									type="text"
									label={`Village Name`}
									name="vill_name"
									formControlName={formik.values.vill_name || 'no data'}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="PIN No."
									type="text"
									label={`PIN No.`}
									name="pin_no"
									formControlName={formik.values.pin_no}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
									disabled
								/>
							</div>
							<div>
								<button onClick={() => setVisible(true)} className=" disabled:bg-gray-400 disabled:dark:bg-gray-400 inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-teal-500 transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300  rounded-full focus:ring-gray-600  dark:focus:ring-primary-900 dark:bg-[#22543d] dark:hover:bg-gray-600">View Member Details</button>

							</div>

							{/* <div>
								<TDInputTemplateBr
									placeholder="Bank Name"
									type="text"
									label="Bank Name"
									name="g_bank_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_bank_name}
									mode={1}
									disabled
								/>
							
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Bank Branch"
									type="text"
									label="Bank Branch"
									name="g_bank_branch"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_bank_branch}
									mode={1}
									disabled
								/>
							
							</div> */}

							{/* <div>
								<TDInputTemplateBr
									placeholder="IFSC"
									type="text"
									label="IFSC Code"
									name="g_ifsc"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_ifsc}
									mode={1}
								/>
								{formik.errors.g_ifsc && formik.touched.g_ifsc ? (
									<VError title={formik.errors.g_ifsc} />
								) : null}
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="MICR"
									type="text"
									label="MICR Code"
									name="g_micr"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_micr}
									mode={1}
								/>
								{formik.errors.g_micr && formik.touched.g_micr ? (
									<VError title={formik.errors.g_micr} />
								) : null}
							</div> */}

							{/* <div>
								<TDInputTemplateBr
									placeholder="SB Account"
									type="text"
									label="SB Account"
									name="g_acc1"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_acc1}
									mode={1}
									disabled
								/>
								
							</div> */}

							{/* <div>
								<TDInputTemplateBr
									placeholder="Loan Account"
									type="text"
									label="Loan Account"
									name="g_acc2"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_acc2}
									mode={1}
									disabled
								/>
						
							</div> */}
						</div>
						{/* <Divider
							type="horizontal"
							style={{
								height: 5,
							}}
						/> */}
						{/* <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
							<div className="sm:col-span-1">
								<TDInputTemplateBr
									placeholder="Select Mode"
									type="text"
									label="Mode"
									name="b_mode"
									formControlName={period_mode}
									// handleChange={handleChangeDisburseDetails}
									data={[
										{
											code: "Monthly",
											name: "Monthly",
										},
										{
											code: "Weekly",
											name: "Weekly",
										},
										{
											code: "Fortnight",
											name: "Fortnight",
										},
									]}
									mode={2}
									disabled
								/>
							</div>
							
								{period_mode === "Monthly" ? (
									<div className="sm:col-span-1">
										<div className="sm:col-span-6">
											{!period_mode_val && (
												<span
													style={{ color: "red" }}
													className="right-0 ant-tag ant-tag-error ant-tag-borderless text-[12.6px] my-0 css-dev-only-do-not-override-1tse2sn absolute"
												>
													Required!
												</span>
											)}
											<TDInputTemplateBr
												placeholder="Day of Recovery..."
												type="number"
												label={`Day of Recovery ${
													period_mode_val
														? `(${getOrdinalSuffix(
																period_mode_val
														  )} of every month)`
														: ""
												}`}
												name="b_dayOfRecovery"
												formControlName={period_mode_val}
												handleChange={(e) => setPeriodModeVal(e.target.value)}
												mode={1}
												// disabled={
												// 	!disbursementDetailsData?.b_scheme || disburseOrNot
												// }
											/>
											{(period_mode_val < 1 || period_mode_val > 31) && (
												<VError title={`Day should be between 1 to 31`} />
											)}
										</div>
									</div>
								) : period_mode === "Weekly" ? (
									<div className="sm:col-span-1">
										<div className="sm:col-span-6">
											{!period_mode_val && (
												<span
													style={{ color: "red" }}
													className="right-0 ant-tag ant-tag-error ant-tag-borderless text-[12.6px] my-0 css-dev-only-do-not-override-1tse2sn absolute"
												>
													Required!
												</span>
											)}
											<TDInputTemplateBr
												placeholder="Select Weekday"
												type="text"
												label="Day of Recovery"
												name="b_dayOfRecovery"
												formControlName={period_mode_val}
												handleChange={(e) => setPeriodModeVal(e.target.value)}
												data={WEEKS}
												mode={2}
												// disabled={
												// 	!disbursementDetailsData.b_scheme || disburseOrNot
												// }
											/>
										</div>
									</div>
								) : period_mode === "Fortnight" ? (
									<>

									<div className="sm:col-span-1">
										<div className="sm:col-span-6">
											{!period_mode_val && (
												<span
													style={{ color: "red" }}
													className="right-0 ant-tag ant-tag-error ant-tag-borderless text-[12.6px] my-0 css-dev-only-do-not-override-1tse2sn absolute"
												>
													Required!
												</span>
											)}
											<TDInputTemplateBr
												placeholder="Select Weekday"
												type="text"
												label="Day of Recovery"
												name="b_dayOfRecovery"
												formControlName={period_mode_val}
												handleChange={(e) => setPeriodModeVal(e.target.value)}
												data={WEEKS_FOURT_NIGHT}
												mode={2}
												// disabled={
												// 	!disbursementDetailsData.b_scheme || disburseOrNot
												// }
											/>
										</div>
										</div>

									<div className="sm:col-span-1">
									
									<div className="sm:col-span-6">
										
											{!weekOfRecovery && (
												<span
													style={{ color: "red" }}
													className="right-0 ant-tag ant-tag-error ant-tag-borderless text-[12.6px] my-0 css-dev-only-do-not-override-1tse2sn absolute"
												>
													Required!
												</span>
											)}
											<TDInputTemplateBr
												placeholder="Select Weekday"
												type="text"
												label="Week of Recovery"
												name="b_dayOfRecovery_Fortnight"
												formControlName={weekOfRecovery}
												handleChange={(e) => setWeekOfRecovery(e.target.value)}
												data={Fortnight}
												mode={2}
											/>
										</div>

										</div>

										
									</>
										
									
								) : null}
							
							{userDetails?.id != 3 && <div className="sm:col-span-2 text-center">
								<button
									className="py-2.5 px-5 bg-teal-500 text-slate-50 rounded-full hover:bg-green-500 active:ring-2 active:ring-slate-500"
									type="button"
									// onClick={() => setVisible2(true)}
									onClick={async () => {
										const creds = {
											recovery_day: period_mode_val,
											week_no: weekOfRecovery,
											modified_by: userDetails?.emp_id,
											recov_day_dtls: groupData[0]?.disb_details?.map((e) => {
												return { loan_id: e.loan_id }
											}),
										}

										const tokenValue = await getLocalStoreTokenDts(navigate);

										axios
											.post(url + "/admin/change_recovery_day", creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
											.then((res) => {
												
												if(res?.data?.suc === 0){
												// Message('error', res?.data?.msg)
												navigate(routePaths.LANDING)
												localStorage.clear()
												} else {
													setCount((prev) => prev + 1)
													Message(
														"success",
														"Recovery day updated successfully!"
													)
												} 
												
												// else {
												// 	Message("error", "Error while updating!")
												// }

											})
											.catch((err) => {
												Message("error", err)
											})
									}}
								>
									Save
								</button>
							</div>}
						</div> */}
						<div className="text-[#DA4167] text-lg font-bold">CCB Loan Details</div>

						<div>


							<DynamicTailwindTable
								data={
									ccbLoanDetails?.length
										? [
											{
												loan_id: ccbLoanDetails[0].loan_id,
												loan_acc_no: ccbLoanDetails[0].loan_acc_no,
												period: ccbLoanDetails[0].period,
												curr_roi: ccbLoanDetails[0].curr_roi,
												penal_roi: ccbLoanDetails[0].penal_roi,
												disb_dt: ccbLoanDetails[0].disb_dt,
												disb_amt: ccbLoanDetails[0].disb_amt,
												pay_mode: ccbLoanDetails[0].pay_mode,
												rep_start_dt: ccbLoanDetails[0].rep_start_dt,
												rep_end_dt: ccbLoanDetails[0].rep_end_dt,
												cuurent_loan_outstanding:
													ccbLoanDetails[0].cuurent_loan_outstanding,
												action: (
													<button
														onClick={() => {
															// navigate(
															// `/homepacs/loandetails/${ccbLoanDetails[0]?.loan_id}`
															// );
															navigate(`/homepacs/loandetails-branch-shg/${ccbLoanDetails[0]?.loan_id}`, {
																state: ccbLoanDetails[0]?.trans_details,
															})
														}}
														className="font-medium text-teal-500 hover:underline"
													>
														<EyeFilled />
													</button>
												),
											},
										]
										: []
								}
								// pageSize={50}
								// headersMap={disbursementDetailsHeader}
								pageSize={50}
								columnTotal={[6, 10]}
								// headersMap={disbursementDetailsHeader}
								headersMap={{
									...disbursementDetailsHeader_SOCIE,
									action: "Action", // ✅ only addition
								}}
							// dateTimeExceptionCols={[16]}
							// colRemove={[3, 5, 12]}
							/>

							{/* <DynamicTailwindTable
								data={groupData[0]?.disb_details?.map((el) => {
									//  console.log(el.loan_cycle, ' Loan Cycle');
									 const loanCycle = 'Loan Cycle - '+ el.loan_cycle; 
									 
									//  el.loan_cycle = loanCycle;
									//  console.log(el.week_no, ' Week No');
									// let recoveryWeekNoText = el.week_no;
									// if (+el.week_no === 1) {
									// recoveryWeekNoText = "Week (1-3)";
									// } else if (+el.week_no === 2) {
									// recoveryWeekNoText = "Week (2-4)";
									// }
									const recoveryWeekNoText = getWeekOfRecoveryName(el.week_no);

									const recoveryDayText = getFortnightDayName(el.recovery_day);
									

									 return {
										...el,
										// loan_cycle:loanCycle,
										// week_no: recoveryWeekNoText,
										// recovery_day: recoveryDayText,
									 };
								})}
								pageSize={50}
								columnTotal={[15, 17, 18]}
								headersMap={disbursementDetailsHeader}
								dateTimeExceptionCols={[16]}
								colRemove={[3, 5, 12]}
							/> */}
						</div>
						{/* purpose,scheme name,interest rate,period,period mode,fund name,total applied amount,total disbursement amount,disbursement date,current outstanding */}
						{loanAppData?.group_details[0]?.pacs_id!=111 && <><div className="text-[#DA4167] text-lg font-bold">Society Loan Details</div>

						<div>


							<DynamicTailwindTable
								data={
									groupData?.length
										? [
											{
												loan_id: groupData[0].loan_id,
												loan_acc_no: groupData[0].loan_acc_no,
												period: groupData[0].period,
												curr_roi: groupData[0].curr_roi,
												penal_roi: groupData[0].penal_roi,
												disb_dt: groupData[0].disb_dt,
												disb_amt: groupData[0].disb_amt,
												pay_mode: groupData[0].pay_mode,
												rep_start_dt: groupData[0].rep_start_dt,
												rep_end_dt: groupData[0].rep_end_dt,
												cuurent_loan_outstanding:
													groupData[0].cuurent_loan_outstanding,
												action: (
													<button
														onClick={() => {
															// navigate(
															// `/homepacs/loandetails/${groupData[0]?.loan_id}`
															// );
															navigate(`/homepacs/loandetails-branch-shg/${groupData[0]?.loan_id}`, {
																state: groupData[0]?.trans_details,
															})
														}}
														className="font-medium text-teal-500 hover:underline"
													>
														<EyeFilled />
													</button>
												),
											},
										]
										: []
								}
								// pageSize={50}
								// headersMap={disbursementDetailsHeader}
								pageSize={50}
								columnTotal={[6, 10]}
								// headersMap={disbursementDetailsHeader}
								headersMap={{
									...disbursementDetailsHeader_SOCIE,
									action: "Action", // ✅ only addition
								}}
							// dateTimeExceptionCols={[16]}
							// colRemove={[3, 5, 12]}
							/>

							{/* <DynamicTailwindTable
								data={groupData[0]?.disb_details?.map((el) => {
									//  console.log(el.loan_cycle, ' Loan Cycle');
									 const loanCycle = 'Loan Cycle - '+ el.loan_cycle; 
									 
									//  el.loan_cycle = loanCycle;
									//  console.log(el.week_no, ' Week No');
									// let recoveryWeekNoText = el.week_no;
									// if (+el.week_no === 1) {
									// recoveryWeekNoText = "Week (1-3)";
									// } else if (+el.week_no === 2) {
									// recoveryWeekNoText = "Week (2-4)";
									// }
									const recoveryWeekNoText = getWeekOfRecoveryName(el.week_no);

									const recoveryDayText = getFortnightDayName(el.recovery_day);
									

									 return {
										...el,
										// loan_cycle:loanCycle,
										// week_no: recoveryWeekNoText,
										// recovery_day: recoveryDayText,
									 };
								})}
								pageSize={50}
								columnTotal={[15, 17, 18]}
								headersMap={disbursementDetailsHeader}
								dateTimeExceptionCols={[16]}
								colRemove={[3, 5, 12]}
							/> */}
						</div>
</>}


						{params?.id > 0 && (
							<div className="gap-3">
								<div className="w-full my-5 border-t-4 border-gray-400 border-dashed"></div>
								<div>
									<div className="text-[#DA4167] text-lg mb-2 font-bold">
										Group Member Loan Details
									</div>

									{/* {JSON.stringify(memberData, 2)} */}


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
															Member Name
														</th>
														<th scope="col" className="px-6 py-3 font-semibold">
															Loan ID
														</th>
														<th scope="col" className="px-6 py-3 font-semibold">
															Member Code
														</th>
														<th scope="col" className="px-6 py-3 font-semibold">
															CCB Loan ID
														</th>
														<th scope="col" className="px-6 py-3 font-semibold">
															Outstanding
														</th>
														<th scope="col" className="px-6 py-3 font-semibold">Action </th>
													</tr>
												</thead>
												<tbody>
													{memberData?.map((item, i) => (
														<tr
															key={i}
															className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600"
														>
															<th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item?.member_name}</th>
															<td className="px-6 py-4">{item?.loan_id}</td>
															<td className="px-6 py-4">{item?.member_code}</td>
															<td className="px-6 py-4">{item?.ccb_loan_id}</td>
															<td className="px-6 py-4">{item?.member_outstanding}/-</td>
															<td className="px-6 py-4 text-right">
																<button
																	onClick={() => {
																		// navigate(
																		// 	`/homepacs/memberloandetails/${item?.loan_id}`
																		// )
																		navigate(`/homepacs/memberloandetails-branch-shg/${item?.loan_id}`, {
																			state: item,
																		})
																	}}
																	className="font-medium text-teal-500 dark:text-blue-500 hover:underline"
																>
																	<EyeFilled />
																</button>
															</td>
														</tr>
													))}
													<tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
														<td className="px-6 py-4 font-semibold" colSpan={4}>
															Total Outstanding
														</td>
														<td
															className="px-6 py-4 text-left font-semibold"
															colSpan={2}
														>
															{totalOutstanding.toFixed(2)}/-
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</Spin>
								</div>
							</div>
						)}
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
				</form>
			</Spin>
 <DialogBox
				flag={7}
				onPress={() => setVisible(!visible)}
				visible={visible}
				data={memDetails}
				onPressYes={() => {
					// editGroup()
					setVisible(!visible)
				}}
				onPressNo={() => setVisible(!visible)}
			/>
			{/* <DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {
					// editGroup()
					setVisible(!visible)
				}}
				onPressNo={() => setVisible(!visible)}
			/>

			<Modal
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

export default ViewBranchSHGLoanForm
