// FOR BDCCB 
import React, { useEffect, useState } from "react"
import "../../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import BtnComp from "../../../Components/BtnComp"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Message } from "../../../Components/Message"
import { url, url_bdccb } from "../../../Address/BaseUrl"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { useLocation } from "react-router"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import DialogBox from "../../../Components/DialogBox"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
import { saveMasterData } from "../../../services/masterService"

function BlockMasterForm() {
	const params = useParams()

	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const masterDetails = location.state || {}

	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))

	// const [districts, setDistricts] = useState(() => [])
	const [districts, setDistricts] = useState(
			userDetails[0]?.district_list?.map((item, i) => ({
			code: item?.dist_code,
			name: item?.dist_name,
			}))
		)
	const [visible, setVisible] = useState(() => false)

	console.log(params, "params")
	console.log(location, "location")

	const [masterData, setMasterData] = useState({
		block_name: "",
		dist_id: "",
	})

	const handleChangeMaster = (e) => {
		const { name, value } = e.target
		setMasterData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	useEffect(() => {
		console.log(masterDetails, 'masterDetails', masterDetails?.dist_id);
		
		setMasterData({
			block_name: masterDetails?.block_name || "",
			dist_id: masterDetails?.dist_id || "",
		})
	}, [])

	const getDistricts = async () => {
		
		// const creds = {
		// 	state_id: masterDetails?.state_id,
		// }
		const tokenValue = await getLocalStoreTokenDts(navigate);

		// const cred = {
		// dist_id:"2",
		// block_name:"This issting",
		// block_id:"0",
		// created_by :"test",
		// created_at :"date time",
		// created_ip :"10.10.10.10"
		// }

		await axios
			.get(`${url_bdccb}/master/dist_list`, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {

			if(res?.data?.success){
			setDistricts(
			res?.data?.data?.map((item, i) => ({
			code: item?.dist_id,
			name: item?.dist_name,
			}))
			)
			} else {
			// Message('error', res?.data?.msg)
			navigate(routePaths.LANDING)
			localStorage.clear()
			}


			})
			.catch((err) => {
				console.log("ERRR", err)
			})
	}

	// useEffect(() => {
	// 	// getDistricts()

	// }, [])

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	// const handleSaveMaster__________NEW = async () => {

	// 	console.log(params?.id, 'vvvvvvvvvvvvvvvvv', 'creds');
	// 	// return

	// 	setLoading(true)

	// 	const ip = await getClientIP()
	// 	const creds = {
	// 		block_id: params?.id > 0 ? masterDetails?.block_id : 0,
	// 		dist_id: masterData.dist_id,
	// 		block_name: masterData.block_name,
	// 		created_by: userDetails[0]?.emp_id,
	// 		created_at: new Date().toISOString(),
	// 		created_ip: ip,
	// 	}

	// 	console.log(creds, 'vvvvvvvvvvvvvvvvv');
	// 	// const creds = params.id > 0 ? creds_edit : creds_add
	// 	const tokenValue = await getLocalStoreTokenDts(navigate);

	// 	await axios
	// 		.post(`${url_bdccb}/master/save_block`, creds, {
	// 		headers: {
	// 		Authorization: `${tokenValue?.token}`, // example header
	// 		"Content-Type": "application/json", // optional
	// 		},
	// 		})
	// 		.then((res) => {

	// 		// if(res?.data?.suc === 0){
	// 		// Message('error', res?.data?.msg)
	// 		// navigate(routePaths.LANDING)
	// 		// localStorage.clear()
	// 		// } else {

	// 		// Message("success", "Block details saved.")
	// 		// navigate(-1)
	// 		// }

	// 		if(res?.data?.success){
	// 		Message("success", "Details saved.")
	// 		navigate(-1)
	// 		} else {
	// 		Message('error', res?.data?.msg)
	// 		navigate(routePaths.LANDING)
	// 		localStorage.clear()
	// 		}

	// 		})
	// 		.catch((err) => {
	// 			Message("error", "Some error occurred.")
	// 			console.log("ERR", err)
	// 		})
	// 	setLoading(false)
	// }


	const handleSaveMaster = async () => {
		setLoading(true)
	
		const ip = await getClientIP()
	
		const creds = {
			block_id: params?.id > 0 ? masterDetails?.block_id : 0,
			dist_id: masterData.dist_id,
			block_name: masterData.block_name,
			created_by: userDetails[0]?.emp_id,
			created_at: new Date().toISOString(),
			created_ip: ip,
		}
	
		await saveMasterData({
		endpoint: "master/save_block",
		creds,
		navigate,
		successMsg: "Block details saved.",
		onSuccess: () => navigate(-1),
	
		// 🔥 fully dynamic failure handling
		failureRedirect: routePaths.LANDING,
		clearStorage: true,
		})
	
		setLoading(false)
		}

	const onSubmit = (e) => {
		e.preventDefault()
		setVisible(true)
	}

	const onReset = () => {
		setMasterData({
			dist_id: "",
			block_name: "",
		})
	}
	

	return (
		<>
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<form onSubmit={onSubmit}>
					<div>
						<div>
							<div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
								<div>
									<TDInputTemplateBr
										placeholder="Select District..."
										type="text"
										label="District"
										name="dist_id"
										formControlName={masterData.dist_id}
										handleChange={handleChangeMaster}
										data={districts}
										mode={2}
									/>
								</div>

								<div>
									<TDInputTemplateBr
										placeholder="Block..."
										type="text"
										label="Block"
										name="block_name"
										formControlName={masterData.block_name}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>
							</div>
						</div>

						<div className="mt-10">
							<BtnComp mode="A" removeReset={params?.id} onReset={onReset} />
						</div>
					</div>
				</form>
			</Spin>

			<DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={() => {
					if (!masterData.block_name?.trim() || !masterData.dist_id) {
						Message("warning", "Fill all the values properly!")
						setVisible(false)
						return
					}
					handleSaveMaster()
					setVisible(!visible)
				}}
				onPressNo={() => setVisible(!visible)}
			/>
		</>
	)
}

export default BlockMasterForm
