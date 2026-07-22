import React, { useEffect, useState } from "react"
import { routePaths } from "../Assets/Data/Routes"
import { useNavigate } from "react-router-dom"
import TDInputTemplateBr from "./TDInputTemplateBr"
import axios from "axios"
import { url, url_bdccb } from "../Address/BaseUrl"
import { Message } from "./Message"
import { getLocalStoreTokenDts } from "./getLocalforageTokenDts"
import CryptoJS from "crypto-js"
import { Visibility, VisibilityOff } from "@mui/icons-material"


const PasswordComp = ({ mode }) => {
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""

	const [oldPassword, setOldPassword] = useState(() => "")
	const [newPassword, setNewPassword] = useState(() => "")
	const [confirmPassword, setConfirmPassword] = useState(() => "")
	const [machineIP, setMachineIP] = useState("")
	const [showPassword, setShowPassword] = useState(false);
	const [showPassword_2, setShowPassword_2] = useState(false);

	const SECRET_KEY = 'S!YSN@ESR#GAI$CSS%OYF^TVE&KAS&OWL*UNT(ISO)NTS_PSR+IIT=ESL/IKM*IST!EAD@'

	const encryptText = (text) => {
	return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
	};


		useEffect(() => {
		console.log(userDetails[0], 'userDetails');
		getPublicIP()
		}, []);


		const getPublicIP = async () => {
		try {
		const res = await axios.get("https://api.ipify.org?format=json");
		setMachineIP(res?.data?.ip)
		} catch (err) {
		console.error(err);
		}
		};

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const handlePasswordUpdate = async () => {

		// const encryptedOldPwd = CryptoJS.AES.encrypt(oldPassword, secretKey).toString()
		// const encryptedNewPwd = CryptoJS.AES.encrypt(newPassword, secretKey).toString()
		const ip = await getClientIP()

		const encryptedOldPwd = encryptText(oldPassword);
		const encryptedNewPwd = encryptText(newPassword);

		const creds = {
			user_id: userDetails[0]?.emp_id,
			old_pass: oldPassword,
			new_pass: newPassword,
			// old_pass: encryptedOldPwd,
			// new_pass: encryptedNewPwd,
			created_by: userDetails[0]?.emp_id,
			ip_address: ip,

			// branch_code: userDetails?.brn_code,
            // in_out_flag: "P",
            // flag : "W",
            // myIP: machineIP
		}

		// return;

// 		{
//     "user_id":"420003",
//     "old_pass":"pacs123",
//     "new_pass":"Branch@123"
// }

		// console.log("credscreds ", creds);

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/user/changepass`, creds, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
			.then((res) => {

				// if(res?.data?.suc === 0){

				// navigate(routePaths.LANDING)
				// localStorage.clear()
				// // Message('error', res?.data?.msg)

				// } else {
				// Message("success", "Password changed successfully")
				// console.log("PASSWWWWWWWDDDDDDDDDD", res?.data)
				// navigate("/")
				// localStorage.clear()
				// }

				if(res?.data?.success){
				Message("success", "Password changed successfully")
				// console.log("PASSWWWWWWWDDDDDDDDDD", res?.data)
				navigate("/")
				localStorage.clear()
				} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
				}

				
			})
			.catch((err) => {
				Message("error", "Some error occurred while changing password")
			})
	}


	const validatePassword = (password) => {
	// const regex = /^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{6,}$/;
	// return regex.test(password);
	const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  	return regex.test(password);
	};

	return (
		<div className="max-w-sm mx-auto">
			<div className="mb-5 relative">
				<TDInputTemplateBr
					placeholder="*****"
					type="password"
					label="Old password"
					name="password"
					formControlName={oldPassword}
					handleChange={(e) => setOldPassword(e.target.value)}
					// handleBlur={""}
					mode={1}
				/>
			</div>
			<div className="mb-5 relative">
				<TDInputTemplateBr
					placeholder="*****"
					type={showPassword ? "text" : "password"}
					label="New password"
					name="password"
					formControlName={newPassword}
					handleChange={(e) => setNewPassword(e.target.value)}
					// handleBlur={""}
					mode={1}
				/>
				<div className="absolute right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword((prev) => !prev)} 
				style={{height:'38px', top:'27px', right:0}}>
				{showPassword ? (
				<VisibilityOff className="text-slate-700" />
				) : (
				<Visibility className="text-slate-700" />
				)}
				</div>
			</div>
			<div className="mb-5 relative">
				<TDInputTemplateBr
					placeholder="*****"
					type={showPassword_2 ? "text" : "password"}
					label="Confirm password"
					name="password"
					formControlName={confirmPassword}
					handleChange={(e) => setConfirmPassword(e.target.value)}
					// handleChange={""}
					// handleBlur={""}
					mode={1}
				/>

				<div className="absolute right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword_2((prev) => !prev)} 
				style={{height:'38px', top:'27px', right:0}}>
				{showPassword_2 ? (
				<VisibilityOff className="text-slate-700" />
				) : (
				<Visibility className="text-slate-700" />
				)}
				</div>
			</div>
			<div className="flex items-start mb-5">
				{/* <div className="flex items-center h-5">
					<input
						id="remember"
						type="checkbox"
						value=""
						className="w-4 h-4 border border-green-900 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
						required
					/>
				</div>
				<label
					for="remember"
					className="ms-2 text-sm font-medium text-blue-900 dark:text-gray-300"
				>
					Show Password
				</label> */}
			</div>
			<div className="flex justify-between">
				{/* <button
					onClick={() => {
						if (newPassword !== confirmPassword) {
							Message("error", "New and Confirm password must be equal")
							return
						}
						handlePasswordUpdate()
					}}
					className="text-white bg-blue-900 hover:bg-
      blue-900 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-full px-5 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:bg-blue-400"
				>
					Submit
				</button> */}
				<button
				onClick={() => {

					if (newPassword !== confirmPassword) {
					Message("error", "New and Confirm password must be equal")
					return
					}

					if (!validatePassword(newPassword)) {
					Message(
						"error",
						"Password must be at least 6 characters, include 1 uppercase and 1 number"
					)
					return
					}

					handlePasswordUpdate()
				}}
				className="text-white bg-blue-900 hover:bg-
      blue-900 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-full px-5 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:bg-blue-400"
				>
				Submit
				</button>

			</div>
		</div>
	)
}

export default PasswordComp
