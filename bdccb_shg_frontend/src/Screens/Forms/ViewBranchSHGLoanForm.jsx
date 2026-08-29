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
	CheckCircleOutlined,
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
	const [ccbLoanModalOpen, setCcbLoanModalOpen] = useState(false)
	const [societyLoanModalOpen, setSocietyLoanModalOpen] = useState(false)

	const [currentPrincipal, setCurrentPrincipal] = useState("");
	const [currentInterest, setCurrentInterest] = useState("");
	const [closingLoan, setClosingLoan] = useState(false);

	const [memberCloseInputs, setMemberCloseInputs] = useState({});

	const handleMemberInputChange = (loanId, field, value) => {
		setMemberCloseInputs(prev => ({
			...prev,
			[loanId]: {
				...prev[loanId],
				[field]: value
			}
		}));
	};

	const handleMemberLoanClose = async (item) => {
		const prn = parseFloat(memberCloseInputs[item.loan_id]?.principal || 0);
		const intt = parseFloat(memberCloseInputs[item.loan_id]?.interest || 0);
		const totalEntered = prn + intt;
		const outstanding = parseFloat(item.member_outstanding || 0);

		if (totalEntered !== outstanding) {
			Modal.warning({
				title: 'Amount Mismatch',
				content: `The sum of Close Principal and Interest (₹${totalEntered}) does not match the Member Outstanding (₹${outstanding}).`,
				centered: true,
				okText: 'Got it',
			});
			return;
		}

		Modal.confirm({
			title: 'Confirm Member Loan Closure',
			content: `Are you sure you want to close the loan for ${item.member_name}?`,
			okText: 'Yes, Close Loan',
			cancelText: 'Cancel',
			onOk: async () => {
				setLoading(true);
				const creds = {
					loan_id: item.loan_id,
					group_code: item.group_code,
					curr_prn: prn,
					curr_intt: intt,
					tenant_id: userDetails[0]?.tenant_id || userDetails?.tenant_id,
					created_by: userDetails[0]?.emp_id || userDetails?.emp_id,
				};
				const tokenValue = await getLocalStoreTokenDts(navigate);

				try {
					const res = await axios.post(`${url_bdccb}/loanclose/close_loan_group`, creds, {
						headers: { Authorization: `${tokenValue.token}` }
					});
					if (res.data.success || res.data.suc === 1) {
						Message('success', 'Member loan has been closed successfully.');

						// Instantly update the UI to show 'Loan Closed' without reloading
						setMemberData(prev =>
							prev.map(member =>
								member.loan_id === item.loan_id
									? { ...member, acc_status: 'C', member_outstanding: 0 }
									: member
							)
						);

						// Clear the inputs for that member just in case
						setMemberCloseInputs(prev => ({
							...prev,
							[item.loan_id]: { principal: '', interest: '' }
						}));
					} else {
						Message('error', res.data.msg || "Failed to close member loan");
					}
				} catch (err) {
					console.error(err);
					Message('error', "An error occurred while closing the member loan.");
				} finally {
					setLoading(false);
				}
			}
		});
	};

	const handleCloseLoan = async () => {
		if (!currentPrincipal || !currentInterest) {
			Message("warning", "Please enter both Current Principal and Current Interest!");
			return;
		}

		const isSociety = window.location.pathname.includes('/homepacs');
		const targetLoanDetails = isSociety ? groupData : ccbLoanDetails;

		const principal = parseFloat(currentPrincipal) || 0;
		const interest = parseFloat(currentInterest) || 0;
		const outstanding = parseFloat(targetLoanDetails[0]?.cuurent_loan_outstanding) || 0;

		if (principal + interest !== outstanding) {
			Modal.warning({
				title: 'Amount Mismatch',
				content: `The sum of Current Principal and Interest (₹${principal + interest}) does not match the Total Outstanding (₹${outstanding}). Please correct the amounts before closing the loan.`,
				centered: true,
				okText: 'Got it',
			});
			return;
		}

		Modal.confirm({
			title: 'Confirm Loan Closure',
			content: 'Are you sure you want to close this loan? This action cannot be undone.',
			okText: 'Yes, Close Loan',
			cancelText: 'Cancel',
			onOk: async () => {
				setClosingLoan(true);
				const creds = {
					loan_id: targetLoanDetails[0]?.loan_id,
					loan_acc_no: targetLoanDetails[0]?.loan_acc_no,
					group_code: formik.values.g_code || params.id,
					curr_prn: currentPrincipal,
					curr_intt: currentInterest,
					tenant_id: userDetails[0]?.tenant_id,
					branch_id: userDetails[0]?.brn_code,
					created_by: userDetails[0]?.emp_id,
				};

				const isSociety = window.location.pathname.includes('/homepacs');
				const isGroup = window.location.pathname.includes('loancloseflag-group');
				const endpoint = isGroup ? '/loanclose/close_loan_group' : (isSociety ? '/loanclose/close_loan_society' : '/loanclose/close_loan_ccb');

				const tokenValue = await getLocalStoreTokenDts(navigate);

				try {
					const res = await axios.post(`${url_bdccb}${endpoint}`, creds, {
						headers: {
							Authorization: `${tokenValue?.token}`,
							"Content-Type": "application/json",
						},
					});

					if (res?.data?.success) {
						Message("success", "Loan closed successfully!");
						// Reset inputs
						setCurrentPrincipal("");
						setCurrentInterest("");
						setTimeout(() => {
							window.location.reload();
						}, 1500);
					} else {
						Message("error", res?.data?.msg || "Failed to close loan");
					}
				} catch (err) {
					Message("error", "Some error occurred while closing loan...");
					console.log("ERR", err);
				} finally {
					setClosingLoan(false);
				}
			}
		});
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
			tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id,
			branch_code: userDetails?.[0]?.brn_code || userDetails?.brn_code,
			group_code: loanAppData?.group_code,
			society_acc_no: loanAppData?.group_details?.[0]?.society_acc_no,
			branch_type: userDetails?.[0]?.branch_type || userDetails?.branch_type
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
				if (res?.data?.success && res?.data?.data?.length > 0) {
					setGroupData(res?.data?.data)
					if (res?.data?.data[0]?.loan_id) {
						fetchLoanMemberDetails(res?.data?.data[0]?.loan_id)
					}
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
		if (!loan_id) return;
		setLoading(true)
		const creds = {
			// group_code: params?.id,
			loan_id: loan_id,
			tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id,
			// branch_code: userDetails[0]?.brn_code,
			branch_code: userDetails?.[0]?.brn_code || userDetails?.brn_code,
			group_code: loanAppData?.group_code,
			loan_acc_no: loanAppData?.loan_acc_no,
			///////
			society_acc_no: loanAppData?.group_details?.[0]?.society_acc_no,
			branch_type: userDetails?.[0]?.branch_type || userDetails?.branch_type,
			pacs_id: loanAppData?.group_details?.[0]?.pacs_id
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
			g_group_name: loanAppData?.group_details?.[0]?.group_name,
			g_branch_name: loanAppData?.group_details?.[0]?.branch_name,
			pacs_name: loanAppData?.group_details?.[0]?.pacs_name,
			sahayika_name: loanAppData?.group_details?.[0]?.sahayika_name,
			g_phone1: loanAppData?.group_details?.[0]?.phone1,
			g_address: loanAppData?.group_details?.[0]?.group_addr,
			dist_name: loanAppData?.group_details?.[0]?.dist_name,
			g_group_block: loanAppData?.group_details?.[0]?.block_name,
			ps_name: loanAppData?.group_details?.[0]?.ps_name,
			post_name: loanAppData?.group_details?.[0]?.post_name,
			gp_name: loanAppData?.group_details?.[0]?.gp_name,
			vill_name: loanAppData?.group_details?.[0]?.vill_name,
			pin_no: loanAppData?.group_details?.[0]?.pin_no,
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
	const ccbloandetails = async () => {
		setLoading(true)

		const isViewLoanBranchShg = window.location.pathname.includes('/homepacs/viewloan-branch-shg') || (location.pathname && location.pathname.includes('viewloan-branch-shg'));

		const creds = {
			tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id,
			branch_id: userDetails?.[0]?.brn_code || userDetails?.brn_code,
			group_code: loanAppData?.group_code,
			pacs_id: loanAppData?.group_details?.[0]?.pacs_id,
			loan_acc_no: loanAppData?.loan_acc_no,
			//////
			branch_type: isViewLoanBranchShg ? 'B' : (window.location.pathname.includes('/homepacs') ? 'P' : (location.pathname.includes('loancloseflag-group') ? 'BP' : (userDetails?.[0]?.branch_type || userDetails?.branch_type))),
			society_acc_no: loanAppData?.group_details?.[0]?.society_acc_no
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
				if (res?.data?.success && res?.data?.data?.length > 0) {
					setCcbLoanDetails(res?.data?.data)
					if (res?.data?.data[0]?.loan_id) {
						fetchLoanMemberDetails(res?.data?.data[0]?.loan_id)
					}
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
		console.log(userDetails?.[0]?.user_type || userDetails?.user_type, 'gggggggggggggggggggg');

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


	const activeLoanDetails = location.pathname.includes('/homepacs') ? groupData : ccbLoanDetails;

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
						<div className={`grid gap-4 ${location.pathname.includes('loancloseflag') && location.pathname.includes('groupdetails') ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} sm:gap-6`}>
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

							<div className={location.pathname.includes('loancloseflag') && location.pathname.includes('groupdetails') ? "sm:col-span-3" : "sm:col-span-2"}>
								<TDInputTemplateBr
									placeholder="Type Address..."
									type="text"
									label={location.pathname.includes('loancloseflag') && location.pathname.includes('groupdetails') ? "Address" : "Address and PIN"}
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
								<button onClick={() => setVisible(true)} className="disabled:bg-gray-400 disabled:dark:bg-gray-400 inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-emerald-600 hover:bg-emerald-700 transition duration-300 rounded-md focus:ring-gray-600 dark:focus:ring-primary-900 dark:bg-[#22543d] dark:hover:bg-gray-600 shadow-sm">View Member Details</button>
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
						{location.pathname.includes('loancloseflag/groupdetails') ? (
							<>
								<div className="w-full my-2 border-t-4 border-gray-400 border-dashed"></div>
								<div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm my-2">
									<div className="flex flex-col">
										<span className="text-[#DA4167] text-lg font-bold">
											CCB Loan Details
										</span>
										<span className="text-sm text-gray-500 dark:text-gray-400">Click to view complete loan and transaction history</span>
									</div>
									<button
										type="button"
										onClick={() => setCcbLoanModalOpen(true)}
										className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition duration-300 shadow-md"
									>
										View Details
									</button>
								</div>

								<Modal
									title={<div className="text-[#DA4167] text-xl font-bold border-b pb-2">
										CCB Loan Details
									</div>}
									open={ccbLoanModalOpen}
									onCancel={() => setCcbLoanModalOpen(false)}
									footer={null}
									width={"90vw"}
									style={{ top: 20 }}
								>
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
														},
													]
													: []
											}
											pageSize={50}
											columnTotal={[6, 10]}
											headersMap={disbursementDetailsHeader_SOCIE}
										/>
										<div className="text-[#DA4167] text-lg font-bold mt-8 mb-4">Transaction Details</div>
										<DynamicTailwindTable
											data={
												ccbLoanDetails?.[0]?.trans_details?.map(item => ({
													trans_id: item.trans_id,
													trans_dt: item.trans_dt ? moment(item.trans_dt).format("DD-MM-YYYY") : "--",
													trans_type: item.trans_type == 'D' ? 'Disbursement' : item.trans_type == 'I' ? 'Interest' : item.trans_type == 'R' ? 'Recovery' : item.trans_type,
													dr_amt: item.dr_amt || 0,
													cr_amt: item.cr_amt || 0,
													outstanding: item.outstanding || 0,
													approval_status: item.approval_status == "U" ? "Unapproved" : item.approval_status == "A" ? "Approved" : "Rejected"
												})) || []
											}
											pageSize={50}
											headersMap={{
												trans_id: "Trans. ID",
												trans_dt: "Trans. Date",
												trans_type: "Trans. Type",
												dr_amt: "Debit Amt.",
												cr_amt: "Credit Amt.",
												outstanding: "Outstanding",
												approval_status: "Status"
											}}
										/>
									</div>
								</Modal>

								{/* Society Loan Details (Only for PACS) */}
								{window.location.pathname.includes('/homepacs') && (
									<>
										<div className="w-full my-2 border-t-4 border-gray-400 border-dashed"></div>
										<div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm my-2">
											<div className="flex flex-col">
												<span className="text-[#DA4167] text-lg font-bold">
													Society Loan Details
												</span>
												<span className="text-sm text-gray-500 dark:text-gray-400">Click to view complete loan and transaction history</span>
											</div>
											<button
												type="button"
												onClick={() => setSocietyLoanModalOpen(true)}
												className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition duration-300 shadow-md"
											>
												View Details
											</button>
										</div>

										<Modal
											title={<div className="text-[#DA4167] text-xl font-bold border-b pb-2">
												Society Loan Details
											</div>}
											open={societyLoanModalOpen}
											onCancel={() => setSocietyLoanModalOpen(false)}
											footer={null}
											width={"90vw"}
											style={{ top: 20 }}
										>
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
																},
															]
															: []
													}
													pageSize={50}
													columnTotal={[6, 10]}
													headersMap={disbursementDetailsHeader_SOCIE}
												/>
												<div className="text-[#DA4167] text-lg font-bold mt-8 mb-4">Transaction Details</div>
												<DynamicTailwindTable
													data={
														groupData?.[0]?.trans_details?.map(item => ({
															trans_id: item.trans_id,
															trans_dt: item.trans_dt ? moment(item.trans_dt).format("DD-MM-YYYY") : "--",
															trans_type: item.trans_type == 'D' ? 'Disbursement' : item.trans_type == 'I' ? 'Interest' : item.trans_type == 'R' ? 'Recovery' : item.trans_type,
															dr_amt: item.dr_amt || 0,
															cr_amt: item.cr_amt || 0,
															outstanding: item.outstanding || 0,
															approval_status: item.approval_status == "U" ? "Unapproved" : item.approval_status == "A" ? "Approved" : "Rejected"
														})) || []
													}
													pageSize={50}
													headersMap={{
														trans_id: "Trans. ID",
														trans_dt: "Trans. Date",
														trans_type: "Trans. Type",
														dr_amt: "Debit Amt.",
														cr_amt: "Credit Amt.",
														outstanding: "Outstanding",
														approval_status: "Status"
													}}
												/>
											</div>
										</Modal>
									</>
								)}
							</>
						) : location.pathname.includes('loancloseflag-group/groupdetails') ? null : (
							<>
								<div className="w-full my-5 border-t-4 border-gray-400 border-dashed"></div>
								<div className="text-[#DA4167] text-lg font-bold mb-4">CCB Loan Details</div>
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
										pageSize={50}
										columnTotal={[6, 10]}
										headersMap={{
											...disbursementDetailsHeader_SOCIE,
											action: "Action",
										}}
									/>
								</div>
							</>
						)}
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
						{/* purpose,scheme name,interest rate,period,period mode,fund name,total applied amount,total disbursement amount,disbursement date,current outstanding */}
						{(!(location.pathname.includes('loancloseflag') && location.pathname.includes('groupdetails')) && loanAppData?.group_details[0]?.pacs_id != 111) && <><div className="text-[#DA4167] text-lg font-bold">Society Loan Details</div>

							<div>


								<DynamicTailwindTable
									data={
										groupData?.length
											? [
												{
													branch_shg_name: groupData[0].branch_shg_name,
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
									columnTotal={[7, 11]}
									// headersMap={disbursementDetailsHeader}
									headersMap={{
										branch_shg_name: "Society Name",
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
										Group Member Loan Details {(params?.id || loanAppData?.group_code) && (formik.values.g_group_name || loanAppData?.group_name)
											? `(${params?.id || loanAppData?.group_code} - ${formik.values.g_group_name || loanAppData?.group_name})`
											: (params?.id || loanAppData?.group_code || formik.values.g_group_name || loanAppData?.group_name)
											? `(${params?.id || loanAppData?.group_code || formik.values.g_group_name || loanAppData?.group_name})`
											: ""}
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
														<th scope="col" className="px-6 py-3 font-semibold text-center">Action </th>
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
															<td className="px-6 py-4 font-bold text-gray-700">₹ {item?.member_outstanding}</td>

															<td className="px-6 py-4 text-center flex items-center justify-center gap-3">
																<button
																	type="button"
																	onClick={() => {
																		navigate(`/homepacs/memberloandetails-branch-shg/${item?.loan_id}`, {
																			state: item,
																		})
																	}}
																	className="font-medium text-teal-600 hover:text-teal-700 dark:text-blue-500 hover:underline flex items-center gap-1 transition-colors"
																>
																	<EyeFilled /> View Trans
																</button>
																{location.pathname.includes('loancloseflag-group') && (
																	item.acc_status === 'C' ? (
																		<span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300 ml-4">Loan Closed</span>
																	) : (
																		<div className="flex items-center gap-2 ml-4">
																			<input
																				type="number"
																				placeholder="Principal"
																				className="w-32 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2 transition-all shadow-inner"
																				value={memberCloseInputs[item.loan_id]?.principal || ''}
																				onChange={(e) => handleMemberInputChange(item.loan_id, 'principal', e.target.value)}
																			/>
																			<input
																				type="number"
																				placeholder="Interest"
																				className="w-32 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2 transition-all shadow-inner"
																				value={memberCloseInputs[item.loan_id]?.interest || ''}
																				onChange={(e) => handleMemberInputChange(item.loan_id, 'interest', e.target.value)}
																			/>
																			<button
																				type="button"
																				onClick={() => handleMemberLoanClose(item)}
																				disabled={!memberCloseInputs[item.loan_id]?.principal && !memberCloseInputs[item.loan_id]?.interest}
																				className="text-white bg-[#DA4167] hover:bg-[#c03558] focus:ring-2 focus:ring-red-300 font-semibold rounded-lg text-sm px-5 py-2 shadow-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
																			>
																				Close Loan
																			</button>
																		</div>
																	)
																)}
															</td>
														</tr>
													))}
													<tr className="bg-slate-50 border-b dark:bg-gray-800 dark:border-gray-700">
														<td className="px-6 py-4 font-bold text-gray-800" colSpan={4}>
															Total Outstanding
														</td>
														<td
															className="px-6 py-4 text-left font-bold text-[#DA4167]"
															colSpan={location.pathname.includes('loancloseflag-group') ? 4 : 2}
														>
															₹ {totalOutstanding.toFixed(2)}
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</Spin>
								</div>
							</div>
						)}

						{/* Final Loan Settlement Block */}
						{location.pathname.includes('loancloseflag/groupdetails') && (
							<div className="gap-3">
								<div className="w-full my-5 border-t-4 border-gray-400 border-dashed"></div>
								<div className="bg-emerald-50 dark:bg-gray-800 p-6 rounded-xl border border-emerald-200 dark:border-gray-700 shadow-sm mt-6">
									<div className="flex justify-between items-center mb-6">
										<h3 className="text-[#DA4167] text-xl font-bold">Final Loan Settlement</h3>
									</div>

									{/* Summary Cards */}
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
										<div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-emerald-100 dark:border-gray-600">
											<p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Loan ID</p>
											<p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{activeLoanDetails?.[0]?.loan_id || "N/A"}</p>
										</div>
										<div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-emerald-100 dark:border-gray-600">
											<p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Account No.</p>
											<p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{activeLoanDetails?.[0]?.loan_acc_no || "N/A"}</p>
										</div>
										<div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-emerald-100 dark:border-gray-600">
											<p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Current Principal</p>
											<p className="text-lg font-bold text-gray-800 dark:text-white mt-1">₹ {activeLoanDetails?.[0]?.curr_prn || "0.00"}</p>
										</div>
										<div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-emerald-100 dark:border-gray-600">
											<p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Current Interest</p>
											<p className="text-lg font-bold text-gray-800 dark:text-white mt-1">₹ {activeLoanDetails?.[0]?.curr_intt || "0.00"}</p>
										</div>
									</div>

									<hr className="border-emerald-200 dark:border-gray-600 mb-6" />

									{/* Settlement Action Area */}
									{activeLoanDetails?.[0]?.acc_status !== 'C' ? (
										<div className="flex flex-col md:flex-row gap-6 items-end justify-between bg-white dark:bg-gray-700 p-5 rounded-xl border border-emerald-100 dark:border-gray-600 shadow-sm">
											<div className="flex-1">
												<label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Total Outstanding</label>
												<div className="text-xl font-bold text-[#DA4167] p-3 pl-0">
													₹ {activeLoanDetails?.[0]?.cuurent_loan_outstanding || "0.00"}
												</div>
											</div>

											<div className="flex-1">
												<label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Close Principal</label>
												<input
													type="number"
													value={currentPrincipal}
													onChange={(e) => setCurrentPrincipal(e.target.value)}
													placeholder="Enter Principal"
													className="w-full p-3 font-bold text-lg text-gray-900 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors"
												/>
											</div>
											<div className="flex-1">
												<label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Close Interest</label>
												<input
													type="number"
													value={currentInterest}
													onChange={(e) => setCurrentInterest(e.target.value)}
													placeholder="Enter Interest"
													className="w-full p-3 font-bold text-lg text-gray-900 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors"
												/>
											</div>

											<div>
												<button
													type="button"
													onClick={handleCloseLoan}
													disabled={closingLoan || activeLoanDetails?.length === 0 || !currentPrincipal || !currentInterest}
													className="px-8 py-3 text-base bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition duration-300 shadow-md flex items-center justify-center gap-2 w-full md:w-auto h-[52px]"
												>
													{closingLoan ? <LoadingOutlined /> : null}
													Close Loan
												</button>
											</div>
										</div>
									) : (
										<div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-gray-700 p-8 rounded-xl border border-emerald-200 dark:border-gray-600 shadow-sm text-center">
											<div className="text-emerald-500 mb-2">
												<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
												</svg>
											</div>
											<h4 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">Loan Closed Successfully</h4>
											<p className="text-gray-600 dark:text-gray-300 mt-2">There is no outstanding balance remaining on this loan account.</p>
										</div>
									)}
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
			<Modal
				title={<div className="text-[#DA4167] text-xl font-bold border-b pb-2">Group Member Details</div>}
				open={visible}
				onCancel={() => setVisible(false)}
				footer={null}
				width={"95vw"}
				style={{ top: 20 }}
			>
				<div className="relative overflow-x-auto mt-4">
					<table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead className="text-xs text-white uppercase bg-slate-800 dark:bg-gray-700 dark:text-gray-400">
							<tr>
								<th scope="col" className="px-6 py-3 font-semibold">Member Code</th>
								<th scope="col" className="px-6 py-3 font-semibold">Member Name</th>
								<th scope="col" className="px-6 py-3 font-semibold">Gender</th>
								<th scope="col" className="px-6 py-3 font-semibold">Caste</th>
								<th scope="col" className="px-6 py-3 font-semibold">Account No.</th>
								<th scope="col" className="px-6 py-3 font-semibold">Aadhar No.</th>
								<th scope="col" className="px-6 py-3 font-semibold">IFSC</th>
								<th scope="col" className="px-6 py-3 font-semibold">Guardian</th>
								<th scope="col" className="px-6 py-3 font-semibold">Address</th>
								<th scope="col" className="px-6 py-3 font-semibold">Phone No.</th>
								<th scope="col" className="px-6 py-3 font-semibold">Group Designation</th>
								<th scope="col" className="px-6 py-3 font-semibold">Religion</th>
							</tr>
						</thead>
						<tbody>
							{memDetails?.map((item, i) => (
								<tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600">
									<th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
										{item?.member_code}
									</th>
									<td className="px-6 py-4">{item?.member_name}</td>
									<td className="px-6 py-4">{item?.gender === 'M' ? 'Male' : 'Female'}</td>
									<td className="px-6 py-4">{item?.caste}</td>
									<td className="px-6 py-4">{item?.member_account_no}</td>
									<td className="px-6 py-4">{item?.aadhar_no}</td>
									<td className="px-6 py-4">{item?.ifsc}</td>
									<td className="px-6 py-4">{item?.gurdian_name}</td>
									<td className="px-6 py-4">{item?.address}</td>
									<td className="px-6 py-4">{item?.phone_no}</td>
									<td className="px-6 py-4">
										{item?.gp_leader_flag === 'Y' ? 'Leader' : item?.asst_gp_leader_flag === 'Y' ? 'Asst. Leader' : 'Member'}
									</td>
									<td className="px-6 py-4">{item?.religion}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Modal>
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
