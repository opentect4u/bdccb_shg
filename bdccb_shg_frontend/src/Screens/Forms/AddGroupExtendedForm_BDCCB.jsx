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
import { Map as MapIcon } from "lucide-react"
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

function AddGroupExtendedForm_BDCCB({ groupDataArr }) {

const containerStyle = {
  width: '100%',
  height: '400px',
};
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
	const [pinCodeList, setPinCodeList] = useState(() => [])
	const [villName, setVillName] = useState(() => [])
	const [branch, setBranch] = useState(() => [])

	const [groupData, setGroupData] = useState(() => [])
	const [sahayikaList, setSahayikaList] = useState(() => [])

	const [visible, setVisible] = useState(() => false)
	const [pendingValues, setPendingValues] = useState(null);
	const [mobileExists, setMobileExists] = useState();
	const [adharNoExists, setAdharNoExists] = useState();
	const [adharStatus, setAdharStatus] = useState({})
	const [SBAccountStatus, setSBAccountStatus] = useState({})
	
	const [directIndirectStatus, setDirectIndirectStatus] = useState("D")
	const [branchList, setBranchList] = useState([]);
	const [PACKSList, setPACKSList] = useState([]);
	const [socityEditTimeBranch, setSocityEditTimeBranch] = useState([]);
	const [economicActivitesData, setEconomicActivitesData] = useState("Y")


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
			member_id : 0,
			member_name: "",
			address: "",
			sb_acc_no: "",
			aadhar_no: "",
			gp_leader_flag: "N",
			asst_gp_leader_flag: "N",
			}
		],
	}

	const [formValues, setValues] = useState(initialValues)
	
	const onChange = (e) => {
		// console.log("radio1 checked", e)
		setDirectIndirectStatus(e)
		
	}

	const onChange_Economic = (e) => {
		// console.log("radio1 checked", e)
		setEconomicActivitesData(e)		
	}
	

	
	const validationSchema = Yup.object({
		branch_id: Yup.string().required("Branch name is required"),
		// branch_id: Yup.string().when("directIndirectStatus", {
		// is: "D",
		// then: (schema) => schema.required("Branch name is required"),
		// otherwise: (schema) => schema.notRequired(),
		// }),

		
		packs_id:
		userDetails[0]?.user_type === "P"
		? Yup.string().required("PACKS name is required")
		: Yup.string().notRequired(),
		g_group_name: Yup.string().required("Group name is required"),
		saving_acc_no: Yup.string().required("Group Savings A/C Number is required"),
		g_address: Yup.string().required("Address is required"),
		sahayika_id: Yup.string().required("Sahayika name is required"),
		dist_id: Yup.mixed().required("District is required"),
		ps_id: Yup.mixed().required("Police Station is required"),
		po_id: Yup.mixed().required("Post Office is required"),
		block_id: Yup.mixed().required("Block is required"),
		gp_id: Yup.mixed().required("GP Name is required"),
		village_id: Yup.mixed(),
		g_phone1: Yup.mixed().required("Mobile No. is required"),

		// members: Yup.array()
		// .of(
		// 	Yup.object({
		// 	member_name: Yup.string().required("Member name required"),

		// 	address: Yup.string().required("Address required"),
		// 	sb_acc_no: Yup.string().required("SB Acc No. required"),
		// 	aadhar_no: Yup.string().matches(/^[0-9]{12}$/, "Aadhaar must be 12 digits").required("Aadhaar required"),
		// 	// aadhar_no: Yup.string(),

		// 	gp_leader_flag: Yup.string()
		// 		.oneOf(["Y", "N"])
		// 		.required(),

		// 	asst_gp_leader_flag: Yup.string()
		// 		.oneOf(["Y", "N"])
		// 		.required(),
		// 	})
		// ).min(1, "At least one member required")

		// // 🔐 ROLE VALIDATION
		// .test(
		// 	"leader-assistant-rule",
		// 	"Only one Group Leader and one Assistant Member allowed",
		// 	(members = []) => {
		// 	const leaderCount = members.filter(
		// 		(m) => m.gp_leader_flag === "Y"
		// 	).length;

		// 	const assistantCount = members.filter(
		// 		(m) => m.asst_gp_leader_flag === "Y"
		// 	).length;

		// 	return leaderCount <= 1 && assistantCount <= 1;
		// 	}
		// )



	})


	useEffect(() => {
		fetchSahayikaList()
	}, [])

	useEffect(()=>{

		if(userDetails[0]?.user_type === 'P' && params?.id > 0){
			return;
		} else {
			fetchBranch_Group()
		}

	}, [])

	

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
		// console.log(values, 'formDataformDataformDataformData');
		handleOpenConfirm(values)
			
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



	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}


	const fetchGroupDetails = async () => {
		const creds = {
			group_name: params?.id,
			branch_code: userDetails[0]?.brn_code,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/group/fetch_group_details`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				
				if(res?.data?.success){
					console.log(res?.data?.data, 'resresresresresresres', creds, 'll', params?.id, res?.data?.data);


				setValues({

					g_group_name: res?.data?.data[0]?.group_name,
					branch_id : res?.data?.data[0]?.branch_code,
					packs_id : res?.data?.data[0]?.pacs_id,
					// g_group_type: "J",
					g_address: res?.data?.data[0]?.group_addr,
					group_leader_name: res?.data?.data[0]?.group_leader_name,
					sahayika_id: res?.data?.data[0]?.sahayika_id,
					g_pin: res?.data?.data[0]?.pin_no,
					g_phone1: res?.data?.data[0]?.phone1,
					g_bank_branch: res?.data?.data[0]?.branch_name,
					// g_acc1: res?.data?.data[0]?.sb_ac_no,
					dist_id: res?.data?.data[0]?.dist_id,
					ps_id: res?.data?.data[0]?.ps_id,
					po_id: res?.data?.data[0]?.po_id,
					block_id: res?.data?.data[0]?.block_id,
					gp_id: res?.data?.data[0]?.gp_id,
					village_id: res?.data?.data[0]?.village_id,
					branch_code: res?.data?.data[0]?.branch_code,
					members: res?.data?.data[0]?.memb_dt

				})

				setSocityEditTimeBranch([
					
				])
				setDirectIndirectStatus(res?.data?.data[0]?.direct_indirect_flag)
				// fetchPacks_Group(res?.data?.data[0]?.branch_code)

				fetchBlock(res?.data?.data[0]?.dist_id)
				fetchPoliceStation(res?.data?.data[0]?.dist_id)
				fetchPosOffice(res?.data?.data[0]?.dist_id)
				fetchBranch(res?.data?.data[0]?.dist_id)

				fetchGPList(res?.data?.data[0]?.dist_id, res?.data?.data[0]?.block_id)
				fetchVillList(res?.data?.data[0]?.dist_id, res?.data?.data[0]?.block_id, res?.data?.data[0]?.gp_id);

				// setDisCode(res?.data?.msg[0]?.disctrict)
				console.log(res?.data?.data[0]?.dist_id, res?.data?.data[0]?.block_id, res?.data?.data[0]?.gp_id, 'branchbranchbranchbranchbranchfffffffff', loanAppData?.dist_id);
				
				setGroupData(res?.data?.data[0]?.memb_dt);
				
				} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
				}
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
	}

	const fetchGroupDetails_ForPacs = async () => {
		const creds = {
			group_name: params?.id,
			branch_code: userDetails[0]?.brn_code,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/group/fetch_pacs_group_details`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				
				if(res?.data?.success){
					console.log(res?.data?.data, 'resresresresresresres', creds, 'll', params?.id, res?.data?.data);


				setValues({

					g_group_name: res?.data?.data[0]?.group_name,
					branch_id : res?.data?.data[0]?.branch_code,
					packs_id : res?.data?.data[0]?.pacs_id,
					// g_group_type: "J",
					g_address: res?.data?.data[0]?.group_addr,
					group_leader_name: res?.data?.data[0]?.group_leader_name,
					sahayika_id: res?.data?.data[0]?.sahayika_id,
					g_pin: res?.data?.data[0]?.pin_no,
					g_phone1: res?.data?.data[0]?.phone1,
					g_bank_branch: res?.data?.data[0]?.branch_name,
					// g_acc1: res?.data?.data[0]?.sb_ac_no,
					dist_id: res?.data?.data[0]?.dist_id,
					ps_id: res?.data?.data[0]?.ps_id,
					po_id: res?.data?.data[0]?.po_id,
					block_id: res?.data?.data[0]?.block_id,
					gp_id: res?.data?.data[0]?.gp_id,
					village_id: res?.data?.data[0]?.village_id,
					branch_code: res?.data?.data[0]?.branch_code,
					members: res?.data?.data[0]?.memb_dt

				})

				setBranchList([
				{
				code: res?.data?.data[0]?.branch_code,
				name: res?.data?.data[0]?.branch_name,
				}]
				)

				setDirectIndirectStatus(res?.data?.data[0]?.direct_indirect_flag)
				// fetchPacks_Group(res?.data?.data[0]?.branch_code)

				fetchBlock(res?.data?.data[0]?.dist_id)
				fetchPoliceStation(res?.data?.data[0]?.dist_id)
				fetchPosOffice(res?.data?.data[0]?.dist_id)
				fetchBranch(res?.data?.data[0]?.dist_id)

				fetchGPList(res?.data?.data[0]?.dist_id, res?.data?.data[0]?.block_id)
				fetchVillList(res?.data?.data[0]?.dist_id, res?.data?.data[0]?.block_id, res?.data?.data[0]?.gp_id);

				// setDisCode(res?.data?.msg[0]?.disctrict)
				// console.log(res?.data?.data[0]?.dist_id, res?.data?.data[0]?.block_id, res?.data?.data[0]?.gp_id, 'branchbranchbranchbranchbranchfffffffff', loanAppData?.dist_id);
				
				setGroupData(res?.data?.data[0]?.memb_dt);
				
				} else {
				// navigate(routePaths.LANDING)
				// localStorage.clear()
				}
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching group form")
			})
	}
	


	const editGroup = async (formData) => {
				setLoading(true)
			
				const ip = await getClientIP()
			
				const creds = {
				group_code: groupDataArr?.group_code,
				tenant_id: userDetails[0]?.tenant_id,
				// branch_code: masterData?.branch_code,
				// branch_code: userDetails[0]?.brn_code,
				// branch_code: directIndirectStatus == 'D' ? formData?.branch_id : formData?.packs_id,
				// branch_code: directIndirectStatus == 'I' ? userDetails[0]?.brn_code : formData?.branch_id,
				branch_code: formData?.branch_id ,
				// pacs_id: directIndirectStatus == 'I' ? formData?.packs_id : 0,
				pacs_id: formData?.packs_id || 0,
				direct_indirect_flag: directIndirectStatus,
				group_name: formData?.g_group_name,
				// gp_leader_id: 2, ///////////////
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
				economic_activity: economicActivitesData,
				// sb_ac_no: formData?.g_acc1,
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
			
				const ip = await getClientIP()
			
				const creds = {
				group_code: '0',
				branch_code: formData?.branch_id,
				tenant_id: userDetails[0]?.tenant_id,
				group_name: formData?.g_group_name,
				phone1: formData?.g_phone1,
				sahayika_id: formData?.sahayika_id,
				group_addr: formData?.g_address,
				dist_id: formData?.dist_id,
				block_id: formData?.block_id,
				ps_id: formData?.ps_id,
				po_id: formData?.po_id,
				gp_id: formData?.gp_id,
				village_id: formData?.village_id || 0,
				pin_no: formData?.g_pin,
				saving_acc_no: formData?.saving_acc_no,
				economic_activity: economicActivitesData,
				pacs_id: userDetails[0]?.user_type == 'B' ? '111' : formData?.packs_id,
				created_by: userDetails[0]?.emp_id,
				ip_address: ip,
				// direct_indirect_flag: directIndirectStatus,
				// members: formData?.members,
				}

				// console.log(creds, 'credscredscredscreds', economicActivitesData);
				// return;
				
			
				await saveMasterData({
				endpoint: "group/add_group",
				creds,
				navigate,
				successMsg: "Group details saved.",
				// onSuccess: () => navigate(-1),
				onSuccess: () => navigate('/homebm/searchgroup/'),
			
				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
				})
			
				setLoading(false)
				}

	const fetchSahayikaList = async () => {
		setSahayikaList([])
		setLoading(true)

		// const creds = {
		// 	tenant_id: userDetails[0]?.tenant_id,
		// }
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
					if(res?.data?.success){
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

	useEffect(()=>{
		
		fetchPacks_Group()
		
	}, [])




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

			if(res?.data?.success){
			// if(userDetails[0]?.user_type == "P"){

			// setBranchList([
			// 	{
			// 	code: loanAppData?.branch_code,
			// 	name: loanAppData?.branch_name,
			// 	}]
			// )

			// } else {
			setBranchList(res?.data?.data?.map((item, i) => ({
			code: item?.branch_id,
			name: item?.branch_name,
			// tenant_id: item?.tenant_id,
			})))
			// }
			
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
	
			if(res?.data?.success){
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
			
			if(res?.data?.success){
			// setBlocks(res?.data?.data)
			setBlocks(res?.data?.data?.map((item, i) => ({
			code: String(item?.block_id),
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

	const fetchPoliceStation = async (dist_id, block_id) => {

		// console.log(dist_id, block_id, 'namenamenamename');
		
		setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.get(`${url_bdccb}/master/policestation_list`, {
				params: {
				dist_id: dist_id, block_id: block_id
				},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
			.then((res) => {

	
			if(res?.data?.success){
			// setPoliceStation(res?.data?.data)
			setPoliceStation(res?.data?.data?.map((item, i) => ({
			code: String(item?.ps_id),
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

	const fetchPosOffice = async (dist_id, block_id) => {
		// console.log(dist_id, block_id, 'namenamenamename');
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/po_list`, {
			params: {
		dist_id: dist_id, block_id: block_id
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
			.then((res) => {


			if(res?.data?.success){
			setPostOffice(res?.data?.data?.map((item, i) => ({
			code: String(item?.po_id),
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


			if(res?.data?.success){
			setGpName(res?.data?.data?.map((item, i) => ({
			code: String(item?.gp_id),
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

			if(res?.data?.success){
			setVillName(res?.data?.data?.map((item, i) => ({
			code: String(item?.vill_id),
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
					dist_id: dist_id, tenant_id: userDetails[0]?.tenant_id ,branch_id: 0
					},
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {

			console.log(res?.data?.data, 'xxxxxxxxxxxxxxxxxxx');
	
			if(res?.data?.success){
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


	const fetchPINCodeList = async (dist_id, block_id) => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/pin_list`, {
			params: {
		dist_id: dist_id, block_id: block_id
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
			.then((res) => {


			if(res?.data?.success){
			console.log(res?.data?.data, 'ffffffffffffffffffffff');
			
			// setPinCodeList()
			setPinCodeList(res?.data?.data?.map((item, i) => ({
			code: item?.pin,
			name: item?.pin,
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

  const isValValid = (val) => val !== undefined && val !== null && String(val).trim() !== "" && String(val) !== "0";

  // 2️⃣ District changed
  if (name === "dist_id") {
	if (isValValid(value)) {
	  fetchBlock(value);
	  fetchBranch(value);
	  console.log("load district", value);
	} else {
	  setBlocks([]);
	  setPoliceStation([]);
	  setPostOffice([]);
	  setBranch([]);
	  setPinCodeList([]);
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
	const distId = formik.values.dist_id || value;

	if (isValValid(distId) && isValValid(value)) {
	  fetchPoliceStation(distId, value);
	  fetchPosOffice(distId, value);
	  fetchGPList(distId, value);
	  fetchPINCodeList(distId, value);
	} else {
	  setGpName([]);
	  setPoliceStation([]);
	  setPostOffice([]);
	  setPinCodeList([]);
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

	if (isValValid(distId) && isValValid(blockId) && isValValid(value)) {
	  fetchVillList(distId, blockId, value);
	} else {
	  setVillName([]);
	}

	// reset village
	formik.setFieldValue("village_id", "");
  }
};




const checkMobileExists = async (mobile) => {
  try {
	const res = await axios.get(`${url_bdccb}/user/checkuser`, {
	  params: { user_id: mobile },
	});

	console.log(res.data, 'ddddddddddddddddddddddd');
	
	setMobileExists(res.data)
	
	return res.data; // true / false
  } catch (err) {
	console.log(err);
	return false;
  }
};



const handleMobileChange = async (e) => {
//   const value = e.target.value;
let value = e.target.value;
	value = value.replace(/\D/g, "").slice(0, 10);
  formik.setFieldValue("g_phone1", value);

  if (value.length === 10) {
	const exists = await checkMobileExists(value);


	if (exists?.user_status == 1) {
	  formik.setFieldValue("g_phone1", "");
	}
  }
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
				
				<form onSubmit={formik.handleSubmit}>
					<div className="flex justify-start gap-5">
						<div className={"grid gap-4 sm:grid-cols-4 sm:gap-6 w-full mb-3"}>
							{/* {JSON.stringify(branchList, null, 2)} */}
					
					{/* {directIndirectStatus == 'D' &&( */}

					<div className="sm:col-span-4 economicActivitesClass">
					<label for="branch_id" class="block mb-2 text-sm capitalize font-bold text-slate-800
				 dark:text-gray-100"> Economic Activites *</label>
					<Radiobtn
					data={economicActivites}
					val={economicActivitesData}
					onChangeVal={(value) => {
					onChange_Economic(value)
					}}
					/>
					</div>
					
					<div className="sm:col-span-2">
					<TDInputTemplateBr
					placeholder="Select Branch"
					type="text"
					label="Select Branch *"
					name="branch_id"
					// disabled={userDetails[0]?.user_type == 'P' ? true : false}
					disabled={userDetails[0]?.user_type === 'P' && params?.id > 0}
					formControlName={formik.values.branch_id}
					handleChange={(value) => { 
						formik.setFieldValue("branch_id", value.target.value)
						// fetchPacks_Group(value.target.value)
					 }}
					handleBlur={formik.handleBlur}
					data={branchList}
					mode={2}
					/>

					{formik.errors.branch_id && formik.touched.branch_id ? (
					<VError title={formik.errors.branch_id} />
					) : null}
					
					
					</div>
					{/* )} */}

					{userDetails[0]?.user_type == "P" ? (
						<div className="sm:col-span-2">
					<TDInputTemplateBr
					placeholder="Select Society"
					type="text"
					label="Select Society *"
					name="packs_id"
					// disabled={userDetails[0]?.user_type == 'P' ? true : false}
					disabled={userDetails[0]?.user_type === 'P' && params?.id > 0}
					formControlName={formik.values.packs_id}
					handleChange={formik.handleChange}
					handleBlur={formik.handleBlur}
					data={PACKSList}
					mode={2}
					/>		
					
					{formik.errors.packs_id && formik.touched.packs_id ? (
					<VError title={formik.errors.packs_id} />
					) : null}
					
					</div>
					) : (
						<div className="sm:col-span-2"></div>
					)}
					

							<div className="sm:col-span-2">
								<TDInputTemplateBr
									placeholder="Group Name"
									type="text"
									label="Group Name"
									name="g_group_name"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_group_name}
									mode={1}
								/>
								{formik.errors.g_group_name && formik.touched.g_group_name ? (
									<VError title={formik.errors.g_group_name} />
								) : null}
							</div>

							<div className="sm:col-span-2">
								<TDInputTemplateBr
									placeholder="Group Savings A/C Number"
									type="text"
									label="Group Savings A/C Number"
									name="saving_acc_no"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.saving_acc_no}
									mode={1}
								/>
								{formik.errors.saving_acc_no && formik.touched.saving_acc_no ? (
									<VError title={formik.errors.saving_acc_no} />
								) : null}
							</div>

							</div>
							</div>
							<div className="flex justify-start gap-5 mb-3">
							<div className={"grid gap-4 sm:grid-cols-1 sm:gap-6 w-full"}>
								<div className="sm:col-span-2">
								<TDInputTemplateBr
									placeholder="Type Address..."
									type="text"
									label={`Address`}
									name="g_address"
									formControlName={formik.values.g_address}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={3}
								/>
								{formik.errors.g_address && formik.touched.g_address ? (
									<VError title={formik.errors.g_address} />
								) : null}
								</div>
							</div>
							</div>
							
							<div className="flex justify-start gap-5">
							<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full"}>

							

							<div>
								{/* {JSON.stringify(sahayikaList, null, 2)} */}
								<TDInputTemplateBr
									placeholder="Sahayika Name"
									type="text"
									label="Sahayika Name"
									name="sahayika_id"
									formControlName={formik.values.sahayika_id}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={2}
									data={sahayikaList}
									// setSahayikaList
								/>
								

								{formik.errors.sahayika_id && formik.touched.sahayika_id ? (
									<VError title={formik.errors.sahayika_id} />
								) : null}
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Mobile No. Of Group Leader"
									type="number"
									label="Mobile No. Of Group Leader"
									name="g_phone1"
									// handleChange={formik.handleChange}
									handleChange={handleMobileChange} 
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_phone1}
									mode={1}
									maxLength={10}
								/>
								{mobileExists?.user_status == 1 ?(
									<div style={{fontSize:12, color:'red'}}>{mobileExists?.msg}</div>
								) : (
									<>
									{/* <div style={{fontSize:12, color:'green'}}>{mobileExists?.msg}</div> */}
									</>
								)}
								{formik.errors.g_phone1 && formik.touched.g_phone1 ? (
									<VError title={formik.errors.g_phone1} />
								) : null}
							</div>

							<div>
							<TDInputTemplateBr
							placeholder="Select District..."
							type="text"
							label="District"
							name="dist_id"
							// formControlName={masterData.dist_id}
							// handleChange={handleChangeMaster}
							formControlName={formik.values.dist_id}
							// handleChange={formik.handleChange}
							handleChange={handleFormikMasterChange} 
							handleBlur={formik.handleBlur}
							data={districts}
							mode={2}
							/>
							{formik.errors.dist_id && formik.touched.dist_id ? (
									<VError title={formik.errors.dist_id} />
								) : null}
							</div>

							<div>
								{/* {JSON.stringify(masterData, null, 2)}  */}
						<TDInputTemplateBr
						placeholder="Select Block..."
						type="text"
						label="Block"
						name="block_id"
						// formControlName={masterData.block_id}
						// handleChange={handleChangeMaster}
						formControlName={formik.values.block_id}
						// handleChange={formik.handleChange}
						handleChange={handleFormikMasterChange} 
						handleBlur={formik.handleBlur}
						data={blocks}
						mode={2}
						/>
						{formik.errors.block_id && formik.touched.block_id ? (
									<VError title={formik.errors.block_id} />
								) : null}
					</div>


							<div>
								{/* <TDInputTemplateBr
									placeholder="PIN No."
									type="number"
									label="PIN No."
									name="g_pin"
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									formControlName={formik.values.g_pin}
									mode={1}
								/> */}

								<TDInputTemplateBr
								placeholder="Select PIN No..."
								type="text"
								label="PIN No."
								name="g_pin"
								// formControlName={masterData.gp_id}
								// handleChange={handleChangeMaster}
								formControlName={formik.values.g_pin}
								// handleChange={formik.handleChange}
								handleChange={handleFormikMasterChange} 
								handleBlur={formik.handleBlur}
								data={pinCodeList}
								mode={2}
								/>

								{formik.errors.g_pin && formik.touched.g_pin ? (
									<VError title={formik.errors.g_pin} />
								) : null}
							</div>


							

							

						<div>
						<TDInputTemplateBr
						placeholder="Select Police Station..."
						type="text"
						label="Police Station"
						name="ps_id"
						// formControlName={masterData.ps_id}
						// handleChange={handleChangeMaster}
						formControlName={formik.values.ps_id}
						// handleChange={formik.handleChange}
						handleChange={handleFormikMasterChange} 
						handleBlur={formik.handleBlur}
						data={policeStation}
						mode={2}
						/>
						{formik.errors.ps_id && formik.touched.ps_id ? (
									<VError title={formik.errors.ps_id} />
								) : null}
					</div>

					<div>
						<TDInputTemplateBr
						placeholder="Select Post Office..."
						type="text"
						label="Post Office"
						name="po_id"
						// formControlName={masterData.po_id}
						// handleChange={handleChangeMaster}
						formControlName={formik.values.po_id}
						// handleChange={formik.handleChange}
						handleChange={handleFormikMasterChange} 
						handleBlur={formik.handleBlur}
						data={postOffice}
						mode={2}
						/>
						{formik.errors.po_id && formik.touched.po_id ? (
									<VError title={formik.errors.po_id} />
								) : null}
					</div>

							

					<div>
						
						<TDInputTemplateBr
						placeholder="Select GP Name..."
						type="text"
						label="GP Name"
						name="gp_id"
						// formControlName={masterData.gp_id}
						// handleChange={handleChangeMaster}
						formControlName={formik.values.gp_id}
						// handleChange={formik.handleChange}
						handleChange={handleFormikMasterChange} 
						handleBlur={formik.handleBlur}
						data={gpName}
						mode={2}
						/>
						{formik.errors.gp_id && formik.touched.gp_id ? (
									<VError title={formik.errors.gp_id} />
								) : null}
					</div>

					<div>
						
						<TDInputTemplateBr
						placeholder="Select Village Name..."
						type="text"
						label="Village Name"
						name="village_id"
						// formControlName={masterData.village_id}
						// handleChange={handleChangeMaster}
						formControlName={formik.values.village_id}
						// handleChange={formik.handleChange}
						handleChange={handleFormikMasterChange} 
						handleBlur={formik.handleBlur}
						data={villName}
						mode={2}
						/>
						{formik.errors.village_id && formik.touched.village_id ? (
						<VError title={formik.errors.village_id} />
						) : null}
					</div>
					
					{/* {JSON.stringify(villName, null, 2)} */}

						</div>
					</div>


					

					{/* {userDetails?.id != 3 &&  */}
					<BtnComp mode="A" onReset={formik.resetForm} param={params?.id} />
					{/* } */}
				</form>
			</Spin>

			<DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				 onPressYes={() => {
	if (pendingValues) {
		// if(params?.id > 0) {
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

			{/* <DialogBox
  onPress={() => setVisible(!visible)}
  visible={visible}
  onPressYes={() => {
	if (pendingValues) {
	  editGroup(pendingValues);   // 🔥 pass values here
	}
	setVisible(false);
  }}
  onPressNo={() => setVisible(false)}
/> */}

			{/* <DialogBox
				// flag={flag}
				// data={flag == 5 ? group_code : ""}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {
					// console.log(flag,'oooooooooooooooooooooo');
					
					// if (flag == 4) {
						editGroup()
					// } else {
					// 	if (params?.id < 1) {
					// 		navigate(`/homebm/searchgroup/`)
					// 	}

					// 	if (params?.id > 0) {
					// 		// editGroup()
					// 		navigate(`/homebm/searchgroup/`)
					// 	}
					// }
					setVisible(!visible)
				}}
				onPressNo={() => setVisible(!visible)}
			/> */}

			

			

			
		</>
	)
}

export default AddGroupExtendedForm_BDCCB
