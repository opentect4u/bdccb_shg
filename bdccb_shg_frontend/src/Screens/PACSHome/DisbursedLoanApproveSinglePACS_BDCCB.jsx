import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import Radiobtn from "../../Components/Radiobtn"
import DisburseApproveTable from "../../Components/DisburseApproveTable"
// import RecoveryMemberApproveTable from "../../Components/RecoveryMemberApproveTable.jsx___"
// import RecoveryGroupApproveTable from "../../Components/RecoveryGroupApproveTable.jsx___"
// import RecoveryCoApproveTable from "../../Components/RecoveryCoApproveTable.jsx___"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../Utils/formateDate"
// import RecoveryGroupDisbursTable from "../../Components/RecoveryGroupDisbursTable.jsx___"
// import RecoveryCoDisbursTable from "../../Components/RecoveryCoDisbursTable.jsx___"
// import RecoveryMemberDisbursTable from "../../Components/RecoveryMemberDisbursTable.jsx___"
import { routePaths } from "../../Assets/Data/Routes"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import UnapprovedDisbursTable_BDCCB from "../../Components/UnapprovedDisbursTable_BDCCB"
// import ApprovedDisbursTable_BDCCB from "../../Components/ApprovedDisbursTable_BDCCB.jsx____"

const options = [
	{
		label: "Unapproved Disbursement",
		value: "U",
	},
	// {
	// 	label: "Approved Disbursement",
	// 	value: "A",
	// }
]

function DisbursedLoanApproveSinglePACS_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [DisburseData, setDisburseData] = useState(() => [])
	const [copyDisburseData, setCopyDisburseData] = useState(
		() => []
	)

	const [loanType, setLoanType] = useState("U")
	// const [value2, setValue2] = useState("S")
	const navigate = useNavigate()



	// const fetchLoanApplications = async (loanType) => {
	const fetchDisburseData = async () => {
		setLoading(true)
		setDisburseData([])
		setCopyDisburseData([])

		const creds = {
			branch_id : userDetails[0]?.user_type == 'P' ? userDetails[0]?.brn_code : userDetails[0]?.user_type == 'S' ? userDetails[0]?.emp_id : "",
			tenant_id : userDetails[0]?.tenant_id,
			loan_to : userDetails[0]?.user_type == 'P' ? "P" : userDetails[0]?.user_type == 'S' ? "S" : "",
			approval_status: loanType
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/loan/fetch_disburse_dtls`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				console.log(res?.data?.data, 'ccccccccccccccccccccccccccc', creds);
				
				if(res?.data?.success){
				setDisburseData(res?.data?.data)
				setCopyDisburseData(res?.data?.data)
				
				Message("success", res?.data?.msg)

				} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
				}

				// if (res?.data?.suc === 0) {
				// 	// Message('error', res?.data?.msg)
				// 	navigate(routePaths.LANDING)
				// 	localStorage.clear()
				// } else {
				// 	setDisburseData(res?.data?.msg)
				// 	setCopyDisburseData(res?.data?.msg)
				// }

			})
			.catch((err) => {
				Message("error", "Some error occurred while fetching loans!")
				console.log("ERRR", err)
			})
		setLoading(false)
	}


	

	const setSearch = (word) => {
		console.log(word, "wordwordwordword", copyDisburseData)
		setDisburseData(
			copyDisburseData?.filter(
				(e) =>
					e?.loan_acc_no
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.loan_acc_no
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase())
			)
		)
	}



	const onChange = (e) => {
		console.log("radio1 checked", e)
		setLoanType(e)
	}


	useEffect(() => {

		if (loanType === "U") {
			fetchDisburseData()
		}
		// else if (loanType === "A") {
		// 	fetchLoanApplicationsCo()
		// }
	}, [loanType])
	// }, [loanType, fromDate, toDate, selectedEmployeeId])

	return (
		<div>

			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="px-4 h-auto my-16 mx-32">
					{/* <Radiobtn data={options} val={"U"} onChangeVal={onChange1} /> */}

					{/* <Radiobtn
						data={options}
						val={loanType}
						onChangeVal={(value) => {
							onChange(value)
						}}
					/> */}

					{loanType === "U" ? (
						<>
							<UnapprovedDisbursTable_BDCCB
								flag="PACS"
								loanAppData={DisburseData}
								title="Unapprove Disburse"
								setSearch={(data) => setSearch(data)}
								loanType={loanType}
								// fetchLoanApplications={fetchLoanApplications}
								// fetchLoanApplicationsDate={{ fromDate, toDate }}
								onRefresh={fetchDisburseData}
							/>
						</>
					) : loanType === "A" ? (
						<>
							{/* <ApprovedDisbursTable_BDCCB
								flag="PACS"
								loanAppData={DisburseData}
								title="Approve Disburse"
								setSearch={(data) => setSearch(data)}
								loanType={loanType}
							/> */}
						</>
					) : null}
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

export default DisbursedLoanApproveSinglePACS_BDCCB
