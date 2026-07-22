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

// const weaker_section = [
// 	{
// 		label: "Yes",
// 		value: "Y",
// 	},
// 	{
// 		label: "No",
// 		value: "N",
// 	},
// ]

// const groupLeader = [
// 	{
// 		label: "Yes",
// 		value: "Y",
// 	},
// 	{
// 		label: "No",
// 		value: "N",
// 	},
// ]



// const mapOptions = {
//   disableDefaultUI: true,
//   gestureHandling: 'none',
//   zoomControl: false,
//   draggable: false,
//   scrollwheel: false,
//   disableDoubleClickZoom: true,
// };
// const formatINR = (num) =>
// 	new Intl.NumberFormat("en-IN", {
// 		style: "currency",
// 		currency: "INR",
// 		minimumFractionDigits: 2,
// 	}).format(num || 0)

// 	const form_validationSchema = Yup.object({
// 		member_from: Yup.string().required("** This field is mandatory"),
// 		member_to: Yup.string().required("** This field is mandatory").test('not-same', 'From and To cannot be the same', function (value) {
//       		return value !== this.parent.member_from;
//     	}),
// 	})
function SahayikaExtendedForm({ groupDataArr }) {
// 	const markers = [
//   { id: 1, position: { lat: 40.748817, lng: -73.985428 }, title: 'Empire State Building' },
//   { id: 2, position: { lat: 40.689247, lng: -74.044502 }, title: 'Statue of Liberty' },
//   { id: 3, position: { lat: 40.706192, lng: -74.009160 }, title: 'Wall Street' },
// ];
// const center = {
//   lat: 40.748817,
//   lng: -73.985428,
// };
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

	// const [districts, setDistricts] = useState(
	// 		userDetails[0]?.district_list?.map((item, i) => ({
	// 		code: item?.dist_code,
	// 		name: item?.dist_name,
	// 		}))
	// 	)
	// const [masterData, setMasterData] = useState({
	// 		dist_id: "", block_id: "", gp_id:"" , ps_id:"", po_id:"", village_id:"", branch_code: ""
	// 	})
	
	const [blocks, setBlocks] = useState(() => [])
	const [gpList, setGPList] = useState(() => [])
	const [policeStation, setPoliceStation] = useState(() => [])
	const [postOffice, setPostOffice] = useState(() => [])
	const [gpName, setGpName] = useState(() => [])
	const [villName, setVillName] = useState(() => [])
	const [branch, setBranch] = useState(() => [])

	const [groupData, setGroupData] = useState(() => [])
	const [dobDate, setDOBDate] = useState(loanAppData?.dob)

	const [visible, setVisible] = useState(() => false)
	// console.log(loanAppData, "loanAppDataloanAppDataloanAppDataloanAppData", groupDataArr)
	const [radioWeaker, setRadioWeaker] = useState("Y")
	const [radioLeader, setRadioLeader] = useState("Y")
	const [groupList, setGroupList] = useState(() => [])

	const initialValues = {
		sahayika_name: "",
		phone_no: "",
		branch_id: "",
		address: "",
	}
	const [formValues, setValues] = useState(initialValues)

	const validationSchema = Yup.object({

		sahayika_name: Yup.string().required("Sahayika name is required"),
		phone_no: Yup.string().required("Phone is required"),
		branch_id: Yup.string().required("Branch is required"),
		address: Yup.string().required("Address is required"),
	})



	// const handleCancel = () => {
	// 	setIsModalOpen(false);
	// };


	const onChange2 = (e) => {
		console.log("radio1 checked", e)
		setRadioWeaker(e)
	}

	const onChangeLeader = (e) => {
		console.log("radio1 checked", e)
		setRadioLeader(e)
	}


	// const searchBank_branch_IFSC = async (bank_code) => {
	// const result = bankName.find(item => item.bank_code === bank_code);
	// formik.setFieldValue('g_bank_branch', result?.bank_branch);
	// formik.setFieldValue('g_ifsc', result?.ifsc);
	// }

	const toInputDate = (ddmmyyyy) => {
  if (!ddmmyyyy) return "";

  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

	const toAPIDate = (yyyymmdd) => {
	if (!yyyymmdd) return "";
	const [yyyy, mm, dd] = yyyymmdd.split("-");
	return `${dd}-${mm}-${yyyy}`;
	};

	useEffect(() => {
		if (params?.id > 0) {
			// fetchMemberGroups()
		}

		if (params?.id > 0) {

		// const formattedDob = toInputDate(loanAppData?.dob);

		setValues({
		branch_id: loanAppData?.branch_id,
		sahayika_name: loanAppData?.sahayika_name,
		phone_no: loanAppData?.phone_no,
		address: loanAppData?.address,
		})

		// setDOBDate(loanAppData?.dob)

		}

		fetchGroupsList()
		fetchBranch()


		console.log(userDetails[0], 'ggggggggggggggggg', loanAppData?.dist_id);
		

	}, [])

	const [pendingValues, setPendingValues] = useState(null);

	// wherever you open popup (e.g. on submit)
	const handleOpenConfirm = (values) => {
	setPendingValues(values);   // store formik values
	setVisible(true);           // open dialog
	};
	
	const onSubmit = async (values) => {
		// setVisible(true)
		// if (params?.id > 0) {
		// 	editMember(values)
		// }
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

	const editMember = async (formData) => {
				setLoading(true)

				// const formattedDob = toInputDate(formData?.dob);
			// console.log(formattedDob, 'gggggggggggggg', formData?.dob);
			
			// 	return
			
				const ip = await getClientIP()
			
				const creds = {
				sahayika_id: loanAppData?.sahayika_id,
				dist_id: loanAppData?.dist_id,
				tenant_id: userDetails[0]?.tenant_id,
				branch_id: formData?.branch_id,
				sahayika_name: formData?.sahayika_name,
				phone_no: formData?.phone_no,
				address: formData?.address,
				created_by: userDetails[0]?.emp_id,
				created_at: "",
				ip_address: ip,
				}



				console.log(creds, 'credscredscredscreds', formData);
				
			
				await saveMasterData({
				endpoint: "trans/save_sahayika",
				creds,
				navigate,
				successMsg: "Member details saved.",
				onSuccess: () => navigate(-1),
			
				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
				})
			
				setLoading(false)
				}

	const saveMemberData = async (formData) => {
				setLoading(true)
				const formattedDob = toInputDate(loanAppData?.dob);
			
				const ip = await getClientIP()
			
				const creds = {
				sahayika_id: 0,
				dist_id: 2,
				tenant_id: userDetails[0]?.tenant_id,
				branch_id: formData?.branch_id,
				sahayika_name: formData?.sahayika_name,
				phone_no: formData?.phone_no,
				address: formData?.address,
				created_by: userDetails[0]?.emp_id,
				created_at: "",
				ip_address: ip,
				}

// 				{
// "sahayika_id":"130000001",
// "dist_id":"2",
// "tenant_id":"13",
// "branch_id":"2",
// "sahayika_name":"Shaterevcffdddddds branch",
// "phone_no":"8989898989",
// "address":"Kolkat west bengal",
// "created_by":"test",
// "created_at":"date time",
// "created_ip":"10.10.10.10"
// }

				console.log(creds, 'credscredscredscreds', formData);
				
			
				await saveMasterData({
				endpoint: "trans/save_sahayika",
				creds,
				navigate,
				successMsg: "Sahayika details saved.",
				onSuccess: () => navigate(-1),
			
				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
				})
			
				setLoading(false)
				}



const fetchMemberGroups = async () => {

		// console.log(searchKeywords, 'search', userDetails[0]?.brn_code);
		
		setLoading(true)
		const creds = {
		member_name: params?.id,
		branch_code: userDetails[0]?.brn_code,
		}
		const tokenValue = await getLocalStoreTokenDts(navigate);
		await axios.post(`${url_bdccb}/member/fetch_member_details`, creds, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
		.then((res) => {
console.log(res?.data?.data, 'searchffffffffffffffffffff', params?.id, '', res?.data?.data[0]);
	if(res?.data?.success){

		const formattedDob = toInputDate(res?.data?.data[0]?.dob);
		setRadioWeaker(res?.data?.data[0]?.weaker_section)
		setRadioLeader(res?.data?.data[0]?.gp_leader_flag)
	setValues({
		g_group_name: res?.data?.data[0]?.group_code,
		member_name: res?.data?.data[0]?.member_name,

		// g_group_type: "J",
		gender: res?.data?.data[0]?.gender,
		dob: formattedDob,
		g_address: res?.data?.data[0]?.address,
		gurdian_name: res?.data?.data[0]?.gurdian_name,
		g_pin: res?.data?.data[0]?.pin_no,
		g_phone1: res?.data?.data[0]?.phone_no,
		aadhar_no: res?.data?.data[0]?.aadhar_no,
		pan_no: res?.data?.data[0]?.pan_no,
		voter_id: res?.data?.data[0]?.voter_id,
		caste: res?.data?.data[0]?.caste,
		education: res?.data?.data[0]?.education,
		occupation: res?.data?.data[0]?.occupation,
		religion: res?.data?.data[0]?.religion,
		})
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


const fetchGroupsList = async () => {

		// console.log(searchKeywords, 'search', userDetails[0]?.brn_code);
		
		setLoading(true)
		const creds = {
		branch_code: userDetails[0]?.brn_code,
		}
		const tokenValue = await getLocalStoreTokenDts(navigate);
		await axios.post(`${url_bdccb}/member/fetch_group_list`, creds, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
		.then((res) => {

	if(res?.data?.success){
		console.log(res?.data?.data, 'searchffffffffffffffffffff', params?.id, '', userDetails[0]?.brn_code);
		setGroupList(res?.data?.data.map(item => ({
		code: item.group_code,
		name: item.group_name
		})))
	// 	const formattedDob = toInputDate(res?.data?.data[0]?.dob);
	// setValues({
	// 	g_group_name: res?.data?.data[0]?.group_name,
	// 	member_name: res?.data?.data[0]?.member_name,

	// 	// g_group_type: "J",
	// 	gender: res?.data?.data[0]?.gender,
	// 	dob: formattedDob,
	// 	g_address: res?.data?.data[0]?.address,
	// 	gurdian_name: res?.data?.data[0]?.gurdian_name,
	// 	g_pin: res?.data?.data[0]?.pin_no,
	// 	g_phone1: res?.data?.data[0]?.phone_no,
	// 	aadhar_no: res?.data?.data[0]?.aadhar_no,
	// 	pan_no: res?.data?.data[0]?.pan_no,
	// 	voter_id: res?.data?.data[0]?.voter_id,
	// 	caste: res?.data?.data[0]?.caste,
	// 	education: res?.data?.data[0]?.education,
	// 	occupation: res?.data?.data[0]?.occupation,
	// 	religion: res?.data?.data[0]?.religion,
	// 	})
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

	const fetchBranch = async () => {
		setLoading(true)

		// const creds = {
		// 	prov_grp_code: 0,
		// 	user_type: userDetails?.id,
		// 	branch_code: userDetails?.brn_code,
		// }

			const tokenValue = await getLocalStoreTokenDts(navigate);
		// console.log({dist_id: 0, tenant_id: userDetails[0]?.tenant_id , branch_id: 0}, 'userDetailsuserDetailsuserDetails');
		
			await axios
				.get(`${url_bdccb}/master/branch_list`, {
					params: {
					dist_id: 0, tenant_id: userDetails[0]?.tenant_id ,branch_id: 0
					},
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {

	
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


	const handleChangeMaster = (e) => {
  const { name, value } = e.target

//   setMasterData((prev) => {
//     const updated = {
//       ...prev,
//       [name]: value,
//     }

//     // when district changes
//     if (name === "dist_id") {
	
// 	if(value.length > 0){
// 		fetchBlock(value)
// 		fetchPoliceStation(value)
// 		fetchPosOffice(value)
// 		fetchBranch(value)
// 		console.log('load district');
		
// 	} else {
// 		setBlocks([])
// 		setPoliceStation([])
// 		setPostOffice([])
// 		setBranch([])
// 		console.log('reset district');
// 	}
// 	updated.block_id = ""
// 	updated.ps_id = ""
// 	updated.po_id = ""
// 	updated.gp_id = ""
// 	updated.village_id = ""
// 	updated.branch_code = ""

//     }

//     // when block changes → call API with latest values
//     if (name === "block_id") {
// 	if(updated.dist_id.length > 0 && value.length > 0){
// 		console.log(value, 'valuevaluevaluevaluevalue');
		
// 	fetchGPList(updated.dist_id, value)
// 	} else {
// 	setGpName([])
// 	}
// 	updated.gp_id = ""
// 	updated.village_id = ""
//     }

// 	if (name === "gp_id") {
// 	if(updated.dist_id.length > 0 && value.length > 0 && updated.gp_id.length > 0){
// 	fetchVillList(updated.dist_id, updated.block_id, updated.gp_id);
// 	} else {
// 	setGpName([])
// 	}
//     // updated.block_id = ""
// 	// updated.block_id = ""
// 	// updated.block_id = ""
//     }

//     return updated
//   })
}

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
						<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-3"}>

							
							<div>
								
{/* {JSON.stringify(formik.values.g_group_name, null, 2)} */}
								<TDInputTemplateBr
									placeholder="Sahayika Name"
									type="text"
									label="Sahayika Name"
									name="sahayika_name"
									formControlName={formik.values.sahayika_name} // Default to SHG
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									// data={groupList}
									mode={1}
									// disabled={true}
								/>
						
								{formik.errors.sahayika_name && formik.touched.sahayika_name ? (
									<VError title={formik.errors.sahayika_name} />
								) : null}
							</div>

							

							<div>
								<TDInputTemplateBr
									placeholder="Phone No."
									type="text"
									label="Phone No."
									name="phone_no"
									formControlName={formik.values.phone_no} // Default to SHG
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									// data={groupList}
									mode={1}
									// disabled={true}
								/>
								{formik.errors.phone_no && formik.touched.phone_no ? (
									<VError title={formik.errors.phone_no} />
								) : null}
							</div>



							<div>
								
							<TDInputTemplateBr
							placeholder="Select Branch..."
							type="text"
							label="Branch"
							name="branch_id"
							formControlName={formik.values.branch_id}
							handleChange={formik.handleChange}
							handleBlur={formik.handleBlur}
							data={branch}
							mode={2}
							/>
							{formik.errors.branch_id && formik.touched.branch_id ? (
							<VError title={formik.errors.branch_id} />
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
									name="address"
									formControlName={formik.values.address}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={3}
								/>
								{formik.errors.address && formik.touched.address ? (
									<VError title={formik.errors.address} />
								) : null}
								</div>
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
      if(params?.id > 0) {
			editMember(pendingValues);
		} else {
			saveMemberData(pendingValues) 
		}   // 🔥 pass values here
    }
    setVisible(false);
  }}
				onPressNo={() => setVisible(!visible)}
			/>

			

			

			

			
		</>
	)
}

export default SahayikaExtendedForm
