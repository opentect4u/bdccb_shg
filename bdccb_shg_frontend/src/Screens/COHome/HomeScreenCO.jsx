import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import LoanApplicationsTableViewBr from "../../Components/LoanApplicationsTableViewBr.jsx__BDCCB"
import Radiobtn from "../../Components/Radiobtn"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { routePaths } from "../../Assets/Data/Routes"
import { useNavigate } from "react-router"


const options = [
	{
		label: "Pending",
		value: "U",
	},
	{
		label: "Sent to MIS",
		value: "S",
	},
	{
		label: "Approved",
		value: "A",
	},
]

function HomeScreenCO() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [loanApplications, setLoanApplications] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("U")
	// const [value2, setValue2] = useState("S")
	const navigate = useNavigate()
	

	const fetchLoanApplications = async (approvalStat) => {
		setLoading(true)

		// const creds = {
		// 	prov_grp_code: 0,
		// 	user_type: userDetails?.id,
		// 	branch_code: userDetails?.brn_code,
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.get(
				`${url}/admin/fetch_form_dtls_web?branch_code=${userDetails?.brn_code}&approval_status=${approvalStat}`, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {
				
				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				// navigate(routePaths.LANDING)
				// localStorage.clear()
				} else {
					setLoanApplications(res?.data?.msg)
					setCopyLoanApplications(res?.data?.msg)
				} 
				
				// else {
				// 	Message("error", "No incoming loan applications found.")
				// }
			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching loans!")
				console.log("ERRR", err)
			})
		setLoading(false)
	}

	useEffect(() => {
		fetchLoanApplications("U")
	}, [])

	const setSearch = (word) => {
		setLoanApplications(
			copyLoanApplications?.filter(
				(e) =>
					e?.form_no?.toString()?.toLowerCase().includes(word?.toLowerCase()) ||
					e?.client_name
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase()) ||
					e?.member_code
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase())
			)
		)
	}

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setApprovalStatus(e)
	}

	useEffect(() => {
		fetchLoanApplications(approvalStatus)
	}, [approvalStatus])

	return (
		<div>
			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="px-4 h-auto my-10 mx-32">
					{/* <Radiobtn data={options} val={"U"} onChangeVal={onChange1} /> */}

					{/* <Radiobtn
						data={options}
						val={approvalStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/> */}
					{/* <LoanApplicationsTableViewBr
						flag="CO"
						loanAppData={loanApplications}
						title="GRT Forms"
						setSearch={(data) => setSearch(data)}
					/> */}
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

export default HomeScreenCO
