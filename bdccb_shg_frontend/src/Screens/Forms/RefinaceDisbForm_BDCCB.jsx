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
	CheckCircleFilled,
	ClockCircleFilled,
	SyncOutlined,
	UsergroupAddOutlined,
	UserOutlined,
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
// import { formatDateToYYYYMMDD } from "../../Utils/formateDate"


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


function RefinaceDisbForm_BDCCB({ flag }) {


	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const loanAppData = location.state || {}
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
	const [SHGList, setSHGList] = useState([]);
	const [MemberList, setMemberList] = useState([]);
	const [remainDisburseAmt, setRemainDisburseAmt] = useState(null);
	const [groupMemberTotal, setGroupMemberTotal] = useState();
	const [memberOptions, setMemberOptions] = useState({});
	const [checkDuplicateGroup, setCheckDuplicateGroup] = useState({})
	const [checkDuplicateMember, setCheckDuplicateMember] = useState({})

	const initialValues = {
		// loan_id: "",
		loan_ac_no: "",
		loan_to: "",
		branch_shg_id: "",

		branch_shg_SearchField: "", /// Not

		period: "",
		curr_roi: "",
		over_roi: "",
		disb_dt: "",
		sanction_dt: "",
		sanction_no: "",
		disb_amt: "",
		group_total: "",
		// member_total: "",
		// pay_mode: "",
		rows: [
			{
				mem_loan_id: "",
				sb_acc_no: "",
				shg_id: "",
				member_id: "",
				amount: "",
				group_name: '',
				member_name: ''
			},
		],
	}
	const [formValues, setValues] = useState(initialValues)


	const validationSchema = Yup.object({
		// loan_id: Yup.string().required("Loan ID is required"),
		loan_ac_no: Yup.string().required("Loan Account No. is required"),
		// loan_to: Yup.string().required("Loan To is required"),
		loan_to: Yup.string(),
		branch_shg_id: Yup.string().required("Select PACS or SHG is required"),
		period: Yup.string().required("Period is required"),
		curr_roi: Yup.mixed().required("Current Rate Of Intarest is required"),
		over_roi: Yup.mixed().required("Overdue Rate Of Intarest is required"),
		// sanction_dt: Yup.mixed().required("Sanction Date is required"),
		sanction_no: Yup.mixed().required("Sanction No is required"),
		// disb_dt: Yup.mixed().required("Disbursement Date is required"),
		sanction_dt: Yup.date()
			.required("Sanction Date is required"),
		disb_dt: Yup.date()
			.required("Disbursement Date is required")
			.min(
				Yup.ref("sanction_dt"),
				"Disbursement Date must be greater than or equal to Sanction Date"
			),

		disb_amt: Yup.number()
			.typeError("Disbursement Amount must be a number")
			.required("Disbursement Amount is required")
			.positive("Disbursement Amount must be greater than 0"),
		approved_by: '',
		approved_dt: '',
		group_total: Yup.mixed().required("Group Total Of Intarest is required"),
		// member_total: Yup.mixed().required("Member Total Of Intarest is required"),
		rows: Yup.array()
			.of(
				Yup.object({
					sb_acc_no: Yup.string()
						.required("Account number is required"),

					shg_id: Yup.string()
						.required("SHG is required"),

					member_id: Yup.string()
						.typeError("No. of Group must be a number")
						.required("No. of Group is required")
						.min(1, "Must be at least 1"),

					amount: Yup.number()
						.typeError("Amount must be a number")
						.required("Amount is required")
						.min(1, "Amount must be greater than 0"),
				})
			)
			.min(1, "At least one row is required"),

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

		// setVisible(true)
		// if (params?.id > 0) {
		// 	editGroup(values)
		// }
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
		if (params.id > 0) {
			fetchDisburseDetails()
		}
	}, [])




	const fetchDisburseDetails = async () => {

		const formattedRows = loanAppData?.members?.map(row => ({
			mem_loan_id: row.mem_loan_id || "",
			sb_acc_no: row.sb_acc_no || "",
			shg_id: row.group_code || "",
			member_id: row.member_id || "",
			amount: row.disburse_amt || "",
			group_name: row.group_name || "",
			member_name: row.member_name || "",
		}));

		// group_code: row.branch_shg_id,
		// member_id: row.member_id,

		setValues({
			loan_ac_no: loanAppData?.loan_acc_no,
			loan_to: loanAppData?.loan_to,
			branch_shg_id: loanAppData?.loan_to_name,
			branch_shg_SearchField: '',
			period: loanAppData?.period,
			curr_roi: loanAppData?.curr_roi,
			over_roi: loanAppData?.over_roi,
			sanction_no: loanAppData?.sanction_no,
			disb_dt: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.disb_dt)),
			sanction_dt: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.sanction_dt)),
			disb_amt: loanAppData?.disb_amt,
			approved_by: loanAppData?.approved_by,
			approved_dt: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.approved_dt)),
			group_total: loanAppData?.tot_grp,

			// 🔥 THIS IS IMPORTANT
			rows: formattedRows.length > 0
				? formattedRows
				: [{
					sb_acc_no: "",
					shg_id: "",
					member_id: "",
					amount: "",
				}],
		});
	};




	const editGroup = async (formData) => {
		if (formik.values.rows.reduce((sum, r) => sum + Number(r.amount || 0), 0) > Number(formik.values.disb_amt)) {
			return Message("error", "Total Amount Greater Than Disbursement Amount")
		}
		// return;
		const formattedRows = formData?.rows?.map(row => ({
			mem_loan_id: row.mem_loan_id,
			group_code: row.shg_id,
			member_id: row.member_id,
			disburse_amt: Number(row.amount),
		}))

		setLoading(true)

		const ip = await getClientIP()

		const creds = {
			loan_id: loanAppData?.loan_id,
			// tran_id: 0,
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			loan_acc_no: formData?.loan_ac_no,
			loan_to: 'P',
			branch_shg_id: loanAppData?.branch_shg_id,
			period: formData?.period,
			curr_roi: formData?.curr_roi,
			penal_roi: formData?.over_roi,
			disb_dt: formData?.disb_dt,
			tot_grp: formData?.group_total,
			sanction_no: formData?.sanction_no,
			sanction_dt: formData?.sanction_dt,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
			// disb_amt: formData?.disb_amt,
			members_refinance: formattedRows,
		}

		// console.log(formData, 'formDataformDataformDataformData', creds);

		// return;

		await saveMasterData({
			endpoint: "refinance/save_refinance_disburse",
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

		if (formik.values.rows.reduce((sum, r) => sum + Number(r.amount || 0), 0) > Number(formik.values.disb_amt)) {
			return Message("error", "Total Amount Greater Than Disbursement Amount")
		}
		const formattedRows = formData?.rows?.map(row => ({
			mem_loan_id: 0,
			group_code: row.shg_id,
			member_id: row.member_id,
			disburse_amt: Number(row.amount),
		}))

		setLoading(true)

		const ip = await getClientIP()

		const creds = {
			loan_id: 0,
			// tran_id: 0,
			tenant_id: userDetails[0]?.tenant_id,
			loan_acc_no: formData?.loan_ac_no,
			loan_to: 'P',
			branch_shg_id: formData?.branch_shg_id,
			period: formData?.period,
			curr_roi: formData?.curr_roi,
			penal_roi: formData?.over_roi,
			disb_dt: formData?.disb_dt,
			tot_grp: formData?.group_total,
			sanction_no: formData?.sanction_no,
			sanction_dt: formData?.sanction_dt,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
			members_refinance: formattedRows,

			// branch_id: userDetails[0]?.brn_code,
			// disb_amt: formData?.disb_amt,
			
		}

		console.log(formData, 'formDataformDataformDataformData', creds);

		// return

		await saveMasterData({
			endpoint: "refinance/save_refinance_disburse",
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

	useEffect(() => {

		console.log(userDetails[0]?.brn_code, 'vvvvvvvvvvvvvvvvv', userDetails[0]?.branch_name);
		
		// if (params.id < 1) {
		// 	formik.setFieldValue("branch_shg_SearchField", "");
		// 	formik.setFieldValue("branch_shg_id", "");
		// 	setPACS_SHGList([])
		// }

		setPACS_SHGList([{
		code: userDetails[0]?.brn_code,
		name: userDetails[0]?.branch_name,
		}])
		formik.setFieldValue("branch_shg_id", userDetails[0]?.brn_code)

	}, [])
	// }, [formik.values.loan_to])





	useEffect(() => {
		const currRoi = Number(formik.values.curr_roi);

		if (!isNaN(currRoi) && currRoi !== "") {
			// console.log(formik.values.curr_roi, 'ccccccccccc');
			if (formik.values.curr_roi > 0) {
				formik.setFieldValue("over_roi", currRoi + 2);
			}
		}
	}, [formik.values.curr_roi]);

	// useEffect(() => {
	// 	handleSearchPacsChange()
	// }, []);





	// const handleSearchPacsChange = async (value) => {

	// 	setPACS_SHGList([])
	// 	setLoading(true)

	// 	const creds = {
	// 		loan_to: 'P',
	// 		branch_code: userDetails[0]?.brn_code,
	// 		branch_shg_id: '',
	// 		tenant_id: userDetails[0]?.tenant_id,
	// 	}

	// 	const tokenValue = await getLocalStoreTokenDts(navigate);

	// 	await axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
	// 		headers: {
	// 			Authorization: `${tokenValue?.token}`, // example header
	// 			"Content-Type": "application/json", // optional
	// 		},
	// 	})
	// 		.then((res) => {

	// 			if (res?.data?.success) {

	// 				console.log(creds, 'credscredscredscreds', res?.data?.data);


	// 				if (userDetails[0]?.user_type == 'B') {
	// 					setPACS_SHGList(res?.data?.data?.map((item, i) => ({
	// 						code: item?.branch_id,
	// 						name: item?.branch_name,
	// 					})))
	// 				}

	// 				// if(formik.values.loan_to == "S" || loanAppData?.loan_to == "S"){
	// 				if (userDetails[0]?.user_type == 'P') {
	// 					setPACS_SHGList(res?.data?.data?.map((item, i) => ({
	// 						code: item?.group_code,
	// 						name: item?.group_name,
	// 					})))
	// 				}

	// 				// if(res?.data?.data.length > 0){
	// 				// 	Message("success", res?.data?.msg)
	// 				// } else {
	// 				// 	Message("error", res?.data?.msg)
	// 				// }


	// 			} else {
	// 				navigate(routePaths.LANDING)
	// 				localStorage.clear()
	// 			}
	// 		})
	// 		.catch((err) => {
	// 			Message("error", "Some error occurred while fetching group form")
	// 		})

	// 	setLoading(false)
	// };


	const handleSearchSHGChange = async (value, branch_shg_id, index) => {

		if (value.length < 3) {
			// Message("error", "Minimum type 3 character")
			return;
		}
		setPACS_SHGList([])
		setLoading(true)


		const creds = {
			loan_to: 'S',
			branch_code: branch_shg_id,
			branch_shg_id: value,
			tenant_id: 0,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				if (res?.data?.success) {

					console.log(res?.data?.data, 'credscredscredscreds____', creds);


					// if(userDetails[0]?.user_type == 'B'){
					// setSHGList(res?.data?.data?.map((item, i) => ({
					// code: item?.branch_id,
					// name: item?.branch_name,
					// })))
					// }

					// if(userDetails[0]?.user_type == 'P'){
					setSHGList(res?.data?.data?.map((item, i) => ({
						code: item?.group_code,
						name: item?.group_name,
						pacs_id: item?.pacs_id,
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


	const fetchGroupBySB = async (sb_acc_no, index) => {

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/group/fetch_grp_dtls_memb_acc`, {
			params: {
				member_account_no: sb_acc_no, branch_code: formik.values.branch_shg_id, org_type: 'P'
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			}
		}).then((res) => {

			if (res?.data?.success) {

				const groupList = res.data.data;

				if (userDetails[0]?.user_type == 'B') {
					setSHGList(res?.data?.data?.map((item, i) => ({
						code: item?.group_code,
						name: item?.group_name,
					})))
				}
			} else {
				// Message('error', res?.data?.msg)
				// navigate(routePaths.LANDING)
				// localStorage.clear()
			}

		})
			.catch((err) => {
				Message("error", "Some error occurred while fetching data!")
				console.log("ERRR", err)
			})

	};



	useEffect(() => {
		if (Number(params?.id) > 0) {
			formik.values.rows.forEach((row, index) => {
				// console.log(row, 'rowwwwwwwwwwwwwwwwwww');

				if (row.shg_id) {
					fetchGroupData(row.shg_id, index); // mmust be go pacsId 
				}
			});
		}
	}, [formik.values.rows]);


	const fetchGroupData = async (value, rowIndex, pacsId, sb_acc_no) => {
		// console.log(value, 'valueeeeeeeeeeeeeeeeeeeeeeee');

		const groups = [...formik.values.rows];

		// 🔴 DUPLICATE CHECK INSIDE FORM
		const isDuplicate = groups.some(
			(m, i) => i !== rowIndex && m.shg_id === value
		);

		if (isDuplicate) {
			// set error message for this row
			setCheckDuplicateGroup(prev => ({
				...prev,
				[rowIndex]: {
					user_status: 1,
					msg: "Duplicate Group Name",
				},
			}));
		} else {
			// clear duplicate message
			setCheckDuplicateGroup(prev => {
				const copy = { ...prev };
				delete copy[rowIndex];
				return copy;
			});

			// call API only if 12 digits and not duplicate
			// if (value.length > 0) {
			//   checkSBAccNoExists(value, index);
			// }
		}


		setLoading(true)
		const creds = {
			branch_code: pacsId,
			group_code: value,
			tenant_id: userDetails[0]?.tenant_id,
			member_account_no: sb_acc_no
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/loan/fetch_member_name`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				if (res?.data?.success) {
					console.log(res?.data?.data, 'valueeeeeeeeeeeeeeeeeeeeeeee', creds);
					// const totMemb = Number(res.data.data);
					// const totMemb = res.data.data;

					// // 🔥 SET VALUE INTO THAT ROW
					// formik.setFieldValue(
					// 	`rows[${rowIndex}].member_id`,
					// 	totMemb
					// );
					const members = res.data.data;

					// ⭐ Save members for this row
					setMemberOptions((prev) => ({
						...prev,
						[rowIndex]: members,
					}));

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


	const checkDuplicateMember_FN = async (value, rowIndex) => {
		// console.log(value, 'valueeeeeeeeeeeeeeeeeeeeeeee');

		const groups = [...formik.values.rows];

		// 🔴 DUPLICATE CHECK INSIDE FORM
		const isDuplicate = groups.some(
			(m, i) => i !== rowIndex && m.member_id === value
		);

		if (isDuplicate) {
			// set error message for this row
			setCheckDuplicateMember(prev => ({
				...prev,
				[rowIndex]: {
					user_status: 1,
					msg: "Duplicate Member Name",
				},
			}));
		} else {
			// clear duplicate message
			setCheckDuplicateMember(prev => {
				const copy = { ...prev };
				delete copy[rowIndex];
				return copy;
			});

			// call API only if 12 digits and not duplicate
			// if (value.length > 0) {
			//   checkSBAccNoExists(value, index);
			// }
		}

	};


	return (
		<>
			<section className=" dark:bg-[#001529] flex justify-center align-middle p-5">
				<div className="p-5 w-4/5 min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader text={`${params?.id == 0 ? "Add Re-Finace Disbursement" : loanAppData?.approval_status == 'A' ? "View Re-Finace Disbursement" : "Edit/Preview Re-Finace Disbursement"}`} mode={2} />
					</div>

					<Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					>

						{/* {JSON.stringify(formik, 2)} //
						{JSON.stringify(formValues, 2)}  */}
						{/* {JSON.stringify(loanAppData, null, 2)} */}
						<div className="card shadow-lg bg-white border-2 p-5 mx-16 rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
							{loanAppData?.approval_status == 'A' && (<div className="accept_dis"><CheckCircleFilled style={{ color: "#fff", marginRight: 6 }} />
								Disbursement Accepted </div>)}
							{loanAppData?.approval_status == 'U' && (<div className="pending_dis"><SyncOutlined style={{ color: "#fff", marginRight: 6 }} />
								Disbursement Pending </div>)}
							{loanAppData?.approval_status == 'R' && (<div className="pending_dis"><CloseCircleOutlined style={{ color: "#fff", marginRight: 6 }} />
								Disbursement Rejected </div>)}
							<form onSubmit={formik.handleSubmit}>
								<div className="flex justify-start gap-5">
									<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-4"}>



										<div>

											<TDInputTemplateBr
												placeholder="Loan Account No."
												type="text"
												label="Loan Account No."
												name="loan_ac_no"
												formControlName={formik.values.loan_ac_no}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={params.id > 0 ? true : false}
											/>


											{formik.errors.loan_ac_no && formik.touched.loan_ac_no ? (
												<VError title={formik.errors.loan_ac_no} />
											) : null}
										</div>





										{loanAppData?.approval_status == 'A' && (
											<>
												<div>

													<TDInputTemplateBr
														placeholder="Approved By"
														type="text"
														label="Approved By"
														name="approved_by"
														formControlName={formik.values.approved_by}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														disabled={params.id > 0 ? true : false}
													/>

												</div>

												<div>

													<TDInputTemplateBr
														placeholder="Approved Date"
														type="text"
														label="Approved Date"
														name="approved_dt"
														formControlName={formik.values.approved_dt}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														disabled={params.id > 0 ? true : false}
													/>

												</div>
											</>

										)}



									</div>
								</div>

								<div className="flex justify-start gap-5">
									<div className={"grid gap-4 sm:grid-cols-1 sm:gap-6 w-full mb-3"}>

										<div>
											{/* {JSON.stringify(userDetails[0]?.user_type, 2)} */}
											<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800
				 dark:text-gray-100">
												PACS 
												{/* Select PACS/SHG * */}
											</label>

											<Select
											showSearch
											// value={formik.values.branch_shg_id}
											value={userDetails[0]?.brn_code}
											style={{ width: "100%" }}
											optionFilterProp="children"
											name="branch_shg_id"
											onChange={(value) => {
											formik.setFieldValue("branch_shg_id", value)
											}}
											disabled={true}
											onBlur={formik.handleBlur}
											filterOption={(input, option) =>
											option?.children?.toLowerCase().includes(input.toLowerCase())
											}

											>
											<Select.Option value="" disabled>Choose PACS</Select.Option>

											{PACS_SHGList?.map((data) => (
											<Select.Option key={data.code} value={data.code}>
											{data.name}
											</Select.Option>
											))}
											</Select>


											{formik.errors.branch_shg_id && formik.touched.branch_shg_id ? (
												<VError title={formik.errors.branch_shg_id} />
											) : null}




										</div>





									</div>
								</div>

								<div className="flex justify-start gap-5">
									<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-3"}>

										<div>
											<TDInputTemplateBr
												// placeholder="Select Disbursement Date..."
												type="date"
												label="Sanction Date"
												name="sanction_dt"
												formControlName={formik.values.sanction_dt}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												// max={formatDateToYYYYMMDD_CurrentDT(new Date())}
												mode={1}
											// disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>
											{formik.errors.sanction_dt && formik.touched.sanction_dt ? (
												<VError title={formik.errors.sanction_dt} />
											) : null}
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="Sanction No."
												type="text"
												label="Sanction No."
												name="sanction_no"
												formControlName={formik.values.sanction_no}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
											// disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>
											{formik.errors.sanction_no && formik.touched.sanction_no ? (
												<VError title={formik.errors.sanction_no} />
											) : null}
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="Period"
												type="number"
												label="Period (In Month)"
												name="period"
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												formControlName={formik.values.period}
												data={period_data}
												mode={1}
												disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>
											{formik.errors.period && formik.touched.period ? (
												<VError title={formik.errors.period} />
											) : null}
										</div>


										<div>
											<TDInputTemplateBr
												placeholder="Type Current ROI"
												type="number"
												label="Current ROI"
												name="curr_roi"
												formControlName={formik.values.curr_roi}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>
											{formik.errors.curr_roi && formik.touched.curr_roi ? (
												<VError title={formik.errors.curr_roi} />
											) : null}
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="Ovd ROI"
												type="number"
												label="Ovd ROI"
												name="over_roi"
												formControlName={formik.values.over_roi}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>
											{formik.errors.over_roi && formik.touched.over_roi ? (
												<VError title={formik.errors.over_roi} />
											) : null}
										</div>



										<div>
											<TDInputTemplateBr
												// placeholder="Select Disbursement Date..."
												type="date"
												label="Disbursement Date"
												name="disb_dt"
												formControlName={formik.values.disb_dt}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												max={formatDateToYYYYMMDD_CurrentDT(new Date())}
												mode={1}
												disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>
											{formik.errors.disb_dt && formik.touched.disb_dt ? (
												<VError title={formik.errors.disb_dt} />
											) : null}
										</div>

										<div>
											<TDInputTemplateBr
												placeholder="Disbursement Amount..."
												type="number"
												label="Disbursement Amount"
												name="disb_amt"
												formControlName={formik.values.disb_amt}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>

											{formik.errors.disb_amt && formik.touched.disb_amt ? (
												<VError title={formik.errors.disb_amt} />
											) : null}
										</div>

										<div>

											<TDInputTemplateBr
												placeholder="Number Of Group"
												type="number"
												label="Number Of Group"
												name="group_total"
												formControlName={formik.values.group_total}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												mode={1}
												disabled={loanAppData?.approval_status == 'A' ? true : false}
											/>

											{formik.errors.group_total && formik.touched.group_total ? (
												<VError title={formik.errors.group_total} />
											) : null}
										</div>



									</div>
								</div>


								<div className="sm:col-span-3 mt-6">
									{formik.values.rows.length > 0 && (
										<Tag color="#2563eb" className="text-white mb-3 font-bold">
											Add Group Details
										</Tag>
									)}

									{/* <div className="grid grid-cols-12 gap-3 mb-0 p-3 rounded-md bg-slate-50 relative">
<div className="col-span-3 text-sm font-semibold">Select Group</div>
<div className="col-span-4 text-sm font-semibold">Select Member</div>
<div className="col-span-2 text-sm font-semibold">SB Acc No.</div>
<div className="col-span-3 text-sm font-semibold">Amount</div>
</div> */}

									{formik.values.rows.map((row, index) => {
										const isRowFilled =
											row.sb_acc_no &&
											row.shg_id &&
											row.member_id &&
											// row.loany_member &&
											row.amount;

										// ⭐⭐ IMPORTANT LOGIC HERE ⭐⭐
										const currentGroupId = formik.values.rows[index].shg_id;

										const selectedMembersInSameGroup = formik.values.rows
											.filter((r, i) => i !== index && r.shg_id === currentGroupId)
											.map(r => r.member_id);

										const filteredMembers = (memberOptions[index] || []).filter(
											member => !selectedMembersInSameGroup.includes(member.member_id)
										);

										// ✅ 👉 PUT YOUR CODE HERE
										if (
											filteredMembers.length === 1 &&
											!formik.values.rows[index].member_id
										) {
											const member = filteredMembers[0];

											formik.setFieldValue(`rows[${index}].member_id`, member.member_id);
											formik.setFieldValue(`rows[${index}].sb_acc_no`, member.sb_acc_no);
											formik.setFieldValue(`rows[${index}].member_name`, member.member_name);
										}


										return (
											<div
												key={index}
												className="grid grid-cols-12 gap-3 mb-3 p-3 border rounded-md bg-slate-50 relative"
											>

												{/* Account Number */}
												<div className="col-span-2">

													{/* <TDInputTemplateBr
														placeholder="SB Account No."
														type="text"
														label="SB Acc No."
														name={`rows[${index}].sb_acc_no`}
														formControlName={formik.values.rows[index].sb_acc_no}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														// disabled={true}   // 👈 auto-filled only
													/> */}

													<TDInputTemplateBr
														placeholder="SB Account No."
														type="text"
														label="SB Acc No."
														name={`rows[${index}].sb_acc_no`}
														formControlName={formik.values.rows[index].sb_acc_no}
														handleChange={(e) => {
															const value = e.target.value;

															formik.setFieldValue(`rows[${index}].sb_acc_no`, value);

															// 👉 Call API when length is enough (avoid too many calls)
															if (value.length >= 5) {
																fetchGroupBySB(value, index);
															}
														}}
														handleBlur={formik.handleBlur}
														mode={1}
													/>

													{formik.touched.rows?.[index]?.sb_acc_no &&
														formik.errors.rows?.[index]?.sb_acc_no && (
															<VError title={formik.errors.rows[index].sb_acc_no} />
														)}

												</div>


												{/* SHG / PACS */}
												<div className="col-span-3">
													{/* {JSON.stringify(SHGList, null, 2)} */}
													{params.id > 0 ? (
														<>

															<TDInputTemplateBr
																// placeholder="Approved Date"
																type="text"
																label="Select Group"
																name="approved_dt"
																formControlName={formik.values.rows?.[index]?.group_name}
																// handleChange={formik.handleChange}
																// handleBlur={formik.handleBlur}
																mode={1}
																disabled={params.id > 0 ? true : false}
															/>
														</>
													) : (
														<>
															<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800
									 dark:text-gray-100">Select Group</label>
															<Select
																showSearch
																placeholder="Choose Group"
																value={row.shg_id}
																style={{ width: "100%" }}
																optionFilterProp="children"
																name={`rows[${index}].shg_id`}
																disabled={params.id > 0 ? true : false}
																// 🔍 typing search
																onSearch={(value) => {
																	handleSearchSHGChange(value, formik.values.branch_shg_id, index);
																	// handleSearchPacsChange();
																}}
																// ✅ selecting option (ROW SAFE)
																onChange={(value) => {
																	formik.setFieldValue(`rows[${index}].member_id`, "")
																	formik.setFieldValue(`rows[${index}].shg_id`, value);
																	const selectedGroup = SHGList.find(item => item.code === value);
																	const pacsId = selectedGroup?.pacs_id;
																	// console.log("credscredscredscreds____", value, "PACS ID:", pacsId);
																	// console.log(value, 'credscredscredscreds____');

																	fetchGroupData(value, index, pacsId, formik.values.rows[index].sb_acc_no);
																}}

																onBlur={() =>
																	formik.setFieldTouched(
																		`rows[${index}].shg_id`,
																		true
																	)
																}

																filterOption={(input, option) =>
																	option?.children
																		?.toLowerCase()
																		.includes(input.toLowerCase())
																}
															>
																<Select.Option value="" disabled>
																	Choose Group
																</Select.Option>

																{SHGList?.map((data) => (
																	<Select.Option key={data.code} value={data.code}>
																		{data.name}
																	</Select.Option>
																))}
															</Select>
														</>
													)}

													{/* {checkDuplicateGroup[index] && (
											checkDuplicateGroup[index]?.user_status == 1 ? (
												<div style={{ fontSize: 12, color: "red" }}>
												{checkDuplicateGroup[index]?.msg}
												</div>
											) : (
												<>
												<div style={{ fontSize: 12, color: "green" }}>
												{SBAccountStatus[index]?.msg}
												</div>
												</>
											)
											)} */}


													{formik.touched.rows?.[index]?.shg_id &&
														formik.errors.rows?.[index]?.shg_id && (
															<VError title={formik.errors.rows[index].shg_id} />
														)}


												</div>

												{/* No of Group */}
												<div className="col-span-4">
													{params.id > 0 ? (
														<>

															<TDInputTemplateBr
																// placeholder="Approved Date"
																type="text"
																label="Select Member"
																// name="approved_dt"
																formControlName={formik.values.rows?.[index]?.member_name}
																// handleChange={formik.handleChange}
																// handleBlur={formik.handleBlur}
																mode={1}
																disabled={params.id > 0 ? true : false}
															/>
														</>
													) : (
														<>
															<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800 dark:text-gray-100">Select Member</label>


															<Select
																placeholder="Select Member"
																// value={formik.values.rows[index].member_id}
																value={filteredMembers.length === 1 ? filteredMembers[0].member_id : formik.values.rows[index].member_id}
																style={{ width: "100%" }}
																disabled={true}
																onChange={(value) => {

																	formik.setFieldValue(`rows[${index}].member_id`, value);

																	const selectedMember = memberOptions[index]?.find(
																		(m) => m.member_id === value
																	);

																	formik.setFieldValue(
																		`rows[${index}].sb_acc_no`,
																		selectedMember?.sb_acc_no || ""
																	);

																	checkDuplicateMember_FN(value, index);
																}}
															>
																<Select.Option value="" disabled>
																	Choose Member
																</Select.Option>

																{/* 🔥 USE FILTERED MEMBERS */}
																{filteredMembers.map((member) => (
																	<Select.Option
																		key={member.member_id}
																		value={member.member_id}
																	>
																		{member.member_name}
																	</Select.Option>
																))}
															</Select>



														</>
													)}

													{checkDuplicateMember[index] && (
														checkDuplicateMember[index]?.user_status == 1 ? (
															<div style={{ fontSize: 12, color: "red" }}>
																{checkDuplicateMember[index]?.msg}
															</div>
														) : (
															<>
																{/* <div style={{ fontSize: 12, color: "green" }}>
												{SBAccountStatus[index]?.msg}
												</div> */}
															</>
														)
													)}



													{formik.touched.rows?.[index]?.member_id &&
														formik.errors.rows?.[index]?.member_id && (
															<VError title={formik.errors.rows[index].member_id} />
														)}


												</div>

												{/* Account Number */}
												{/* <div className="col-span-2">

													<TDInputTemplateBr
														placeholder="SB Account No."
														type="text"
														label="SB Acc No."
														name={`rows[${index}].sb_acc_no`}
														formControlName={formik.values.rows[index].sb_acc_no}
														mode={1}
														disabled={true}   // 👈 auto-filled only
													/>
													{formik.touched.rows?.[index]?.sb_acc_no &&
														formik.errors.rows?.[index]?.sb_acc_no && (
															<VError title={formik.errors.rows[index].sb_acc_no} />
														)}

												</div> */}



												{/* Amount */}
												<div className="col-span-3">
													<TDInputTemplateBr
														placeholder="Amount"
														label="Amount"
														type="number"
														name={`rows[${index}].amount`}
														formControlName={row.amount}
														handleChange={formik.handleChange}
														mode={1}
													/>

													{formik.touched.rows?.[index]?.amount &&
														formik.errors.rows?.[index]?.amount && (
															<VError title={formik.errors.rows[index].amount} />
														)}


												</div>

												{/* Remove */}
												<div className="col-span-1 text-center absolute right-2 top-4">
													{formik.values.rows.length > 1 && (
														<>
															{params.id == 0 && (
																<button
																	type="button"
																	onClick={() => {
																		const updated = [...formik.values.rows];
																		updated.splice(index, 1);
																		formik.setFieldValue("rows", updated);
																	}}
																	className="text-white font-bold"
																	style={{
																		background: "rgb(218 65 103 / var(--tw-bg-opacity))",
																		padding: "0 7px",
																		height: "25px",
																		lineHeight: "25px",
																		borderRadius: "5px",
																		fontSize: "13px",
																		marginTop: -10,
																		position: 'absolute',
																		right: 6
																	}}
																>
																	✕
																</button>
															)}
														</>
													)}
												</div>

												{/* {JSON.stringify(params, 2)} */}
												{/* Add Button (only last row) */}

												{index === formik.values.rows.length - 1 &&
													Number(params?.id) <= 0 && (
														<div className="col-span-12 text-right mt-2">
															<Button
																type="primary"
																disabled={!isRowFilled}
																icon={<UsergroupAddOutlined />}
																onClick={() =>
																	formik.setFieldValue("rows", [
																		...formik.values.rows,
																		{
																			sb_acc_no: "",
																			shg_id: "",
																			member_id: "",
																			// loany_member: "",
																			amount: "",
																		},
																	])
																}
															>
																Add New
															</Button>
														</div>
													)}
											</div>
										);
									})}

									{/* Total */}
									<div className="text-right mt-3">
										<Tag color="blue" style={{ fontSize: 14 }}>
											Total Amount : ₹{" "}
											{formik.values.rows.reduce(
												(sum, r) => sum + Number(r.amount || 0),
												0
											)}
										</Tag>
									</div>
								</div>

								{loanAppData?.approval_status == 'R' && (
									<div className="sm:col-span-3">
										<TDInputTemplateBr
											type="text"
											label="Remarks "
											name="remarks"
											handleChange={formik.handleChange}
											handleBlur={formik.handleBlur}
											formControlName={loanAppData?.reject_remarks}
											mode={3}
											disabled
										/>
									</div>
								)}




								{/* {userDetails?.id != 3 &&  */}
								{loanAppData?.approval_status == 'U' && (
									<BtnComp mode="A" onReset={formik.resetForm} param={params?.id} />
								)}

								{params?.id == 0 && (
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
						if (params?.id > 0) {
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

export default RefinaceDisbForm_BDCCB
