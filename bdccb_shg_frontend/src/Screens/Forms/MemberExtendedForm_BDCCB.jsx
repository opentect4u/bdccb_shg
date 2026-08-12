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
	Descriptions,
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
import Radiobtn from "../../Components/Radiobtn"


const group_trans_process = [
	{
		label: "Direct",
		value: "D",
	},
	{
		label: "Indirect",
		value: "I",
	}
]

const genderOptions = [
	{ code: "M", name: "Male" },
	{ code: "F", name: "Female" },
	{ code: "O", name: "Other" },
];

const religionOptions = [
	{ code: "Hinduism", name: "Hinduism" },
	{ code: "Islam", name: "Islam" },
	{ code: "Christianity", name: "Christianity" },
	{ code: "Jainism", name: "Jainism" },
	{ code: "Buddhism", name: "Buddhism" },
	{ code: "Sikhism", name: "Sikhism" },
	{ code: "Others", name: "Others" },
];


const casteOptions = [
	{ code: "GEN", name: "General" },
	{ code: "SC", name: "SC" },
	{ code: "ST", name: "ST" },
	{ code: "OBCA", name: "OBC A" },
	{ code: "OBCB", name: "OBC B" },
];

const economicActivites = [
	{
		label: "Yes",
		value: "Y",
	},
	{
		label: "No",
		value: "N",
	}
]


