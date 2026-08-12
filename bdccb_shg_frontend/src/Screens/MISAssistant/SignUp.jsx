import React, { useEffect, useState } from "react"
import * as Yup from "yup"
import { Link, NavLink } from "react-router-dom"
import { useFormik } from "formik"
import { useNavigate } from "react-router-dom"
import IMG from "../../Assets/Images/sign_in.png"
import LOGO from "../../Assets/Images/ssvws_logo.jpg"
import { routePaths } from "../../Assets/Data/Routes"
import VError from "../../Components/VError"
import TDInputTemplate from "../../Components/TDInputTemplate"
import axios from "axios"
import { Select, Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { motion } from "framer-motion"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import Radiobtn from "../../Components/Radiobtn"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import HomeIcon from '@mui/icons-material/Home';
import { Height, Visibility, VisibilityOff } from "@mui/icons-material"
import { BDCCBEmblem } from "../../Components/BDCCBLogo"
import BDCCBFullHeaderLogo from "../../Components/BDCCBFullHeaderLogo"


const department = [
	{
		label: "Branch",
		value: "B",
	},
	{
		label: "PACS",
		value: "P",
	},
	// {
	// 	label: "SHG",
	// 	value: "S",
	// }
]

function SignUp() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	// const [loginUserDetails, setLoginUserDetails] = useState(() => "")
	const [branch, setBranch] = useState(() => [])
	const [departmentStatus, setDepartmentStatus] = useState("B")
	const [uerIDAvailable, setUserIDAvailable] = useState(null)
	const [uerIDAvailableMsg, setUserIDAvailableMsg] = useState("")
	const [PACS_SHGList, setPACS_SHGList] = useState([]);
	const [showPassword, setShowPassword] = useState(false);
	const [showPassword_2, setShowPassword_2] = useState(false);

	const initialValues = {
		// departmentStatus: "B",
		branch_id: "",
		shg_group: "",
		user_name: "",
		desig_name: "",
		user_id: "",
		password: "",
		cnf_password: "",
	}
	const [formValues, setValues] = useState(initialValues)

	const validationSchema = Yup.object({
		branch_id: Yup.string().required("Branch is required"),
		// shg_group: Yup.string().when("departmentStatus", {
		// 	is: "S",
		// 	then: (schema) => schema.required("SHG Group is required"),
		// 	otherwise: (schema) => schema.notRequired(),
		// }),
		shg_group: Yup.string(),
		user_name: Yup.string().required("User Name is required"),
		desig_name: Yup.string().required("Designation is required"),
		user_id: Yup.string()
			.matches(/^[a-zA-Z0-9@.]+$/, "User ID must be valid")
			.required("User ID is required"),
		// password: Yup.string().required("Password is required"),
		// cnf_password: Yup.string().required("Confirm Password is required"),

		password: Yup.string()
			.min(6, "Password must be at least 6 characters")
			.required("Password is required"),

		cnf_password: Yup.string()
			.oneOf([Yup.ref("password"), null], "Passwords must match")
			.required("Confirm Password is required"),

	})

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const handleEmployeeIdChange = async (value) => {
		setLoading(true)
		setUserIDAvailable(null)
		// formik.handleBlur(e)

		// return;
		const creds = {
			emp_id: value,
		}
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.get(`${url_bdccb}/user/checkuser`, {
		params: {user_id: value},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
		.then((res) => {

			console.log(res?.data?.user_status, "user_idddddddddddddddd", res?.data)
			if(res?.data?.success){
				const msg = res?.data?.msg || ""
				const is10Digit = msg.toLowerCase().includes("10 digit") || msg.toLowerCase().includes("10-digit")

				if(res?.data?.user_status === 0){ // Available User ID
					setUserIDAvailable(true)
					setUserIDAvailableMsg(is10Digit ? "" : msg)
				}

				if(res?.data?.user_status === 1){ // Exist User ID
					if (is10Digit) {
						setUserIDAvailable(null)
						setUserIDAvailableMsg("")
					} else {
						setUserIDAvailable(false)
						setUserIDAvailableMsg(msg)
					}
				}
			
			} else {
				const msg = res?.data?.msg || ""
				if (!msg.toLowerCase().includes("10 digit")) {
					Message('error', msg)
				}
			}
		// if(res?.data?.suc === 0){
		// navigate(routePaths.LANDING)
		// localStorage.clear()
		// } else {
		// Message("success", res?.data?.msg)
		// }

			})
			.catch((err) => {
				console.log("ERRR FETCH", err)
			})
		setLoading(false)
	}

	const onSubmit = async (values) => {
		setLoading(true)

		if (departmentStatus === 'S') {
			if(values.shg_group.length < 1){
			Message("error", "Please Select SHG Group")
			setLoading(false)
			return
			}
			
		}

		console.log(values, 'formmmmmmmmmmmmmmmmmmmmmmmmm')

		const ip = await getClientIP()

		if (values?.password !== values?.cnf_password) {
			Message("warning", "Password mismatch!")
			setLoading(false)
			return
		}

		const creds = {
			add_edit_flag: 0,
			user_id: values?.user_id,
			pwd: values?.password,
			default_pass: 0,
			tenant_id: 1,
			branch_id: values?.branch_id,
			user_type: departmentStatus,
			active_flag: 'N',
			user_name: values?.user_name,
			phone_mobile: 0,
			shg_id: values?.shg_group, 
			designation: values?.desig_name,
			created_by: values?.user_name,
			ip_address: ip,
		}

		await axios
			.post(`${url_bdccb}/user/save_user`, creds, {
			headers: {
			Authorization: ``, // example header
			"Content-Type": "application/json", // optional
			}
		})
			.then((res) => {
				if(res?.data?.success){
				console.log(res?.data, 'signnnnnnnnnnnnnnnnnn');
				
				navigate(routePaths.SIGN_UP)
				formik.resetForm()
				setUserIDAvailableMsg('')
				setUserIDAvailable(null)
				Message('success', res?.data?.msg)
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

	

	const formik = useFormik({
		initialValues,
		onSubmit,
		validationSchema,
		validateOnMount: true,
	})

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setDepartmentStatus(e)
		// formik.setFieldValue("departmentStatus", e)
  		// formik.setFieldValue("shg_group", "") 
	}

	useEffect(() => {
		formik.resetForm()
	}, [departmentStatus])

	useEffect(()=>{
		if(departmentStatus == 'B'){
			fetchBranch()
		} 

		if(departmentStatus == 'P'){
			fetchBranch_ForPacs()
		} 
		
	}, [departmentStatus])

	const fetchBranch = async () => {
			setLoading(true)
				const tokenValue = await getLocalStoreTokenDts(navigate);
			
				await axios
					.get(`${url_bdccb}/master/branch_list`, {
						params: {
						dist_id: 0, tenant_id: 1 ,branch_id: 0, branch_type: departmentStatus
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

	const fetchBranch_ForPacs = async () => {
			setLoading(true)
				const tokenValue = await getLocalStoreTokenDts(navigate);
			
				await axios
					.get(`${url_bdccb}/master/pacs_list`, {
						params: {
						dist_id: 0, tenant_id: 1 ,branch_id: 0, branch_type: departmentStatus
						},
				headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
				},
				})
				.then((res) => {
	
				// console.log(res?.data?.data, 'xxxxxxxxxxxxxxxxxxx');
		
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
	
		


		const handleSearchChange = async (value) => {
				if(value.length < 3){
					// Message("error", "Minimum type 3 character")
					return;
				}
		
		
				setPACS_SHGList([])
				setLoading(true)
				const creds = {
				// loan_to : formik.values.loan_to,
				loan_to : 'S',
				branch_code : formik.values.branch_id,
				branch_shg_id : value,
				tenant_id: 1,
				}
		
				const tokenValue = await getLocalStoreTokenDts(navigate);
		
				await axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
				headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
				},
				})
				.then((res) => {
		
				if(res?.data?.success){

				console.log(res?.data, 'ddddddddddddddddddddddd', formik.values.branch_id);
			
				
				setPACS_SHGList(res?.data?.data?.map((item, i) => ({
				code: item?.group_code,
				name: item?.group_name,
				})))
		
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



	return (
		<div className="flex items-center justify-center min-h-screen bg-slate-800 p-4 md:p-6">
			<div className="relative bg-white rounded-3xl shadow-xl overflow-hidden max-w-5xl w-full p-6 md:p-8 z-10">
				<div>
					{/* Header with Full Bank Logo Image */}
					<div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
						<BDCCBFullHeaderLogo />
					</div>

					{/* Title with Arrow to Login Page */}
					<div className="flex items-center gap-2 mb-4">
						<button
							type="button"
							onClick={() => navigate("/")}
							className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
							title="Back to Login"
						>
							<ArrowBackIcon fontSize="medium" />
						</button>
						<h1 className="text-2xl font-bold text-slate-800">
							Registration
						</h1>
					</div>

					{/* Form */}
					<form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
						{/* Department Radio Selection */}
						<div className="radioBtn_Signup mb-1">
							<Radiobtn
								data={department}
								val={departmentStatus}
								onChangeVal={(value) => {
									onChange(value)
								}}
							/>
						</div>

						{/* Row 1: Select Branch (col-6) & User Name (col-6) aligned */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
							<div>
								<label className="block mb-2 text-sm capitalize font-bold text-slate-800">
									Select Branch <span className="text-red-500">*</span>
								</label>
								<Select
									showSearch
									placeholder="Select Branch..."
									value={formik.values.branch_id || undefined}
									style={{ width: "100%", height: "38px" }}
									name="branch_id"
									optionFilterProp="label"
									filterOption={(input, option) =>
										option?.label?.toLowerCase().includes(input.toLowerCase())
									}
									onChange={(value) => {
										formik.setFieldValue("branch_id", value)
									}}
									onBlur={formik.handleBlur}
								>
									{branch?.map((item) => (
										<Select.Option key={item.code} value={item.code} label={item.name}>
											{item.name}
										</Select.Option>
									))}
								</Select>
								{formik.errors.branch_id && formik.touched.branch_id ? (
									<VError title={formik.errors.branch_id} />
								) : null}
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Type user name..."
									type="text"
									label="User Name"
									name="user_name"
									formControlName={formik.values.user_name}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
								/>
								{formik.errors.user_name && formik.touched.user_name ? (
									<VError title={formik.errors.user_name} />
								) : null}
							</div>
						</div>

						{/* SHG Group selection if department is 'S' */}
						{departmentStatus === "S" && (
							<div>
								<label className="block mb-2 text-sm capitalize font-bold text-slate-800">
									Select SHG Group
								</label>
								<Select
									showSearch
									placeholder={"Choose SHG Group"}
									value={formik.values.shg_group}
									style={{ width: "100%", height: "38px" }}
									optionFilterProp="children"
									name="shg_group"
									onSearch={(value) => {
										handleSearchChange(value)
									}}
									onChange={(value) => {
										formik.setFieldValue("shg_group", value)
									}}
									onBlur={formik.handleBlur}
									filterOption={(input, option) =>
										option?.children?.toLowerCase().includes(input.toLowerCase())
									}
								>
									<Select.Option value="" disabled>
										Choose SHG Group
									</Select.Option>
									{PACS_SHGList?.map((data) => (
										<Select.Option key={data.code} value={data.code}>
											{data.name}
										</Select.Option>
									))}
								</Select>
								{formik.errors.shg_group && formik.touched.shg_group ? (
									<VError title={formik.errors.shg_group} />
								) : null}
							</div>
						)}

						{/* Row 2: Designation & User ID */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<TDInputTemplateBr
									placeholder="Type designation..."
									type="text"
									label="Designation"
									name="desig_name"
									formControlName={formik.values.desig_name}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
								/>
								{formik.errors.desig_name && formik.touched.desig_name ? (
									<VError title={formik.errors.desig_name} />
								) : null}
							</div>

							<div>
								<TDInputTemplateBr
									placeholder="Type user id..."
									type="text"
									label="User ID"
									name="user_id"
									formControlName={formik.values.user_id}
									handleChange={(e) => {
										const value = e.target.value.replace(/[^a-zA-Z0-9@.]/g, "");
										formik.setFieldValue("user_id", value);
										if (value) {
											handleEmployeeIdChange(value);
										}
									}}
									handleBlur={formik.handleBlur}
									onChange={() => {}}
									mode={1}
								/>
								{formik.errors.user_id && formik.touched.user_id ? (
									<VError title={formik.errors.user_id} />
								) : null}
								{uerIDAvailable === false && uerIDAvailableMsg && !uerIDAvailableMsg.toLowerCase().includes("10 digit") && (
									<p className="text-red-600 text-xs mt-0.5 font-semibold">
										{uerIDAvailableMsg} ✗
									</p>
								)}
								{uerIDAvailable === true && (
									<p className="text-green-600 text-xs mt-0.5 font-semibold">
										{uerIDAvailableMsg} ✓
									</p>
								)}
							</div>
						</div>

						{/* Row 3: Password & Confirm Password */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="relative">
								<TDInputTemplateBr
									placeholder="*****"
									type={showPassword ? "text" : "password"}
									label="New Password"
									name="password"
									formControlName={formik.values.password}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
								/>
								{formik.errors.password && formik.touched.password ? (
									<VError title={formik.errors.password} />
								) : null}
								<div
									className="absolute right-0 pr-3 flex items-center cursor-pointer"
									onClick={() => setShowPassword((prev) => !prev)}
									style={{ height: "38px", top: "27px", right: 0 }}
								>
									{showPassword ? (
										<VisibilityOff className="text-slate-700" />
									) : (
										<Visibility className="text-slate-700" />
									)}
								</div>
							</div>

							<div className="relative">
								<TDInputTemplateBr
									placeholder="*****"
									type={showPassword_2 ? "text" : "password"}
									label="Confirm Password"
									name="cnf_password"
									formControlName={formik.values.cnf_password}
									handleChange={formik.handleChange}
									handleBlur={formik.handleBlur}
									mode={1}
								/>
								{formik.errors.cnf_password && formik.touched.cnf_password ? (
									<VError title={formik.errors.cnf_password} />
								) : null}
								{formik.values.cnf_password &&
									formik.values.password === formik.values.cnf_password && (
										<p className="text-green-600 text-xs mt-0.5 font-semibold">
											Passwords match ✓
										</p>
									)}
								<div
									className="absolute right-0 pr-3 flex items-center cursor-pointer"
									onClick={() => setShowPassword_2((prev) => !prev)}
									style={{ height: "38px", top: "27px", right: 0 }}
								>
									{showPassword_2 ? (
										<VisibilityOff className="text-slate-700" />
									) : (
										<Visibility className="text-slate-700" />
									)}
								</div>
							</div>
						</div>

						{/* Medium-Sized Submit Button Only */}
						<div className="flex justify-center mt-3">
							<Spin spinning={loading} indicator={<LoadingOutlined spin />}>
								<button
									disabled={!formik.isValid}
									type="submit"
									className="w-48 py-2.5 px-6 bg-[#1D4ED8] hover:bg-blue-800 text-white font-semibold rounded-lg shadow transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Submit
								</button>
							</Spin>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default SignUp
