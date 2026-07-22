// FOR BDCCB 
import React, { useEffect, useState } from "react"
import Sidebar from "../../../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../../../Address/BaseUrl"
import { Message } from "../../../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import DistrictTable from "../../../../Components/Master/DistrictTable"
import BlockTable from "../../../../Components/Master/BlockTable"
import { routePaths } from "../../../../Assets/Data/Routes"
import { getLocalStoreTokenDts } from "../../../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import TDInputTemplateBr from "../../../../Components/TDInputTemplateBr"

// const options = [
// 	{
// 		label: "Pending",
// 		value: "U",
// 	},
// 	{
// 		label: "Sent to MIS",
// 		value: "S",
// 	},
// 	{
// 		label: "Approved",
// 		value: "A",
// 	},
// 	{
// 		label: "MIS Rejected",
// 		value: "R",
// 	},
// ]

function MasterBlocks() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [loanApplications, setLoanApplications] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("U")
	const navigate = useNavigate()
	// const [value2, setValue2] = useState("S")

	const [masterData, setMasterData] = useState({
			value: "",
		})
	const [districts, setDistricts] = useState(
		userDetails[0]?.district_list?.map((item, i) => ({
		code: item?.dist_code,
		name: item?.dist_name,
		}))
	)

	

	const fetchLoanApplications = async (dist_id) => {
		setLoanApplications([])
		setCopyLoanApplications([])
		setLoading(true)

		const creds = {
			dist_id: dist_id,
		}
		console.log(dist_id, 'dist_iddist_iddist_iddist_id');
		
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/block_list`, {
		params: {
		dist_id: dist_id,
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		}
		})
			.then((res) => {
					// console.log(res?.data?.msg, 'blockkkkkkkkkkkkk', res?.data?.data);
					if(res?.data?.success){
					setLoanApplications(res?.data?.data)
					setCopyLoanApplications(res?.data?.data)
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
		console.log(userDetails[0]?.district_list, 'hhhhhhhhhhhhh');
		// const districts = userDetails[0]?.district_list
		
		// fetchLoanApplications("U")
	}, [])

	const setSearch = (word) => {
		const searchText = word?.toLowerCase() || ""
		setLoanApplications(
			copyLoanApplications?.filter((e) =>
				e?.block_name?.toString()?.toLowerCase().includes(searchText) ||
				e?.dist_name?.toString()?.toLowerCase().includes(searchText)
			)
		)
	}

	// const onChange = (e) => {
	// 	console.log("radio1 checked", e)
	// 	setApprovalStatus(e)
	// }

	// useEffect(() => {
	// 	fetchLoanApplications(approvalStatus)
	// }, [approvalStatus])

const handleChangeMaster = (e) => {
	
	
  const { name, value } = e.target
//   console.log(e.target, 'eeeeeee', name, value);
  if (value > 0) {
	fetchLoanApplications(value)
	} else {
	setLoanApplications([])
	setCopyLoanApplications([])
	}
//   fetchLoanApplications(value)
//   setMasterData((prev) => ({
//     ...prev,
//     [name]: value,
//   }))
}


	return (
		<div>
			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="px-4 h-auto my-20 mx-32">
					{/* <Radiobtn data={options} val={"U"} onChangeVal={onChange1} /> */}

					{/* <Radiobtn
						data={options}
						val={approvalStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/> */}
					<div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
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

							</div>
					<BlockTable
						// flag="BM"
						flag=""
						loanAppData={loanApplications}
						title="Blocks Master"
						setSearch={(data) => setSearch(data)}
					/>
					{/* <DialogBox
					visible={visible}
					flag={flag}
					onPress={() => setVisible(false)}
				/> */}
				</main>
			</Spin>
		</div>
	)
}

export default MasterBlocks