function MemberExtendedForm_BDCCB({ groupDataArr }) {

	const containerStyle = {
		width: '100%',
		height: '400px',
	};
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
	const [mobileExists, setMobileExists] = useState({});
	const [adharNoExists, setAdharNoExists] = useState();
	const [adharStatus, setAdharStatus] = useState({})
	const [SBAccountStatus, setSBAccountStatus] = useState({})
	const [IFSCCodeStatus, setIFSCCodeStatus] = useState({})

	const [directIndirectStatus, setDirectIndirectStatus] = useState("D")
	const [branchList, setBranchList] = useState([]);
	const [PACKSList, setPACKSList] = useState([]);
	const [socityEditTimeBranch, setSocityEditTimeBranch] = useState([]);
	const [groupsList, setGroupsList] = useState(() => [])
	const [groupsDetails, setGroupsDetails] = useState(() => [])
	const [groupDetailsModal, setGroupDetailsModal] = useState(false);
	const [groupValue, setGroupValue] = useState('');
	// const [economicActivitesData, setEconomicActivitesData] = useState("Y")


	const initialValues = {
		branch_id: "",
		packs_id: "",
		g_group_name: "",
		saving_acc_no: "",
		// g_group_type: "J",
		g_address: "",
		// group_leader_name: "",
		sahayika_id: "",
		g_pin: "",
		g_phone1: "",
		g_bank_branch: "",
		// g_acc1: "",
		dist_id: "",
		ps_id: "",
		po_id: "",
		block_id: "",
		gp_id: "",
		village_id: "",
		branch_code: "",
		members: [
			{
				member_id: 0,
				member_name: "",
				address: "",
				sb_acc_no: "",
				aadhar_no: "",
				gp_leader_flag: "N",
				asst_gp_leader_flag: "N",

				husb_father: "",
				ifsc_code: "",
				mobile_no: "",
				gender_field: "",
				religion_field: "",
				caste_field: "",
				economic_activity: "Y"
			}
		],
	}

	const [formValues, setValues] = useState(initialValues)

	const onChange = (e) => {
		// console.log("radio1 checked", e)
		setDirectIndirectStatus(e)

	}

	// const onChange_Economic = (e) => {
	// 	// console.log("radio1 checked", e)
	// 	setEconomicActivitesData(e)		
	// }


	const validationSchema = Yup.object({
		g_group_name: Yup.mixed(),


		members: Yup.array()
			.of(
				Yup.object({
					member_name: Yup.string().required("Member name required"),

					sb_acc_no: Yup.string().required("SB A/C No. required"),

					ifsc_code: Yup.string().required("IFSC Code required"),

					aadhar_no: Yup.string()
						.matches(/^[0-9]{12}$/, "Aadhaar must be 12 digits")
						.required("Aadhaar required (Aadhaar must be 12 digits)"),

					husb_father: Yup.string().required("Husband's/Father's Name required"),

					mobile_no: Yup.string()
						.test("is-10-digits", "Mobile must be 10 digits", (val) => !val || /^[0-9]{10}$/.test(val)),

					gender_field: Yup.string().required("Gender required"),

					gp_leader_flag: Yup.string()
						.oneOf(["Y", "N"])
						.required(),

					asst_gp_leader_flag: Yup.string()
						.oneOf(["Y", "N"])
						.required(),
				})
			)
			.min(1, "At least one member required")

			// 🔐 ROLE VALIDATION
			.test(
				"leader-assistant-rule",
				"Only one Group Leader and one Assistant Member allowed",
				(members = []) => {
					const leaderCount = members.filter(
						(m) => m.gp_leader_flag === "Y"
					).length;

					const assistantCount = members.filter(
						(m) => m.asst_gp_leader_flag === "Y"
					).length;

					return leaderCount <= 1 && assistantCount <= 1;
				}
			)



	})


	// wherever you open popup (e.g. on submit)
	const handleOpenConfirm = (values) => {


		setPendingValues(values);   // store formik values
		setVisible(true);           // open dialog
	};

	const onSubmit = async (values) => {

		// console.log(groupValue, 'ggggggggggggggggggg', formik.values.g_group_name);

		if (!groupValue) {
			Message("error", "Please select Group Name");
			return; // ⛔ stop submit
		}

		// 🔥 Mark all fields as touched
		const touchedMembers = values.members.map(() => ({
			member_name: true,
			sb_acc_no: true,
			aadhar_no: true,
			mobile_no: true,
			gender_field: true,
		}));

		formik.setTouched({
			members: touchedMembers,
		});

		// run validation manually
		const errors = await formik.validateForm();

		if (Object.keys(errors).length > 0) {
			return; // ❌ stop submit
		}

		handleOpenConfirm(values);

		// handleOpenConfirm(values)

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



	const getClientIP = async () => {
		const res = await fetch("https://api.ipify.org?format=json")
		const data = await res.json()
		return data.ip
	}



	const fetchGroupsList = async () => {

		// console.log(searchKeywords, 'search', userDetails[0]?.brn_code);

		setLoading(true)
		// const creds = {
		// group_name: '',
		// type: userDetails[0]?.user_type,
		// branch_code: userDetails[0]?.brn_code,
		// }

		// Query Param   branch_id, type    for Branch type == B for Pacs type == P

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/group/group_list_for_add`, {
			params: {
				type: userDetails[0]?.user_type, branch_id: userDetails[0]?.brn_code
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})

			.then((res) => {
				console.log(res?.data?.data, 'searchsearchsearchsearchsearch', 'creds');
				if (res?.data?.success) {
					// setGroupsList(res?.data?.data)
					setGroupsList(res?.data?.data?.map((item, i) => ({
						code: item?.group_code,
						name: item?.group_name,
					})))

				} else {
					navigate(routePaths.LANDING)
					localStorage.clear()
				}

			})
			.catch((err) => {
				Message("error", "Some error occurred while searching...")
			})
		setLoading(false)

	}

	const fetchGroupDetails = async (groupCode) => {
		const creds = {
			// group_name: params?.id,
			// branch_code: userDetails[0]?.brn_code,
			group_code: groupCode,
		}

		// setValues({
		// 				saving_acc_no: "",
		// 				branch_id: "",
		// 				g_address: "",
		// 				sahayika_id: "",
		// 				g_pin: "",
		// 				g_phone1: "",
		// 				dist_id: "",
		// 				ps_id: "",
		// 				po_id: "",
		// 				block_id: "",
		// 				gp_id: "",
		// 				village_id: "",
		// 				members: []

		// 			})

		const tokenValue = await getLocalStoreTokenDts(navigate);

		// await axios.post(`${url_bdccb}/group/fetch_grp_dtls_code`, creds, {
		// 	headers: {
		// 		Authorization: `${tokenValue?.token}`, // example header
		// 		"Content-Type": "application/json", // optional
		// 	},
		// })

		await axios.get(`${url_bdccb}/group/fetch_grp_dtls_code`, {
			params: { group_code: groupCode },
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				console.log(res?.data?.data[0], 'groupCodegroupCodegroupCode', creds,);

				if (res?.data?.success) {
					// console.log(res?.data?.data, 'resresresresresresres', creds, 'll', params?.id, res?.data?.data);

					// return;


					setValues({
						// group_code: res?.data?.data[0]?.group_code,
						// saving_acc_no: res?.data?.data[0]?.sb_ac_no,
						// branch_id: res?.data?.data[0]?.branch_name,
						// g_address: res?.data?.data[0]?.group_addr,
						// sahayika_id: res?.data?.data[0]?.sahayika_name,
						// g_pin: res?.data?.data[0]?.pin_no,
						// g_phone1: res?.data?.data[0]?.phone1,
						// dist_id: res?.data?.data[0]?.dist_name,
						// ps_id: res?.data?.data[0]?.ps_name,
						// po_id: res?.data?.data[0]?.post_name,
						// block_id: res?.data?.data[0]?.block_name,
						// gp_id: res?.data?.data[0]?.gp_name,
						// village_id: res?.data?.data[0]?.vill_name,
						members: [
							{
								member_id: 0,
								member_name: "",
								address: "",
								sb_acc_no: "",
								aadhar_no: "",
								gp_leader_flag: "N",
								asst_gp_leader_flag: "N",

								husb_father: "",
								ifsc_code: "",
								mobile_no: "",
								gender_field: "",
								religion_field: "",
								caste_field: "",
							}
						]

					})

					setGroupsDetails(res?.data?.data[0])

				} else {
					navigate(routePaths.LANDING)
					localStorage.clear()
				}
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
	}



	useEffect(() => {

		fetchGroupsList()

	}, [])

	useEffect(() => {

		if (userDetails[0]?.user_type === 'P' && params?.id > 0) {
			return;
		} else {
			fetchBranch_Group()
		}

	}, [])



	const editGroup = async (formData) => {
		setLoading(true)

		const ip = await getClientIP()

		const creds = {
			group_code: groupDataArr?.group_code,
			tenant_id: userDetails[0]?.tenant_id,
			branch_code: formData?.branch_id,
			pacs_id: formData?.packs_id || 0,
			direct_indirect_flag: directIndirectStatus,
			group_name: formData?.g_group_name,
			phone1: formData?.g_phone1,
			sahayika_id: formData?.sahayika_id, ///////////////
			group_addr: formData?.g_address,
			dist_id: formData?.dist_id,
			block_id: formData?.block_id,
			ps_id: formData?.ps_id,
			po_id: formData?.po_id,
			gp_id: formData?.gp_id,
			village_id: formData?.village_id || 0,
			pin_no: formData?.g_pin,
			members: formData?.members,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
		}


		console.log(creds, 'credscredscredscreds', userDetails[0]);


		await saveMasterData({
			endpoint: "group/save_group",
			creds,
			navigate,
			successMsg: "Group details saved.",
			onSuccess: () => navigate(-1),

			// 🔥 fully dynamic failure handling
			failureRedirect: routePaths.LANDING,
			clearStorage: true,
		})

		setLoading(false)
	}

	const saveGroupData = async (formData) => {
		setLoading(true)

		const member_ids = formData?.members.map((item) => ({
			id: "",   // if not available keep empty
			member_id: item.member_id || "",
			member_name: item.member_name || "",
			father_hus_name: item.husb_father || "",
			gender: item.gender_field || "",
			religion: item.religion_field || "",
			caste: item.caste_field || "",
			phone_no: item.mobile_no ? String(item.mobile_no) : "",
			aadhar_no: item.aadhar_no || "",
			sb_acc_no: item.sb_acc_no || "",
			ifsc: item.ifsc_code || "",
			address: item.address || "",
			gp_leader_flag: item.gp_leader_flag || "N",
			asst_gp_leader_flag: item.asst_gp_leader_flag || "N",
			economic_activity: item.economic_activity || "Y"
		}));


		console.log(formData, 'formDataformDataformDataformData', groupsDetails);

		// return;


		const ip = await getClientIP()

		const creds = {
			// group_code: formData?.group_code,
			group_code: groupValue,
			branch_code: groupsDetails?.branch_code,
			tenant_id: userDetails[0]?.tenant_id,
			pacs_id: userDetails[0]?.user_type == 'B' ? '0' : groupsDetails?.pacs_id || 0,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
			members: member_ids,

		}

		console.log(creds, 'credscredscredscreds', formData);

		// return;


		await saveMasterData({
			endpoint: "group/add_member",
			creds,
			navigate,
			successMsg: "Group details saved.",
			// onSuccess: () => navigate(-1),
			onSuccess: () => navigate('/homebm/searchmember'),
			// onSuccess: () => {
			// navigate('/homebm/addmemberform/0')
			// // window.location.reload()
			// },

			// 🔥 fully dynamic failure handling
			failureRedirect: routePaths.LANDING,
			clearStorage: true,
		})

		setLoading(false)
	}

	const fetchSahayikaList = async () => {
		setSahayikaList([])
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/trans/sahayika_list`, {
			params: {
				tenant_id: userDetails[0]?.tenant_id,
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			}
		})
			.then((res) => {
				console.log(res?.data?.msg, 'fetchSahayikaList', res?.data?.data);
				if (res?.data?.success) {
					setSahayikaList(res?.data?.data?.map((item, i) => ({
						code: item?.sahayika_id,
						name: item?.sahayika_name,
					})))
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
		setLoading(false)
	}





	const fetchBranch_Group = async () => {
		// setPACKSList([])
		setLoading(true)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			branch_code: userDetails[0]?.brn_code,
			user_type: userDetails[0]?.user_type
			// branch_id: userDetails[0]?.user_type == "P" ? loanAppData?.branch_code : userDetails[0]?.brn_code,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/group/fetch_branch_name`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				console.log(res?.data?.data, 'xxxxxxxxxxxxxxxxxxx_____________branch', 'branch');
				if (res?.data?.success) {
					setBranchList(res?.data?.data?.map((item, i) => ({
						code: item?.branch_id,
						name: item?.branch_name,
					})))

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
		setLoading(false)
	}

	const fetchPacks_Group = async () => {

		setLoading(true)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			// branch_code: branch_id
			branch_id: userDetails[0]?.brn_code,
			user_type: userDetails[0]?.user_type,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/group/fetch_society_name`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				// console.log(res?.data?.data, 'xxxxxxxxxxxxxxxxxxxpacssssssss');

				if (res?.data?.success) {
					setPACKSList(res?.data?.data?.map((item, i) => ({
						code: item?.branch_id,
						name: item?.branch_name,
					})))
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
		setLoading(false)
	}


	const fetchBlock = async (dist_id) => {
		setBlocks([])
		setLoading(true)


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/block_list`, {
			params: {
				dist_id: dist_id,
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				// console.log(res?.data?.data, 'hhhhhhhhhhhhhhhhh');

				if (res?.data?.success) {
					// setBlocks(res?.data?.data)
					setBlocks(res?.data?.data?.map((item, i) => ({
						code: item?.block_id,
						name: item?.block_name,
					})))

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
		setLoading(false)
	}

	const fetchPoliceStation = async (dist_id) => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.get(`${url_bdccb}/master/policestation_list`, {
				params: {
					dist_id: dist_id,
				},
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				// if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				// navigate(routePaths.LANDING)
				// localStorage.clear()
				// } else {
				// setLoanApplications(res?.data?.msg)
				// setCopyLoanApplications(res?.data?.msg)
				// }
				// console.log(res?.data?.data, 'xxxxxxxxxxxxxxxxxxx');

				if (res?.data?.success) {
					// setPoliceStation(res?.data?.data)
					setPoliceStation(res?.data?.data?.map((item, i) => ({
						code: item?.ps_id,
						name: item?.ps_name,
					})))
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
		setLoading(false)
	}

	const fetchPosOffice = async (dist_id) => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/po_list`, {
			params: {
				dist_id: dist_id,
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {


				if (res?.data?.success) {
					setPostOffice(res?.data?.data?.map((item, i) => ({
						code: item?.po_id,
						name: item?.post_name,
					})))
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
		setLoading(false)
	}

	const fetchGPList = async (dist_id, block_id) => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/gp_list`, {
			params: {
				dist_id: dist_id, block_id: block_id
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {


				if (res?.data?.success) {
					setGpName(res?.data?.data?.map((item, i) => ({
						code: item?.gp_id,
						name: item?.gp_name,
					})))
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
		setLoading(false)
	}

	const fetchVillList = async (dist_id, block_id, gp_id) => {

		setLoading(true)



		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/vill_list`, {
			params: {
				dist_id: dist_id, block_id: block_id, gp_id: gp_id
			},
			headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
			},
		})
			.then((res) => {

				// console.log('gggggggggggggggggggggggg', res?.data?.data);

				if (res?.data?.success) {
					setVillName(res?.data?.data?.map((item, i) => ({
						code: item?.vill_id,
						name: item?.vill_name,
					})))
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
		setLoading(false)
	}

	const fetchBranch = async (dist_id) => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.get(`${url_bdccb}/master/branch_list`, {
				params: {
					dist_id: dist_id, tenant_id: userDetails[0]?.tenant_id, branch_id: 0
				},
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				// if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				// navigate(routePaths.LANDING)
				// localStorage.clear()
				// } else {
				// setLoanApplications(res?.data?.msg)
				// setCopyLoanApplications(res?.data?.msg)
				// }
				console.log(res?.data?.data, 'xxxxxxxxxxxxxxxxxxx');

				if (res?.data?.success) {
					setBranch(res?.data?.data?.map((item, i) => ({
						code: item?.branch_id,
						name: item?.branch_name,
					})))
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
		setLoading(false)
	}




	const handleFormikMasterChange = async (e) => {
		const { name, value } = e.target;

		// 1️⃣ Always update Formik first
		formik.setFieldValue(name, value);

		// 2️⃣ District changed
		if (name === "dist_id") {
			if (value?.length > 0) {
				// fetchBlock(value);
				// fetchPoliceStation(value);
				// fetchPosOffice(value);
				// fetchBranch(value);
				console.log("load district");
			} else {
				// setBlocks([]);
				// setPoliceStation([]);
				// setPostOffice([]);
				// setBranch([]);
				console.log("reset district");
			}

			// reset dependent Formik fields
			formik.setFieldValue("block_id", "");
			formik.setFieldValue("ps_id", "");
			formik.setFieldValue("po_id", "");
			formik.setFieldValue("gp_id", "");
			formik.setFieldValue("village_id", "");
			formik.setFieldValue("branch_code", "");
			setGpName([]);
			setVillName([]);
		}

		// 3️⃣ Block changed
		if (name === "block_id") {
			const distId = formik.values.dist_id;

			if (distId?.length > 0 && value?.length > 0) {
				// fetchGPList(distId, value);
			} else {
				setGpName([]);
			}

			// reset downstream
			formik.setFieldValue("gp_id", "");
			formik.setFieldValue("village_id", "");
			setVillName([]);
		}

		// 4️⃣ GP changed
		if (name === "gp_id") {
			const distId = formik.values.dist_id;
			const blockId = formik.values.block_id;

			if (distId?.length > 0 && blockId?.length > 0 && value?.length > 0) {
				// fetchVillList(distId, blockId, value);
			} else {
				setVillName([]);
			}

			// reset village
			formik.setFieldValue("village_id", "");
		}
	};


	const handleGroupLeaderChange = (index) => {
		const isCurrentlyLeader = formik.values.members[index]?.gp_leader_flag === "Y";

		const updated = formik.values.members.map((m, i) => {
			if (i === index) {
				return {
					...m,
					gp_leader_flag: isCurrentlyLeader ? "N" : "Y",
					asst_gp_leader_flag: "N",
				};
			}
			return {
				...m,
				gp_leader_flag: "N",
			};
		});

		formik.setFieldValue("members", updated);
	};

	const handleAssistantChange = (index) => {
		const isCurrentlyAsst = formik.values.members[index]?.asst_gp_leader_flag === "Y";

		const updated = formik.values.members.map((m, i) => {
			if (i === index) {
				return {
					...m,
					asst_gp_leader_flag: isCurrentlyAsst ? "N" : "Y",
					gp_leader_flag: "N",
				};
			}
			return {
				...m,
				asst_gp_leader_flag: "N",
			};
		});

		formik.setFieldValue("members", updated);
	};




	const checkAdharNoExists = async (aadhaarNo, index) => {
		try {
			const res = await axios.get(`${url_bdccb}/group/checkaddhar`, {
				params: { aadhar_no: aadhaarNo },
			});

			setAdharStatus(prev => ({
				...prev,
				[index]: res.data
			}));
		} catch (err) {
			console.log(err);
		}
	};


	const handleAdharNoChange = (e, index) => {
		let value = e.target.value.replace(/\D/g, "");

		if (value.length > 12) return;

		const members = [...formik.values.members];

		// 🔴 DUPLICATE CHECK INSIDE FORM
		const isDuplicate = members.some(
			(m, i) => i !== index && m.aadhar_no === value
		);

		if (isDuplicate) {
			// set error message for this row
			setAdharStatus(prev => ({
				...prev,
				[index]: {
					user_status: 1,
					msg: "Duplicate Aadhaar No.",
				},
			}));
		} else {
			// clear duplicate message
			setAdharStatus(prev => {
				const copy = { ...prev };
				delete copy[index];
				return copy;
			});

			// call API only if 12 digits and not duplicate
			if (value.length === 12) {
				checkAdharNoExists(value, index);
			}
		}

		members[index].aadhar_no = value;
		formik.setFieldValue("members", members);
	};

	const checkSBAccNoExists = async (sbAcc, index) => {
		try {
			const res = await axios.get(`${url_bdccb}/group/checacc_no`, {
				params: { account_no: sbAcc },
			});

			setSBAccountStatus(prev => ({
				...prev,
				[index]: res.data
			}));
		} catch (err) {
			console.log(err);
		}
	};


	const handleSBAccNoChange = (e, index) => {
		let value = e.target.value.replace(/\D/g, "");

		//   console.log(value, 'valuevaluevaluevalue');


		//   if (value.length === 12) return;

		const members = [...formik.values.members];

		// 🔴 DUPLICATE CHECK INSIDE FORM
		const isDuplicate = members.some(
			(m, i) => i !== index && m.sb_acc_no === value
		);

		if (isDuplicate) {
			// set error message for this row
			setSBAccountStatus(prev => ({
				...prev,
				[index]: {
					user_status: 1,
					msg: "Duplicate SB A/C No.",
				},
			}));
		} else {
			// clear duplicate message
			setSBAccountStatus(prev => {
				const copy = { ...prev };
				delete copy[index];
				return copy;
			});

			// call API only if 12 digits and not duplicate
			// if (value.length > 0) {
			checkSBAccNoExists(value, index);
			// }
		}

		members[index].sb_acc_no = value;
		formik.setFieldValue("members", members);
	};


	const checkIFCS_code_format = (ifsc, index) => {
		const value = ifsc.toUpperCase();

		// Rule-based validation
		const isValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value);

		if (!isValid) {
			setIFSCCodeStatus(prev => ({
				...prev,
				[index]: {
					user_status: 1,
					msg: "Invalid IFSC (Format: ABCD0XXXXXX)",
				},
			}));
			return;
		}

		// ✅ Valid IFSC
		setIFSCCodeStatus(prev => ({
			...prev,
			[index]: {
				user_status: 0,
				msg: "Valid IFSC",
			},
		}));
	};


	const checkIFSC_Code = (e, index) => {
		// let value = e.target.value.replace(/\D/g, "");
		let value = e.target.value.toUpperCase();

		const members = [...formik.values.members];

		// 🔴 DUPLICATE CHECK INSIDE FORM
		const isDuplicate = members.some(
			(m, i) => i !== index && m.ifsc_code === value
		);

		// if (isDuplicate) {
		// // set error message for this row
		// setIFSCCodeStatus(prev => ({
		// 	...prev,
		// 	[index]: {
		// 		user_status: 1,
		// 		msg: "Duplicate IFSC Code",
		// 	},
		// }));
		// } else {
		// clear duplicate message
		setIFSCCodeStatus(prev => {
			const copy = { ...prev };
			delete copy[index];
			return copy;
		});

		// call API only if 12 digits and not duplicate
		// if (value.length > 0) {
		checkIFCS_code_format(value, index);
		// }
		// }

		members[index].ifsc_code = value;
		formik.setFieldValue("members", members);
	};


	const checkMobileExists = async (mobileNum, index) => {
		// try {
		// 	const res = await axios.get(`${url_bdccb}/group/checacc_no`, {
		// 		params: { account_no: mobileNum },
		// 	});

		// 	setIFSCCodeStatus(prev => ({
		// 		...prev,
		// 		[index]: res.data
		// 	}));
		// } catch (err) {
		// 	console.log(err);
		// }

		console.log(mobileNum, 'mobileNummobileNummobileNum', index);

	};



	const handleMobileChange = async (e, index) => {
		let value = e.target.value.replace(/\D/g, ""); // ✅ only digits

		// ✅ limit to 10 digits
		if (value.length > 10) return;

		const members = [...formik.values.members];
		members[index].mobile_no = value;
		formik.setFieldValue("members", members);
	};



	const hasErrorStatus =
		formik.values.members.some((_, index) =>
			IFSCCodeStatus[index]?.user_status == 1 ||
			SBAccountStatus[index]?.user_status == 1 ||
			adharStatus[index]?.user_status == 1 ||
			mobileExists[index]?.user_status == 1
		);




	return (
		<>
			{/* {
			isOverdue === 'Y' && <AlertComp 
			
			msg={<p className="text-2xl font-normal"><span className="text-lg ">Loan Overdue Amount is </span>{formatINR(overDueAmt)}</p>} />
		} */}
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				{/* {(userDetails.id == 4 || userDetails.id == 3 || userDetails.id == 2 || userDetails.id == 13) && 
				<Button htmlType="button" type="primary" icon={<Map />} onClick={() => showModal()} className="my-3">View Distance</Button>} */}
				{/* {JSON.stringify(formik.errors, null, 2)} */}

				<form onSubmit={formik.handleSubmit}>
					<div className="flex justify-start gap-5">
						<div className={"grid gap-4 sm:grid-cols-4 sm:gap-6 w-full mb-3"}>



							<div className="sm:col-span-1">


								<TDInputTemplateBr
									placeholder="Group Name"
									type="text"
									label="Group Name"
									name="g_group_name"
									formControlName={formik.values.g_group_name}
									handleChange={(value) => {
										setGroupValue('')

										setGroupValue(value.target.value)
										console.log(value.target.value, 'ggggggggggggggggggg');

										formik.setFieldValue("g_group_name", value.target.value)
										// fetchPacks_Group(value.target.value)
										fetchGroupDetails(value.target.value)
									}}
									handleBlur={formik.handleBlur}
									data={groupsList}
									mode={2}
								/>



								{/* {formik.errors.g_group_name && formik.touched.g_group_name ? (
								<VError title={formik.errors.g_group_name} />
								) : null} */}


							</div>

							<div className="sm:col-span-1 flex items-end">
								<Button
									type="primary"
									onClick={() => setGroupDetailsModal(true)}
									disabled={!groupsDetails?.group_code} // disable if no data
								>
									View Group Details
								</Button>
							</div>


						</div>
					</div>


					{/* {JSON.stringify(formik.errors?.members, null, 2)} */}


					{/* ================= ADD MEMBER SECTION ================= */}
					<div className="sm:col-span-3 mt-6">
						{formik.values?.members?.length > 0 && (
							<Tag color="#2563eb" className="text-white mb-3 font-bold">
								Add Group Members
							</Tag>
						)}

						{/* <div className="grid grid-cols-12 gap-3 mb-0 p-3 rounded-md bg-slate-50" style={{ position: 'relative' }}>
							<div className="col-span-2 text-sm font-semibold">Member Name</div>
							<div className="col-span-2 text-sm font-semibold">SB A/C No.</div>
							<div className="col-span-3 text-sm font-semibold">Aadhaar No.</div>
							<div className="col-span-5 text-sm font-semibold">Address</div>
						</div> */}

						{formik.values?.members?.map((member, index) => {
							const isRowFilled =
								member.member_name &&
								// member.address &&
								member.aadhar_no &&

								// member.husb_father &&
								// member.ifsc_code &&
								member.mobile_no &&
								member.gender_field &&
								// member.religion_field &&
								// member.caste_field &&

								String(member.aadhar_no).length === 12 &&
								member.sb_acc_no;
							//   String(member.sb_acc_no).length === 2;

							return (
								<>
									<div
										key={index}
										className="grid grid-cols-6 gap-3 mb-3 p-3 border rounded-md bg-slate-50" style={{ position: 'relative' }}
									>


										{/* Designation */}
										<div className="col-span-6 flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start' }}>
											{/* Group Leader */}
											<label className="flex items-center gap-1 text-xs" style={{ fontSize: 11 }}>
												<input
													type="checkbox"
													//   checked={member.gp_leader_flag}
													checked={member.gp_leader_flag === "Y"}
													onChange={() => handleGroupLeaderChange(index)}
												/>
												Group Leader
											</label>

											{/* Assistant Member */}
											<label className="flex items-center gap-1 text-xs" style={{ fontSize: 11 }}>
												<input
													type="checkbox"
													//   checked={member.asst_gp_leader_flag}
													checked={member.asst_gp_leader_flag === "Y"}
													onChange={() => handleAssistantChange(index)}
												/>
												Assistant Leader
											</label>
										</div>

										{/* Radion Economic Activities */}
										<div className="col-span-6 economicActivitesClass flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start' }}>
											<label className="block mb-2 text-sm capitalize font-bold text-slate-800 dark:text-gray-100">
												Economic Activities *
											</label>

											<Radiobtn
												data={economicActivites}
												val={member.economic_activity}
												onChangeVal={(value) => {
													formik.setFieldValue(
														`members[${index}].economic_activity`,
														value
													);
												}}
											/>
										</div>

										{/* Name */}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Member Name"
												label="Member Name *"
												type="text"
												name={`members[${index}].member_name`}
												formControlName={member.member_name}
												handleChange={formik.handleChange}
												mode={1}
											/>
											{formik.errors?.members?.[index]?.member_name && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].member_name}
												</div>
											)}
										</div>



										{/* SB ACC */}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="SB A/C No."
												label="SB A/C No. *"
												type="text"   // ✅ MUST be text
												name={`members[${index}].sb_acc_no`}
												formControlName={member.sb_acc_no}
												handleChange={(e) => handleSBAccNoChange(e, index)}
												mode={1}
											// disabled={params?.id > 0}
											/>



											{member.sb_acc_no?.length > 0 && SBAccountStatus[index] && (
												SBAccountStatus[index]?.user_status == 1 ? (
													<div style={{ fontSize: 12, color: "red" }}>
														{SBAccountStatus[index]?.msg}
													</div>
												) : (
													<>
														{/* <div style={{ fontSize: 12, color: "green" }}>
											{SBAccountStatus[index]?.msg}
											</div> */}
													</>
												)
											)}

											{formik.errors?.members?.[index]?.sb_acc_no && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].sb_acc_no}
												</div>
											)}

										</div>

										{/* IFS Code*/}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="IFS Code"
												label="IFS Code"
												type="text"   // ✅ MUST be text
												name={`members[${index}].ifsc_code`}
												formControlName={member.ifsc_code}
												// handleChange={formik.handleChange}
												handleChange={(e) => checkIFSC_Code(e, index)}
												mode={1}
											// disabled={params?.id > 0}
											/>

											{member.ifsc_code?.length > 0 && IFSCCodeStatus[index] && (
												IFSCCodeStatus[index]?.user_status == 1 ? (
													<div style={{ fontSize: 12, color: "red" }}>
														{IFSCCodeStatus[index]?.msg}
													</div>
												) : (
													<>
														{/* <div style={{ fontSize: 12, color: "green" }}>
											{SBAccountStatus[index]?.msg}
											</div> */}
													</>
												)
											)}

											{formik.errors?.members?.[index]?.ifsc_code && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].ifsc_code}
												</div>
											)}

										</div>

										{/* Aadhaar */}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Aadhaar No"
												label="Aadhaar No *"
												type="text"   // ✅ MUST be text
												name={`members[${index}].aadhar_no`}
												formControlName={member.aadhar_no}
												handleChange={(e) => handleAdharNoChange(e, index)}
												mode={1}
											/>

											{formik.errors?.members?.[index]?.aadhar_no && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].aadhar_no}
												</div>
											)}

											{member.aadhar_no?.length === 12 && adharStatus[index] && (
												adharStatus[index].user_status == 1 ? (
													<div style={{ fontSize: 12, color: "red" }}>
														{adharStatus[index].msg}
													</div>
												) : (
													<>
														{/* <div style={{ fontSize: 12, color: "green" }}>
												{adharStatus[index].msg}
												</div> */}
													</>
												)
											)}

										</div>



										{/* Husband's/Father's Name */}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Husband's/Father's Name"
												label="Husband's/Father's Name"
												type="text"
												name={`members[${index}].husb_father`}
												formControlName={member.husb_father}
												handleChange={formik.handleChange}
												mode={1}
											/>

											{formik.errors?.members?.[index]?.husb_father && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].husb_father}
												</div>
											)}

										</div>

										{/* Mobile No. */}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Mobile No"
												label="Mobile No"
												type="number"
												name={`members[${index}].mobile_no`}
												formControlName={member.mobile_no}
												handleChange={(e) => handleMobileChange(e, index)}
												mode={1}
											/>

											{formik.errors?.members?.[index]?.mobile_no && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].mobile_no}
												</div>
											)}

											{member.mobile_no?.length > 0 && mobileExists[index] && (
												mobileExists[index]?.user_status == 1 ? (
													<div style={{ fontSize: 12, color: "red" }}>
														{mobileExists[index]?.msg}
													</div>
												) : (
													<>
														{/* <div style={{ fontSize: 12, color: "green" }}>
											{SBAccountStatus[index]?.msg}
											</div> */}
													</>
												)
											)}

										</div>

										{/* Gender*/}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Select Gender..."
												label="Gender *"
												type="text"
												name={`members[${index}].gender_field`}
												formControlName={formik.values.members[index]?.gender_field}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												data={genderOptions}
												mode={2}
											/>

											{formik.errors?.members?.[index]?.gender_field && (
												<div className="text-red-500 text-xs">
													{formik.errors.members[index].gender_field}
												</div>
											)}
										</div>

										{/* Religion*/}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Select Religion..."
												label="Religion"
												type="text"
												name={`members[${index}].religion_field`}
												formControlName={formik.values.members[index]?.religion_field}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												data={religionOptions}
												mode={2}
											/>
										</div>

										{/* Religion*/}
										<div className="col-span-2">
											<TDInputTemplateBr
												placeholder="Select Caste..."
												label="Caste"
												type="text"
												name={`members[${index}].caste_field`}
												formControlName={formik.values.members[index]?.caste_field}
												handleChange={formik.handleChange}
												handleBlur={formik.handleBlur}
												data={casteOptions}
												mode={2}
											/>
										</div>

										{/* Address */}
										<div className="col-span-6">
											<TDInputTemplateBr
												placeholder="Address"
												label="Address"
												type="text"
												name={`members[${index}].address`}
												formControlName={member.address}
												handleChange={formik.handleChange}
												mode={1}
											/>
										</div>


										{/* Remove */}
										<div className="col-span-1 text-center" style={{ position: 'absolute', right: 10 }}>
											{formik.values.members.length > 1 && (
												<button
													type="button"
													onClick={() => {
														const updated = [...formik.values.members];
														updated.splice(index, 1);
														formik.setFieldValue("members", updated);
													}}
													className="text-red-600 font-bold" style={{
														background: "rgb(218 65 103 / var(--tw-bg-opacity))",
														padding: "0 7px",
														height: "25px",
														color: "#fff",
														lineHeight: "25px",
														borderRadius: "5px",
														marginTop: "13px",
														fontSize: "13px",
													}}
												>
													✕
												</button>
											)}
										</div>

									</div>

									<div className="grid grid-cols-12 gap-3 p-3">

										{/* Add Button */}
										{index === formik.values.members.length - 1 && (
											<div className="col-span-12 text-right">
												<Button
													type="primary"
													disabled={!isRowFilled || adharStatus[index]?.user_status == 1 || SBAccountStatus[index]?.user_status == 1}
													onClick={() =>
														formik.setFieldValue("members", [
															...formik.values.members,
															{
																member_id: 0,
																member_name: "",
																address: "",
																aadhar_no: "",
																gp_leader_flag: "N",
																asst_gp_leader_flag: "N",
															},
														])
													}
												>
													+ Add Member
												</Button>
											</div>
										)}

									</div>
								</>
							);
						})}
					</div>
					{/* ===================================================== */}




					{/* {params.id > 0 && (
							<Divider
								type="vertical"
								style={{
									height: 650,
								}}
							/>
						)} */}
					{params?.id == 'u' && (
						<>
							{/* {JSON.stringify(groupData, null, 2)} */}
							<div className="sm:col-span-2 mt-5">
								<div>
									<Tag color="#DA4167" className="text-white mb-2 font-bold">
										Assign Group Member
									</Tag>



									<div className="relative overflow-x-auto">
										<table className="w-full text-sm shadow-lg text-left rtl:text-right text-gray-500 dark:text-gray-400">
											<thead className="text-xs text-white uppercase bg-slate-800 dark:text-gray-400">
												<tr>
													<th scope="col" className="px-6 py-3">
														Name
													</th>
													<th scope="col" className="px-6 py-3">
														Member Code
													</th>
													<th scope="col" className="px-6 py-3">
														Group Leader
													</th>

													<th scope="col" className="px-6 py-3">
														Action
													</th>
												</tr>
											</thead>
											<tbody>
												{groupData?.map((item, i) => (
													<tr className="bg-white hover:bg-slate-100 ease-linear transition-all cursor-pointer dark:bg-gray-800 border-b-slate-200 border-2"
													>
														<th
															scope="row"
															className="px-6 py-3 font-bold whitespace-nowrap dark:text-white text-slate-800"
														>
															{item.member_name}
														</th>
														<th
															scope="row"
															className="px-6 py-3 font-bold whitespace-nowrap dark:text-white text-slate-800"
														>
															{item.member_code}
														</th>
														<th scope="row" className="px-6 py-3 font-bold whitespace-nowrap dark:text-white text-slate-800">
															{item.gp_leader_flag == "Y" ? 'Yes' : 'No'}
														</th>

														<td
															className={`px-6 py-3`}
														// onClick={
														// 	userDetails?.id == 2
														// 		? () =>
														// 				navigate(
														// 					`/homebm/editgrtform/${item?.form_no}`,
														// 					{
														// 						state: item,
														// 					}
														// 				)
														// 		: () =>
														// 				navigate(
														// 					`/homeco/editgrtform/${item?.form_no}`,
														// 					{
														// 						state: item,
														// 					}
														// 				)
														// }
														>
															{/* {item?.approval_status === "U" ||
															(userDetails?.id == 3 &&
																item?.approval_status === "S") ? (
																<InfoOutlined className="text-teal-500" />
															) : (
																<InfoOutlined className="text-yellow-400" />
															)} */}
															<button
																onClick={() => {
																	console.log("LLSKSIODFUISFH", item)
																	navigate(
																		`/homebm/editMemberGroupForm/${item?.member_code}`,
																		{
																			state: item,
																		}
																	)
																}}
															>
																{/* <EditOutlined
															className={`text-md ${
															flag !== "BM" ? "text-slate-800" : "text-slate-800"
															}`}
															/> */}
																<EditOutlined
																	className={`text-md text-slate-800`}
																/>
															</button>
														</td>
														{/* <td
															className={`px-6 py-4 font-bold ${
																item?.tot_outstanding > 0
																	? "bg-slate-50"
																	: "bg-red-50"
															} text-center`}
															
														>
															
															
														</td> */}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>

						</>
					)}



					{/* {userDetails?.id != 3 &&  */}
					<BtnComp mode="A" onReset={formik.resetForm} param={params?.id} disabled={hasErrorStatus} />
					{/* } */}
				</form>
			</Spin>

			<DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {
					if (pendingValues) {
						// if (params?.id > 0) {
						// 	editGroup(pendingValues);
						// } else {
						// 	saveGroupData(pendingValues)
						// }
						saveGroupData(pendingValues)


						// 🔥 pass values here
					}
					setVisible(false);
				}}
				onPressNo={() => setVisible(!visible)}
			/>


			<Modal
				title={<span className="text-lg font-semibold text-[#DA4167]">Group Details</span>}
				open={groupDetailsModal}
				onCancel={() => setGroupDetailsModal(false)}
				footer={null}
				width={900}
			>
				{groupsDetails ? (
					<Descriptions bordered column={1} size="small">
						<Descriptions.Item label="Group Code">{groupsDetails.group_code}</Descriptions.Item>
						<Descriptions.Item label="Group Name">{groupsDetails.group_name}</Descriptions.Item>
						<Descriptions.Item label="Branch">{groupsDetails.branch_name}</Descriptions.Item>
						<Descriptions.Item label="Sahayika">{groupsDetails.sahayika_name}</Descriptions.Item>
						<Descriptions.Item label="Phone">{groupsDetails.phone1}</Descriptions.Item>
						<Descriptions.Item label="District">{groupsDetails.dist_name}</Descriptions.Item>
						<Descriptions.Item label="Block">{groupsDetails.block_name}</Descriptions.Item>
						<Descriptions.Item label="Police Station">{groupsDetails.ps_name}</Descriptions.Item>
						<Descriptions.Item label="Post Office">{groupsDetails.post_name}</Descriptions.Item>
						<Descriptions.Item label="GP">{groupsDetails.gp_name}</Descriptions.Item>
						<Descriptions.Item label="Village">{groupsDetails.vill_name}</Descriptions.Item>
						<Descriptions.Item label="Address">{groupsDetails.group_addr}</Descriptions.Item>
						<Descriptions.Item label="Savings A/C">{groupsDetails.sb_ac_no}</Descriptions.Item>
					</Descriptions>
				) : (
					<p>No data available</p>
				)}
			</Modal>


		</>
	)
}

export default MemberExtendedForm_BDCCB
