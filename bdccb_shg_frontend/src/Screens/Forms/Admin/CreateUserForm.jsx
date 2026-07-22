import React, { useEffect, useState } from "react"
import "../../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import BtnComp from "../../../Components/BtnComp"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Message } from "../../../Components/Message"
import { url, url_bdccb } from "../../../Address/BaseUrl"
import { Badge, Spin, Card, Popconfirm } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { useLocation } from "react-router"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import DialogBox from "../../../Components/DialogBox"
import { MultiSelect } from "primereact/multiselect"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
import { useFormik } from "formik"
import * as Yup from "yup"
import Radiobtn from "../../../Components/Radiobtn"


const user_status = [
		{
		label: "Approve",
		value: "Y",
		},
		{
		label: "Unapprove",
		value: "N",
		},
		{
		label: "Block",
		value: "B",
		}
]

function CreateUserForm() {
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const userState = location.state || {}

	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))

	const [visible, setVisible] = useState(() => false)
	const [radioBtnStatus, setRadioBtnStatus] = useState("Y")
	const [masterData, setMasterData] = useState([])

	const [pendingValues, setPendingValues] = useState(null);


	const [masterUserData, setMasterUserData] = useState({
		finance_module: "N",
	})
	
	const initialValues = {
	user_name: "",
	user_id: "",
	designation: "",
	finance_module: "",
	user_type: ""
	}
	const [formValues, setValues] = useState(initialValues)

	const validationSchema = Yup.object({
	user_name: Yup.string(),
	user_id: Yup.string(),
	designation: Yup.string(),
	finance_module: Yup.string(),
	user_type: Yup.string(),
	})


	const handleOpenConfirm = (values) => {
	setPendingValues(values);
	setVisible(true);
	};


	const onSubmit = (values) => {
	console.log("Formik Values:", values);
	handleOpenConfirm(values);
	};

	const formik = useFormik({
	initialValues: + params?.id != 0 ? formValues : initialValues,
	onSubmit,
	validationSchema,
	validateOnChange: true,
	validateOnBlur: true,
	enableReinitialize: true,
	validateOnMount: true,
	})

		const onChange = (e) => {
		console.log("radio1 checked", e)
		setRadioBtnStatus(e)
	}

	const handleChangeForm = (e) => {
		const { name, type, checked, value } = e.target
		if (type === "checkbox" && name === "finance_module") {
			if(radioBtnStatus == 'N' || radioBtnStatus == 'B'){
				return setMasterUserData({finance_module: "N"})
			}

			setMasterUserData((prev) => ({
				...prev,
				finance_module: checked ? "Y" : "N",
			}))
		} else {
			setMasterUserData((prev) => ({
				...prev,
				[name]: value,
			}))
		}
	}



	useEffect(() => {
	if(radioBtnStatus == 'N' || radioBtnStatus == 'B'){
		setMasterUserData({finance_module: "N"})
	}
	}, [radioBtnStatus])



	const onReset = () => {
		fetchUserDetails()
	}


	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const handleUpdateForm = async (values) =>{
		setLoading(true)


		const ip = await getClientIP()


		const creds = {
			add_edit_flag: 1,
			user_id: values?.user_id,
			pwd: '',
			default_pass: masterUserData.finance_module,
			tenant_id: 1,
			branch_id: masterData[0]?.brn_code,
			user_type: values?.user_type,
			active_flag: radioBtnStatus,
			user_name: values?.user_name,
			phone_mobile: 0,
			shg_id: '', 
			designation: values?.designation,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
		}

		console.log(values, 'sssssssssssssssssssss', creds);
		// return;

		await axios
			.post(`${url_bdccb}/user/save_user`, creds, {
			headers: {
			Authorization: ``, // example header
			"Content-Type": "application/json", // optional
			}
		})
			.then((res) => {
				
				
				if(res?.data?.success){
				navigate(routePaths.MANAGE_USER)
				formik.resetForm()
				// setUserIDAvailableMsg('')
				// setUserIDAvailable(null)
				} else {
				Message('error', res?.data?.msg)
				// navigate(routePaths.LANDING)
				// localStorage.clear()
				}

			})
			.catch((err) => {
				Message("error", "Some error on server while logging in...")
			})

		setLoading(false)
		
	}

	const handleSaveForm = async () =>{
		console.log('handleSaveForm');
		
	}


	useEffect(() => {
		fetchUserDetails()
	}, [])

	const fetchUserDetails = async () => {
		setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/user/user_list`, {
		params: {
			tenant_id: userDetails[0]?.tenant_id, 
			branch_id: userDetails[0]?.user_type == 'H' ? 0 : userDetails[0]?.brn_code, 
			user_type: userDetails[0]?.user_type == 'B' ? 'P' : userDetails[0]?.user_type == 'P' ? 'S' : '',
			user_status: userState?.active_flag,
			branch_type: userDetails[0]?.user_type,
			user_id: params?.id
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		}
		})
			.then((res) => {
				console.log(res?.data?.data, 'resresresresres', res?.data?.data[0]?.active_flag);

				if(res?.data?.success){
				

				setMasterData(res?.data?.data)

				setValues({
				user_name: res?.data?.data[0]?.user_name,
				user_id: res?.data?.data[0]?.user_id,
				designation: res?.data?.data[0]?.designation,
				user_type: res?.data?.data[0]?.user_type,
				})
				setRadioBtnStatus(res?.data?.data[0]?.active_flag)

				

				// setCopyLoanApplications(res?.data?.data)
				} else {
				Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()

				}

			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching users!")
				console.log("ERRR", err)
			})
		setLoading(false)
	}


	

	return (
		<>
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<form onSubmit={formik.handleSubmit}>
					{/* {JSON.stringify(formValues, 2)} */}
					 {/* {JSON.stringify(masterData, 2)}
					 {JSON.stringify(masterData[0]?.brn_code, 2)} */}
					 {/* {JSON.stringify(params?.id == 0, 2)} */}
					<div>
						<div>
							<div className="grid gap-4 sm:grid-cols-6 sm:gap-6">
								<div className="sm:col-span-2">
									
									<TDInputTemplateBr
									placeholder="User Name"
									type="text"
									label="User Name"
									name="user_name"
									handleChange={formik.handleChange}
									// handleChange={handleFormikMasterChange} 
									handleBlur={formik.handleBlur}
									formControlName={formik.values.user_name}
									mode={1}
									disabled
									/>
								</div>
								<div className="sm:col-span-2">
									<TDInputTemplateBr
									placeholder="User ID..."
									type="text"
									label="User ID"
									name="user_id"
									handleChange={formik.handleChange}
									// handleChange={handleFormikMasterChange} 
									handleBlur={formik.handleBlur}
									formControlName={formik.values.user_id}
									mode={1}
									disabled
									/>
								</div>
								
								<div className="sm:col-span-2">
									<TDInputTemplateBr
										placeholder="Designation"
										type="text"
										label="Designation"
										name="designation"
										formControlName={formik.values.designation}
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										mode={1}
										disabled
									/>
								</div>

								<div className="sm:col-span-2">
									<TDInputTemplateBr
										placeholder="User Type"
										type="text"
										label="User Type"
										name="user_type"
										formControlName={formik.values.user_type == 'B'? 'Branch' : formik.values.user_type == 'P'? 'PACS' : formik.values.user_type == 'S'? 'SHG' : ''}
										handleChange={formik.handleChange}
										handleBlur={formik.handleBlur}
										mode={1}
										disabled
									/>
								</div>
								
								

								<div className={"sm:col-span-2"}>
									<label className="inline-flex items-center me-5 cursor-pointer">
										<input
											type="checkbox"
											value={masterUserData.finance_module}
											name="finance_module"
											className="sr-only peer"
											onChange={handleChangeForm}
											checked={masterUserData.finance_module === "Y"}
										/>
										<div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500 dark:peer-checked:bg-teal-500"></div>
										<span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
											Default Password?
										</span>
									</label>
								</div>

								<div className={"sm:col-span-2 radio_btn_user"}>
									<Radiobtn
									data={user_status}
									val={radioBtnStatus}
									onChangeVal={(value) => {
									onChange(value)
									}}
									/>
								</div>

								
							</div>
							{/* {+params?.id > 0 && (
								<div className="float-right pt-4">
									<Popconfirm
										title={`Reset Passowrd`}
										description={
											<>
												<div>Are you sure you want to reset password?</div>
												<div>Password will be, "SSVWS@2025"</div>
											</>
										}
										onConfirm={() => confirm()}
										onCancel={cancel}
										okText="Reset"
										cancelText="No"
									>
										<div className="text-red-500 cursor-pointer underline">
											Reset Password?
										</div>
									</Popconfirm>
								</div>
							)} */}
						</div>

						<div className="mt-10">
							{/* <BtnComp mode="A" onReset={onReset} /> */}
							<BtnComp mode="A" onReset={onReset} param={params?.id} />
						</div>
					</div>
				</form>
			</Spin>


			<DialogBox
			flag={4}
			onPress={() => setVisible(!visible)}
			visible={visible}
			onPressYes={() => {
			if (pendingValues) {
			if(params?.id != 0) {
			handleUpdateForm(pendingValues);
			} else {
			handleSaveForm(pendingValues) 
			}

			// 🔥 pass values here
			}
			setVisible(false);
			}}
			onPressNo={() => setVisible(!visible)}
			/>


			{/* <DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {
					console.log(masterUserData)
					if (+params?.id > 0) {
						
						handleUpdateForm()
					} else {
						handleSaveForm()
					}
					// ;+params?.id > 0 ? handleUpdateForm() : handleSaveForm()
					setVisible(!visible)
				}}
				onPressNo={() => setVisible(!visible)}
			/> */}



		</>
	)
}

export default CreateUserForm
