import React, { useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import EmployeeMasterTable from "../../../Components/Master/EmployeeMasterTable.jsx__BDCCB"
import UserManagementTable from "../../../Components/Admin/UserManagementTable"
import TransferUserTable from "../../../Components/Admin/TransferUserTable"
import { useNavigate } from "react-router"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"

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

function TransferUserManage() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [masterData, setMasterData] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("U")
	// const [value2, setValue2] = useState("S")
	const navigate = useNavigate()

	const fetchLoanApplications = async () => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		// const creds = {
		// 	prov_grp_code: 0,
		// 	user_type: userDetails?.id,
		// 	branch_code: userDetails?.brn_code,
		// }

		await axios
			.post(`${url}/fetch_user_details`, {}, {
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

			setMasterData(res?.data?.msg)
			setCopyLoanApplications(res?.data?.msg)

			}


				// console.log("PPPPPPPPPPPPPPPPPPPP", res?.data)
				// if (res?.data?.suc === 1) {
				// 	setMasterData(res?.data?.msg)
				// 	setCopyLoanApplications(res?.data?.msg)

				// 	console.log("PPPPPPPPPPPPPPPPPPPP", res?.data)
				// } else {
				// 	Message("error", "No users found.")
				// }

			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching users!")
				console.log("ERRR", err)
			})
		setLoading(false)
	}

	useEffect(() => {
		fetchLoanApplications()
	}, [])

	const setSearch = (word) => {
		setMasterData(
			copyLoanApplications?.filter(
				(e) =>
					e?.bank_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.branch_name
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase()) ||
					e?.ifsc?.toString()?.toLowerCase()?.includes(word?.toLowerCase()) ||
					e?.sol_id?.toString()?.toLowerCase()?.includes(word?.toLowerCase())
			)
		)
	}

	// const onChange = (e) => {
	// 	console.log("radio1 checked", e)
	// 	setApprovalStatus(e)
	// }

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
				<main className="px-4 h-auto my-20 mx-32">
					{/* <Radiobtn data={options} val={"U"} onChangeVal={onChange1} /> */}

					{/* <Radiobtn
						data={options}
						val={approvalStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/> */}
					<TransferUserTable
						flag="ADMIN"
						loanAppData={masterData}
						title="Transfer User"
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

export default TransferUserManage
