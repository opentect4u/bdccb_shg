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


function BrnPacsDisbursmentForm_BDCCB({ flag }) {


	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const loanAppData = location.state || {}
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))
	console.log(loanAppData, 'loanAppDataloanAppData');
	const [excelDt, setExcelDt] = useState([loanAppData]);
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
	// const [memberOptions, setMemberOptions] = useState({});
	const [memberOptions, setMemberOptions] = useState([]);
	const [checkDuplicateGroup, setCheckDuplicateGroup] = useState({})
	const [checkDuplicateMember, setCheckDuplicateMember] = useState({})
	const [groupOptions, setGroupOptions] = useState({});
	const [groupSBAccNoList, setGroupSBAccNoList] = useState([]);

	const initialValues = {
		// loan_id: "",
		loan_ac_no: "",
		loan_to: "",
		// branch_shg_id: "",

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
		sb_acc_no: "",
		shg_id: "",
		group_name: '',
		sb_balance: '',
		rows: [
			{
				mem_loan_id: "",
				// sb_acc_no: "",
				// shg_id: "",
				member_id: "",
				amount: "",
				// group_name: '',
				member_name: ''
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
		// loan_id: Yup.string().required("Loan ID is required"),
		loan_ac_no: Yup.string().required("Loan Account No. is required"),
		// loan_to: Yup.string().required("Loan To is required"),
		loan_to: Yup.string(),
		// branch_shg_id: Yup.string(),
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

		sb_acc_no: Yup.string().required("Group SB Account No. is required"),
		shg_id: Yup.string().required("Group Name is required"),

		created_by: '',
		created_date: '',
		group_total: Yup.mixed().required("Group Total Of Intarest is required"),
		// member_total: Yup.mixed().required("Member Total Of Intarest is required"),
		rows: Yup.array()
			.of(
				Yup.object({
					// sb_acc_no: Yup.string()
					// 	.required("Account number is required"),

					// shg_id: Yup.string()
					// 	.required("SHG is required"),

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
		// console.log(loanAppData?.loan_to_name, 'loan_to_name', userDetails[0]?.user_type);
		if (params.id > 0) {

			// handleSearchPacsChange(loanAppData?.loan_to_name)
			fetchDisburseDetails()
			// handleSearchSHGChange(loanAppData?.loan_to_name, loanAppData?.loan_to_name)
			// console.log(loanAppData?.loan_to_name, 'loan_to_name', userDetails[0]?.user_type);

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
			// branch_shg_id: loanAppData?.loan_to_name,
			branch_shg_SearchField: '',
			period: loanAppData?.period,
			curr_roi: loanAppData?.curr_roi,
			over_roi: loanAppData?.over_roi,
			sanction_no: loanAppData?.sanction_no,
			disb_dt: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.disb_dt)),
			sanction_dt: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.sanction_dt)),
			disb_amt: loanAppData?.disb_amt,
			created_by: loanAppData?.created_by,
			created_date: formatDateToYYYYMMDD_CurrentDT(new Date(loanAppData?.created_date)),
			group_total: loanAppData?.tot_grp,
			sb_acc_no: loanAppData?.members[0]?.sb_acc_no || "",
			shg_id: loanAppData?.members[0]?.group_name || "",
			sb_balance: loanAppData?.members[0]?.grp_balance || "",

			// 🔥 THIS IS IMPORTANT
			rows: formattedRows.length > 0
				? formattedRows
				: [{
					// sb_acc_no: "",
					// shg_id: "",
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
			tran_id: 0,
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			loan_acc_no: formData?.loan_ac_no,
			loan_to: 'S',
			branch_shg_id: PACS_SHGList[0]?.code,
			period: formData?.period,
			curr_roi: formData?.curr_roi,
			penal_roi: formData?.over_roi,
			sanction_no: formData?.sanction_no,
			disb_dt: formData?.disb_dt,
			sanction_dt: formData?.sanction_dt,
			disb_amt: formData?.disb_amt,
			tot_grp: formData?.group_total,
			members: formattedRows,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
		}




		console.log(formData, 'formDataformDataformDataformData', creds);

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

		if (formik.values.rows.reduce((sum, r) => sum + Number(r.amount || 0), 0) > Number(formik.values.disb_amt)) {
			return Message("error", "Total Amount Greater Than Disbursement Amount")
		}
		const formattedRows = formData?.rows?.map(row => ({
			mem_loan_id: 0,
			// group_code: formData?.shg_id,
			group_code: SHGList[0]?.code,
			member_id: row.member_id,
			disburse_amt: Number(row.amount),
		}))

		setLoading(true)

		const ip = await getClientIP()

		const creds = {
			loan_id: 0,
			tran_id: 0,
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			loan_acc_no: formData?.loan_ac_no,
			loan_to: 'S',
			branch_shg_id: PACS_SHGList[0]?.code,
			period: formData?.period,
			curr_roi: formData?.curr_roi,
			penal_roi: formData?.over_roi,

			disb_dt: formData?.disb_dt,
			disb_amt: formData?.disb_amt,
			tot_grp: formData?.group_total,

			sanction_no: formData?.sanction_no,
			sanction_dt: formData?.sanction_dt,

			members: formattedRows,
			// tot_memb: formData?.member_total,
			// pay_mode: formData?.pay_mode,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
		}

		// console.log(formData, 'formDataformDataformData', creds);
		// return;

		await saveMasterData({
			endpoint: "loan/save_disbursement",
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
		if (params.id < 1) {
			formik.setFieldValue("branch_shg_SearchField", "");
			// formik.setFieldValue("branch_shg_id", "");
			// setPACS_SHGList([])
		}
	}, [formik.values.loan_to])





	useEffect(() => {
		const currRoi = Number(formik.values.curr_roi);

		if (!isNaN(currRoi) && currRoi !== "") {
			// console.log(formik.values.curr_roi, 'ccccccccccc');
			if (formik.values.curr_roi > 0) {
				formik.setFieldValue("over_roi", currRoi + 2);
			}
		}
	}, [formik.values.curr_roi]);


	const handleSearchPacsChange = async (value) => {

		// if (value.length < 3) {
		// 	// Message("error", "Minimum type 3 character")
		// 	return;
		// }
		setPACS_SHGList([])
		setLoading(true)

		// const creds = {
		// loan_to : userDetails[0]?.user_type == 'B' ? 'P' : userDetails[0]?.user_type == 'P' ? 'S' : '',
		// branch_code : userDetails[0]?.user_type == 'B' ? 0 : userDetails[0]?.user_type == 'P' ? userDetails[0]?.brn_code : '',
		// branch_shg_id : value,
		// tenant_id: userDetails[0]?.user_type == 'B' ? userDetails[0]?.tenant_id : 0,
		// }

		const creds = {
			loan_to: 'P',
			branch_code: userDetails[0]?.brn_code,
			branch_shg_id: '',
			tenant_id: userDetails[0]?.tenant_id,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/loan/fetch_demo_pacs`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				if (res?.data?.success) {

					console.log(creds, 'credscredscredscreds_____', res?.data?.data);


					if (userDetails[0]?.user_type == 'B') {
						setPACS_SHGList(res?.data?.data?.map((item, i) => ({
							code: item?.branch_id,
							name: item?.branch_name,
						})))
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
	};


	const handleSearchSHGChange = async (value, branch_shg_id, index) => {

		setLoading(true)

		const creds = {
			branch_code: userDetails[0]?.brn_code,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/loan/fetch_shg_data`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				if (res?.data?.success) {
					// if(userDetails[0]?.user_type == 'P'){
					setSHGList(res?.data?.data?.map((item, i) => ({
						code: item?.group_code,
						name: item?.group_name,
						branch_code: item?.branch_code,
					})))
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
		handleSearchPacsChange()
	}, []);


	const fetchGroupBySB = async (sb_acc_no) => {

		console.log(sb_acc_no, 'sb_acc_no');


		setGroupSBAccNoList([])
		// setSHGList([])

		//   try {
		// const res = await axios.get(`/your-api?sb_acc_no=${sb_acc_no}`);

		const tokenValue = await getLocalStoreTokenDts(navigate);

		const creds = {
			branch_code: userDetails[0]?.brn_code,
			sb_ac_no: sb_acc_no,
		}

		await axios.post(`${url_bdccb}/loan/fetch_gp_based_ac_no`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		}).then((res) => {

			if (res?.data?.success) {

				const groupList = res.data.data;

				console.log(groupList, 'sbbbbbbbbbbbbbbb');

				// return;

				setGroupSBAccNoList(res?.data?.data?.map((item, i) => ({
					code: item?.sb_ac_no,
					name: item?.sb_ac_no,
					// branch_code: item?.branch_code,
				})))

				// formik.setFieldValue(`shg_id`, res?.data?.data[0]?.sb_ac_no)

				// setSHGList(res?.data?.data?.map((item, i) => ({
				// code: item?.group_code,
				// name: item?.group_name,
				// // branch_code: item?.branch_code,
				// })))

			} else {
				Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()
			}

		})
			.catch((err) => {
				Message("error", "Some error occurred while fetching data!")
				console.log("ERRR", err)
			})

	};

	const selectGroupSB_Acc = async (sb_acc_no) => {
		console.log(sb_acc_no, 'sb_acc_no', 'selectGroupSB_Acc');
		// setGroupSBAccNoList([])
		setSHGList([])

		setMemberOptions([]);
		setCheckDuplicateMember({});
		formik.setFieldValue("rows", [
			{
				mem_loan_id: "",
				member_id: "",
				amount: "",
				member_name: "",
			},
		]);

		//   try {
		// const res = await axios.get(`/your-api?sb_acc_no=${sb_acc_no}`);

		const tokenValue = await getLocalStoreTokenDts(navigate);

		const creds = {
			branch_code: userDetails[0]?.brn_code,
			sb_ac_no: sb_acc_no,
		}

		await axios.post(`${url_bdccb}/loan/fetch_gp_based_ac_no`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		}).then(async (res) => {

			if (res?.data?.success) {

				const group_code = res?.data?.data[0]?.group_code;
				if (group_code) {
					try {
						const recoveryRes = await axios.post(`${url_bdccb}/loan/check_group_recovery`, { group_code: group_code }, {
							headers: { Authorization: `${tokenValue?.token}`, "Content-Type": "application/json" }
						});

						if (recoveryRes?.data?.success && recoveryRes?.data?.recovery_exists) {
							Message("error", "Recovery already exists on this SB Account");
							return;
						}
					} catch (err) {
						console.error("Recovery check error", err);
					}
				}

				const groupList = res.data.data;

				console.log(groupList, 'sbbbbbbbbbbbbbbb');

				// return;

				// setGroupSBAccNoList(res?.data?.data?.map((item, i) => ({
				// code: item?.sb_ac_no,
				// name: item?.sb_ac_no,
				// // branch_code: item?.branch_code,
				// })))

				setSHGList(res?.data?.data?.map((item, i) => ({
					code: item?.group_code,
					name: item?.group_name,
					// branch_code: item?.branch_code,
				})))

				formik.setFieldValue(`shg_id`, res?.data?.data[0]?.group_name)
				formik.setFieldValue(`sb_balance`, res?.data?.data[0]?.grp_balance)

				fetchGroupData(res?.data?.data[0]?.group_code)

			} else {
				Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()
			}

		})
			.catch((err) => {
				Message("error", "Some error occurred while fetching data!")
				console.log("ERRR", err)
			})

	};


	useEffect(() => {
		// setMemberOptions([])
		if (Number(params?.id) > 0) {
			formik.values.rows.forEach((row, index) => {
				if (row.shg_id) {
					fetchGroupData(row.shg_id, index);
				}
			});
		}
	}, [formik.values.rows]);


	const fetchGroupData = async (value) => {

		setLoading(true)
		const creds = {
			branch_code: userDetails[0]?.brn_code,
			tenant_id: userDetails[0]?.tenant_id,
			group_code: value
		}

		// 		{
		//     "branch_code" : "107",
		//     "tenant_id" : "1",
		//     "group_code" : "420010"
		// }

		// console.log(value, 'res?.data?.data', 'valueeeeeeeeeeeeeeeeeeeeeeee', creds);

		// return;

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
					// const members = res.data.data;
					// setMemberOptions(members)
					setMemberOptions(res?.data?.data?.map((item, i) => ({
						code: item?.member_id,
						name: item?.member_name,
						// branch_code: item?.branch_code,
					})))
					// ⭐ Save members for this row
					// setMemberOptions((prev) => ({
					// 	...prev,
					// 	[rowIndex]: members,
					// }));

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

		}

	};







	return (
		<>
			<section className=" dark:bg-[#001529] flex justify-center align-middle p-5">
				<div className="p-5 w-4/5 min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader text={`${params?.id == 0 ? "Add Disbursement to SHG" : loanAppData?.approval_status == 'A' ? "View SHG Disbursement" : "Edit/Preview SHG Disbursement"}`} mode={2} />
					</div>

					<Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					>
						{/* {JSON.stringify(loanAppData, 2)} ///////////////// */}
						{/* {JSON.stringify(formValues, 2)}  */}
						{/* {JSON.stringify(PACS_SHGList[0], 2)}  */}

						{/* {JSON.stringify(PACS_SHGList, null, 2)} */}
						<div className="card shadow-lg bg-white border-2 p-5 mx-16 rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
							{loanAppData?.approval_status == 'A' && (<div className="accept_dis"><CheckCircleFilled style={{ color: "#fff", marginRight: 6 }} />
								Disbursement Accepted </div>)}
							{loanAppData?.approval_status == 'U' && (<div className="pending_dis"><SyncOutlined style={{ color: "#fff", marginRight: 6 }} />
								Disbursement Pending </div>)}
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
														placeholder="Created By"
														type="text"
														label="Created By"
														name="created_by"
														formControlName={formik.values.created_by}
														handleChange={formik.handleChange}
														handleBlur={formik.handleBlur}
														mode={1}
														disabled={params.id > 0 ? true : false}
													/>

												</div>

												<div>

													<TDInputTemplateBr
														placeholder="Created Date"
														type="text"
														label="Created Date"
														name="created_date"
														formControlName={formik.values.created_date}
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

									<div className="grid grid-cols-12 gap-3 mb-3 p-3 bg-pink-100 border border-pink-500/50 rounded-md relative">
										{/* border-2 border-pink-500/50 bg-pink-100 rounded-lg pl-5 pr-5 pb-0 pt-5 mt-0 */}
										<div className="col-span-4">
											{params.id > 0 ? (
												<>
													<TDInputTemplateBr
														type="text"
														label="Group SB Acc No."
														name="sb_acc_no"
														formControlName={formik.values.sb_acc_no}
														// handleChange={formik.handleChange}
														// handleBlur={formik.handleBlur}
														mode={1}
														disabled={params.id > 0 ? true : false}
													/>
												</>
											) : (
												<>
													<TDInputTemplateBr
														type="text"
														label="Type SB Acc No."
														placeholder="Type SB Acc No."
														name="sb_acc_no"
														formControlName={formik.values.sb_acc_no}
														handleChange={(e) => {
															formik.setFieldValue("sb_acc_no", e.target.value.toUpperCase());
															formik.setFieldValue("shg_id", "");
															setMemberOptions([]);
															setCheckDuplicateMember({});
															// fetchGroupBySB(e.target.value);
															selectGroupSB_Acc(e.target.value.toUpperCase())
														}}
														handleBlur={formik.handleBlur("sb_acc_no")}
														mode={1}
														disabled={params.id > 0 ? true : false}
													/>
													{/* <label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800
									 			dark:text-gray-100">Group SB Acc No.</label>
											
											<Select
												showSearch
												placeholder="Group SB Acc No."
												// value={sb_acc_no}
												style={{ width: "100%" }}
												optionFilterProp="children"
												name={`sb_acc_no`}
												// disabled={params.id > 0 || index > 0 ? true : false}
												onSearch={(value) => {
													formik.setFieldValue(`sb_acc_no`, value);
													fetchGroupBySB(value);
													// }
												}}
												onChange={(value) => {
												formik.setFieldValue("sb_acc_no", value);
												formik.setFieldValue("shg_id", "");
												setMemberOptions([]);
												setCheckDuplicateMember({});
												formik.setFieldValue("rows", [
													{
														mem_loan_id: "",
														member_id: "",
														amount: "",
														member_name: "",
													},
												]);
												// fetch new group data
												selectGroupSB_Acc(value);
											}}

												onBlur={() =>
													formik.setFieldTouched(`sb_acc_no`, true)
												}

												filterOption={(input, option) =>
													option?.children
														?.toLowerCase()
														.includes(input.toLowerCase())
												}
											>
												<Select.Option value="" disabled>
													Group SB Acc No.
												</Select.Option>

												{groupSBAccNoList?.map((data) => (
													<Select.Option key={data.code} value={data.code}>
														{data.name}
													</Select.Option>
												))}
											</Select> */}

													{formik.touched.sb_acc_no &&
														formik.errors.sb_acc_no && (
															<VError title={formik.errors.sb_acc_no} />
														)}
												</>
											)}


										</div>

										<div className="col-span-4">
											{/* {JSON.stringify(SHGList, 2)} */}
											{params.id > 0 ? (
												<>

													<TDInputTemplateBr
														type="text"
														label="Select Group"
														name="shg_id"
														formControlName={formik.values.shg_id}
														mode={1}
														disabled={params.id > 0 ? true : false}
													/>
												</>
											) : (
												<>
													<TDInputTemplateBr
														type="text"
														label="Group Name"
														placeholder="Group Name"
														name="shg_id"
														formControlName={formik.values.shg_id}
														mode={1}
														disabled={true}
													/>

													{/* {JSON.stringify(formik.values.shg_id, 2)}  */}
													{/* {JSON.stringify(SHGList[0]?.code, 2)}  */}


												</>
											)}

											{formik.touched.shg_id &&
												formik.errors.shg_id && (
													<VError title={formik.errors.shg_id} />
												)}


										</div>

										{/* SB Balance */}
										<div className="col-span-4">
											<TDInputTemplateBr
												type="text"
												label="SB Group Balance"
												placeholder="SB Group Balance"
												name="sb_balance"
												formControlName={formik.values.sb_balance}
												mode={1}
												disabled={true}
											/>
										</div>


									</div>


									{formik.values.rows.map((row, index) => {
										const isRowFilled =
											// row.sb_acc_no &&
											// row.shg_id &&
											row.member_id &&
											// row.loany_member &&
											row.amount;

										const selectedMembers = formik.values.rows
											.filter((_, i) => i !== index)
											.map((r) => r.member_id)
											.filter(Boolean);

										// Filter options
										const filteredMembers = memberOptions.filter(
											(member) => !selectedMembers.includes(member.code)
										);


										return (
											<div
												key={index}
												className="grid grid-cols-12 gap-3 mb-3 p-3 border rounded-md bg-slate-50 relative"
											>


												{/* No of Group */}
												<div className="col-span-8">
													{/* {formik.values.rows?.[index]?.member_id} */}

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
															{/* {JSON.stringify(row, 2)} ///

												{JSON.stringify(filteredMembers, 2)} */}
															<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800 dark:text-gray-100">Select Member</label>

															<Select
																placeholder="Select Member"
																value={formik.values.rows[index].member_id}
																// value={formik.values.rows[index].member_id}
																style={{ width: "100%" }}
																onChange={(value) => {

																	formik.setFieldValue(`rows[${index}].member_id`, value);

																	// const selectedMember = memberOptions[index]?.find(
																	// (m) => m.member_id === value
																	// );
																	const selectedMember = memberOptions.find(
																		(m) => m.code === value
																	);

																	// formik.setFieldValue(
																	// `rows[${index}].sb_acc_no`,
																	// selectedMember?.sb_acc_no || ""
																	// );
																	// console.log(value, 'valuevaluevalue');


																	checkDuplicateMember_FN(value, index);
																}}
															// disabled={true}
															>
																<Select.Option value="" disabled>
																	Choose Member
																</Select.Option>



																{filteredMembers?.map((data) => (
																	<Select.Option key={data.code} value={data.code}>
																		{data.name}
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





												{/* Amount */}
												<div className="col-span-4">
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



								{/* {loanAppData?.approval_status != 'A' && ( */}
								{/* {loanAppData?.approval_status == 'U' && (
									<BtnComp mode="A" onReset={formik.resetForm} param={params?.id}/>
								)} */}

								{params?.id < 1 && (
									<BtnComp mode="A" onReset={formik.resetForm} param={params?.id} />
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

export default BrnPacsDisbursmentForm_BDCCB
