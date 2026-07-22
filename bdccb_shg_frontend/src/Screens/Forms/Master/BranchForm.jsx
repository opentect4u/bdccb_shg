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
import Radiobtn from "../../../Components/Radiobtn"

const branchTypeOption = [
	{
		label: "Pacs",
		value: "P",
	},
	{
		label: "Branch",
		value: "B",
	},
]

function BranchForm() {
	const params = useParams()

	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const masterDetails = location.state?.state1 || {}
	const flagRadion = location.state?.state2 || {}

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
	const [radioBranchTyp, setRadioBranchTyp] = useState(params?.id > 0 ? masterDetails?.branch_type : "P")
	const [branch, setBranch] = useState(() => [])

	// console.log(params, "params")
	// console.log(flagRadion, "location", location.state?.state1)
	

	const [masterData, setMasterData] = useState({
		block_id: "",
		dist_id: "",
		branch_name: "",
		contact_person: "",
		branch_address: "",
		// branch_city: "",
		pin_no: "",
		branch_phone: "",
		branch_type: "",
		// branch_jurisdiction_id: "",
		branch_jurisdiction_id: 0
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
		if (params?.id > 0) {
			fetchBlock(masterDetails?.dist_id)
		}
		// return
		setMasterData({
			block_id: masterDetails?.block_id || "",
			dist_id: masterDetails?.dist_id || "",
			branch_name: masterDetails?.branch_name || "",
			contact_person: masterDetails?.contact_person || "",
			branch_address: masterDetails?.branch_address || "",
			// branch_city: masterDetails?.branch_city || "",
			pin_no: masterDetails?.pin_no || "",
			branch_phone: masterDetails?.branch_phone || "",
			branch_type: masterDetails?.branch_type || "",
			// branch_id: masterDetails?.branch_id || "",
			branch_jurisdiction_id: masterDetails?.branch_jurisdiction_id || "",

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
		console.log(flagRadion, 'ffffffffffffffffffff', masterDetails, 'll', location);
		fetchBranch()
	}, [])

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const onChange2 = (e) => {
		console.log("radio1 checked", e)
		setRadioBranchTyp(e)
	}

	const handleSaveMaster = async () => {
				setLoading(true)
			
				const ip = await getClientIP()
			
				const creds = {
				branch_id: params?.id > 0 ? masterDetails?.branch_id : 0,
				dist_id: masterData?.dist_id,
				tenant_id: userDetails[0]?.tenant_id,
				block_id: masterData?.block_id,
				branch_type: radioBranchTyp,

				branch_name: masterData?.branch_name,
				contact_person: masterData?.contact_person,
				branch_address: masterData?.branch_address,
				// branch_city: masterData?.branch_city,
				pin_no: masterData?.pin_no,
				branch_phone: masterData?.branch_phone,
				branch_status: masterDetails?.branch_status,
				branch_jurisdiction_id: radioBranchTyp == 'B' ? 0 : masterData?.branch_jurisdiction_id,

				created_by: userDetails[0]?.emp_id, //userDetails[0]?.emp_id
				created_at: new Date().toISOString(),
				created_ip: ip,
				}

				console.log(creds, 'credscredscredscreds', masterData);
				
				await saveMasterData({
				endpoint: "master/save_branch",
				creds,
				navigate,
				successMsg: "Branch details saved.",
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
			block_id: "",
			dist_id: "",
			branch_name: "",
			contact_person: "",
			branch_address: "",
			// branch_city: "",
			pin_no: "",
			branch_phone: "",
			branch_type: "",
		})
	}

	const fetchBranch = async () => {
		setLoading(true)
			const tokenValue = await getLocalStoreTokenDts(navigate);
		// console.log({dist_id: 0, tenant_id: userDetails[0]?.tenant_id , branch_id: 0}, 'userDetailsuserDetailsuserDetails');
		
			await axios
				.get(`${url_bdccb}/master/branch_list`, {
					params: {
					dist_id: 0, tenant_id: userDetails[0]?.tenant_id ,branch_id: 0, branch_type: 'B'
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
							{/* {JSON.stringify(masterDetails, null, 2)} */}
							<div className="grid gap-4 sm:grid-cols-1 sm:gap-6">
								<div>
									<Radiobtn
									data={branchTypeOption}
									val={radioBranchTyp}
									onChangeVal={(value) => {
									onChange2(value)
									}}
									/>
									</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 sm:gap-6">

								<div>
									{/* {masterData.ps_name} */}
									<TDInputTemplateBr
										placeholder="Branch Name..."
										type="text"
										label="Branch Name"
										name="branch_name"
										formControlName={masterData.branch_name}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>

								<div>
									{/* {masterData.ps_name} */}
									<TDInputTemplateBr
										placeholder="Contact Person..."
										type="text"
										label="Contact Person"
										name="contact_person"
										formControlName={masterData.contact_person}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>

								</div>	

								<div className="grid gap-4 sm:grid-cols-1 sm:gap-6 mt-5">

								<div>
									{/* {masterData.ps_name} */}
									<TDInputTemplateBr
										placeholder="Branch Address..."
										type="text"
										label="Branch Address"
										name="branch_address"
										formControlName={masterData.branch_address}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>

								
							</div>

							<div className="grid gap-4 sm:grid-cols-3 sm:gap-6 mt-5">

								<div>
									{/* {masterData.ps_name} */}
									<TDInputTemplateBr
										placeholder="Pin Code..."
										type="text"
										label="Pin Code"
										name="pin_no"
										formControlName={masterData.pin_no}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>

								<div>
									{/* {masterData.ps_name} */}
									<TDInputTemplateBr
										placeholder="Branch Phone..."
										type="text"
										label="Branch Phone"
										name="branch_phone"
										formControlName={masterData.branch_phone}
										handleChange={handleChangeMaster}
										mode={1}
									/>
								</div>

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
								
							</div>

							<div className="grid gap-4 sm:grid-cols-3 sm:gap-6 mt-5">

								
								<div>
									{/* {JSON.stringify(masterData, null, 2)} */}
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

								{radioBranchTyp == 'P' && (
								<div>

								<TDInputTemplateBr
								placeholder="Select Branch Jurisdiction ID..."
								type="text"
								label="Select Branch Jurisdiction ID"
								name="branch_jurisdiction_id"
								formControlName={masterData.branch_jurisdiction_id}
								handleChange={handleChangeMaster}
								data={branch}
								mode={2}
								/>

								{/* {formik.errors.branch_id && formik.touched.branch_id ? (
								<VError title={formik.errors.branch_id} />
								) : null} */}

								</div>
								)}
								

							</div>
						</div>

						<div className="mt-10">
							
							{/* {JSON.stringify(radioBranchTyp, null, 2)} '/////////////////' {JSON.stringify(masterData, null, 2)} ///////////////// {JSON.stringify(masterDetails, null, 2)} */}
							
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
					if (!masterData.branch_name?.trim() || !masterData.dist_id || !masterData.block_id || !masterData.branch_address?.trim() || !masterData.pin_no?.trim()
					 || !masterData.branch_phone?.trim() || !masterData.pin_no?.trim() || !masterData.contact_person?.trim()) {
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

export default BranchForm
