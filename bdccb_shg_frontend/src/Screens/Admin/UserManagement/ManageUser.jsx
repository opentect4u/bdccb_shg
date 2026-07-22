import React, { useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import EmployeeMasterTable from "../../../Components/Master/EmployeeMasterTable.jsx__BDCCB"
import UserManagementTable from "../../../Components/Admin/UserManagementTable"
import { useNavigate } from "react-router"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
import Radiobtn from "../../../Components/Radiobtn"

const options = [
	{
		label: "Approved",
		value: "Y",
	},
	{
		label: "Unapproved",
		value: "N",
	},
	{
		label: "Block",
		value: "B",
	}
]

function ManageUser() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [masterData, setMasterData] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("Y")
	// const [value2, setValue2] = useState("S")
	const navigate = useNavigate()

	const fetchLoanApplications = async () => {
		setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/user/user_list`, {
		params: {
			tenant_id: userDetails[0]?.tenant_id, 
			branch_id: userDetails[0]?.user_type == 'H' ? 0 : userDetails[0]?.brn_code, 
			user_type: userDetails[0]?.user_type == 'B' ? 'P' : userDetails[0]?.user_type == 'P' ? 'S' : '',
			branch_type: userDetails[0]?.user_type,
			user_status: approvalStatus
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		}
		})
			.then((res) => {
				console.log(res, 'resresresresres');

				if(res?.data?.success){
				

				setMasterData(res?.data?.data)
				setCopyLoanApplications(res?.data?.data)
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
		setLoading(false)
	}

	const onChange = (e) => {

	setApprovalStatus(e)

	}

	// useEffect(() => {
	// 	fetchLoanApplications()
	// }, [])

	const setSearch = (word) => {
		setMasterData(
			copyLoanApplications?.filter(
				(e) =>
					e?.user_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.user_name
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase()) ||
					e?.user_id?.toString()?.toLowerCase()?.includes(word?.toLowerCase())
					//  ||
					// e?.branch_name?.toString()?.toLowerCase()?.includes(word?.toLowerCase())
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

					<Radiobtn
						data={options}
						val={approvalStatus}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/>
					{/* {JSON.stringify(masterData, 2)} */}
					<UserManagementTable
						flag="ADMIN"
						loanAppData={masterData}
						title="User Management"
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

export default ManageUser
