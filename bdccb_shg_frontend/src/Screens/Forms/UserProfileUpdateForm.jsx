import React, { useEffect, useState } from "react"
import { routePaths } from "../../Assets/Data/Routes"
import { useNavigate } from "react-router-dom"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"

const UserProfileUpdateForm = ({ mode, onClose }) => {
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [branches, setBranches] = useState(() => [])
	const [userTypes, setUserTypes] = useState(() => [])

	const [formData, setFormData] = useState({
		user_id: "",
		user_name: "",
		designation: ""
		// branch_code: "",
		// user_type: "",
	})

	const handleFormChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const handleFetchBranches = async () => {

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.get(`${url}/admin/fetch_branches`, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				

				if(res?.data?.suc === 0){

				navigate(routePaths.LANDING)
				localStorage.clear()
				Message('error', res?.data?.msg)

				} else {

				setBranches(res?.data?.msg)

				}

			})
			.catch((err) => {
				// console.log("Some error")
				navigate(routePaths.LANDING)
				localStorage.clear()
			})
	}

	const handleFetchUserTypes = async () => {

		const tokenValue = await getLocalStoreTokenDts(navigate);
		
		await axios
			.get(`${url}/get_user_type`, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})

			.then((res) => {
				

				if(res?.data?.suc === 0){

				navigate(routePaths.LANDING)
				localStorage.clear()
				Message('error', res?.data?.msg)

				} else {

				setUserTypes(res?.data?.msg)

				}

			})
			.catch((err) => {
				// console.log("Errrr", err)
				navigate(routePaths.LANDING)
				localStorage.clear()
			})
	}

	useEffect(() => {
		// handleFetchBranches()
		// handleFetchUserTypes()
		console.log(userDetails[0], 'gggggggggggggg');
		
	}, [])

	const handleUpdateProfile = async () => {

		const ip = await getClientIP()

		const creds = {
			user_id: formData?.user_id,
			designation: formData?.designation,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,
		}


		await axios
			.post(`${url_bdccb}/user/profile_update`, creds)
			.then((res) => {
				console.log(res.data)
				Message("success", "Profile updated successfully!")
				onClose && onClose()
			})
			.catch((err) => {
				console.log("Errr occurred!!!", err)
			})
	}

	

	const fetchProfileDetails = async () => {
		// setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/user/user_list`, {
		params: {
			tenant_id: userDetails[0]?.tenant_id, 
			branch_id: userDetails[0]?.brn_code, 
			user_id: userDetails[0]?.emp_id
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		}
		})
			.then((res) => {

				if(res?.data?.success){
				
				setFormData(
					{
					user_id: res?.data?.data[0]?.user_id,
					user_name: res?.data?.data[0]?.user_name,
					designation: res?.data?.data[0]?.designation
					}
				)

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
		// setLoading(false)
	}

	useState(() => {
		fetchProfileDetails()
	}, [])

	return (
		<div className="max-w-sm mx-auto">
			<div className="grid grid-cols-2 gap-4 justify-between">
				<div className="sm:col-span-2">
					<TDInputTemplateBr
						placeholder="User ID..."
						type="text"
						label="User ID"
						name="user_id"
						formControlName={formData.user_id}
						handleChange={(e) => handleFormChange("user_id", e.target.value)}
						mode={1}
						disabled
					/>
				</div>
				<div className="sm:col-span-2">
					<TDInputTemplateBr
						placeholder="User Name..."
						type="text"
						label="User Name"
						name="user_name"
						formControlName={formData.user_name}
						handleChange={(e) => handleFormChange("user_name", e.target.value)}
						mode={1}
						disabled
					/>
				</div>

				<div className="sm:col-span-2">
					<TDInputTemplateBr
						placeholder="Designation..."
						type="text"
						label="Designation"
						name="designation"
						formControlName={formData.designation}
						handleChange={(e) => handleFormChange("designation", e.target.value)}
						mode={1}
						// disabled
					/>
				</div>
				{/* <div>
					
					<TDInputTemplateBr
						placeholder="Branch..."
						type="text"
						label="Branch"
						name="branch_code"
						formControlName={formData.branch_code}
						handleChange={(e) =>
							handleFormChange("branch_code", e.target.value)
						}
						data={branches?.map((item, i) => ({
							code: item?.branch_code,
							name: item?.branch_name,
						}))}
						mode={2}
						disabled
					/>
				</div>
				<div>
					<TDInputTemplateBr
						placeholder="User Type..."
						type="text"
						label="User Type"
						name="user_type"
						formControlName={formData.user_type}
						handleChange={(e) => handleFormChange("user_type", e.target.value)}
						mode={2}
						data={userTypes?.map((item, i) => ({
							code: item?.type_code,
							name: item?.user_type,
						}))}
						disabled
					/>
				</div> */}
				
			</div>

			<div className="flex justify-between mt-5">
				<button
					onClick={() => handleUpdateProfile()}
					className="text-white bg-blue-900 hover:bg-
      blue-900 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-full px-5 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:bg-blue-400"
				>
					Update
				</button>
			</div>
		</div>
	)
}

export default UserProfileUpdateForm
