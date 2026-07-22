// FOR BDCCB 

import React, { useEffect, useState } from "react"
import Sidebar from "../../../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../../../Address/BaseUrl"
import { Message } from "../../../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import DistrictTable from "../../../../Components/Master/DistrictTable"
import { getLocalStoreTokenDts } from "../../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../../Assets/Data/Routes"
import { useNavigate } from "react-router"

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

function MasterDistricts() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [loanApplications, setLoanApplications] = useState(userDetails[0]?.district_list)
	const [copyLoanApplications, setCopyLoanApplications] = useState(userDetails[0]?.district_list)
	const navigate = useNavigate()

	// const [approvalStatus, setApprovalStatus] = useState("U")
	// const [value2, setValue2] = useState("S")

	const fetchLoanApplications = async (approvalStat) => {
		setLoading(true)

		// const creds = {
		// 	prov_grp_code: 0,
		// 	user_type: userDetails?.id,
		// 	branch_code: userDetails?.brn_code,
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/dist_list`, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})
			.then((res) => {

			// console.log(res?.data?.success, 'disssssssssssss', res?.data?.data);
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
		// fetchLoanApplications("U")
	}, [])

	const setSearch = (word) => {
		setLoanApplications(
			copyLoanApplications?.filter((e) =>
				e?.dist_name?.toString()?.toLowerCase().includes(word?.toLowerCase())
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

					<DistrictTable
						// flag="BM"
						flag=""
						loanAppData={loanApplications}
						title="District Master"
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

export default MasterDistricts
