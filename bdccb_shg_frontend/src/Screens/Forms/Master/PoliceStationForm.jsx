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

function PoliceStationForm() {
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
	const [blocks, setBlocks] = useState(() => [])

	// console.log(params, "params")
	// console.log(location, "location", location.state)

	const [masterData, setMasterData] = useState({
		ps_name: "",
		dist_id: "",
		block_id: "",
	})

	const handleChangeMaster = (e) => {
		// console.log(e, 'vvvvvvvvvvvvvvvvv');
		
		const { name, value } = e.target
		// setMasterData((prevData) => ({
		// 	...prevData,
		// 	[name]: value,
		// }))

		setMasterData((prev) => {
			const updated = {
				...prev,
				[name]: value,
			}
			// when district changes
			if (name === "dist_id") {

				if (value > 0) {
					fetchBlock(value)
				} else {
					setBlocks([])
				}
				updated.block_id = ""
			}


			return updated
		})

	}

	useEffect(() => {
		// console.log(masterDetails, 'masterDetails', masterDetails?.dist_id);
		
		setMasterData({
			ps_name: masterDetails?.ps_name || "",
			dist_id: masterDetails?.dist_id || "",
			block_id: masterDetails?.block_id || "",
		})
	}, [])

	const getDistricts = async () => {
		
		// const creds = {
		// 	state_id: masterDetails?.state_id,
		// }
		const tokenValue = await getLocalStoreTokenDts(navigate);

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
	// 	getDistricts()

	// }, [])

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const handleSaveMaster = async () => {
				setLoading(true)
			
				const ip = await getClientIP()
			
				const creds = {
				ps_id: params?.id > 0 ? masterDetails?.ps_id : 0,
				dist_id: masterData?.dist_id,
				// block_id: 0,
				block_id: masterData?.block_id,
				ps_name: masterData?.ps_name,
				created_by: userDetails[0]?.emp_id, //userDetails[0]?.emp_id
				created_at: new Date().toISOString(),
				created_ip: ip,
				}
			
				await saveMasterData({
				endpoint: "master/save_policestation",
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
			ps_name: "",
			dist_id: "",
			block_id: "",
		})
	}

	
	const fetchBlock = async (dist_id) => {
		setBlocks([])
		setLoading(true)
		console.log(dist_id, 'dist_iddist_iddist_iddist_iddist_iddist_id');


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

				console.log(res?.data?.data, 'hhhhhhhhhhhhhhhhh');

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

	useEffect(() => {
		if (params?.id > 0) {
			fetchBlock(masterDetails?.dist_id)
		}
	}, [])

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
									{/* {masterData.ps_name} */}
									<TDInputTemplateBr
										placeholder="Post..."
										type="text"
										label="Police Station Name"
										name="ps_name"
										formControlName={masterData.ps_name}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>

								{/* <div>
									<TDInputTemplateBr
										placeholder="Pin Code..."
										type="text"
										label="Pin Code"
										name="pin_code"
										formControlName={masterData.pin_code}
										handleChange={handleChangeMaster}
										inputMode="numeric"
										mode={1}
									/>
								</div> */}

								<div>
									{/* {masterData.dist_id} */}
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
										placeholder="Select Block..."
										type="text"
										label="Block"
										name="block_id"
										formControlName={masterData.block_id}
										handleChange={handleChangeMaster}
										data={blocks}
										mode={2}
									/>
								</div>
								
							</div>
						</div>

						<div className="mt-10">
							
							{/* {JSON.stringify(masterData, null, 2)} fff */}
							
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
					if (!masterData.ps_name?.trim() || !masterData.dist_id) {
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

export default PoliceStationForm
