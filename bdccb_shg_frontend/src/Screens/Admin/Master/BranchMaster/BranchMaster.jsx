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
import PoliceStationTable from "../../../../Components/Master/PoliceStationTable"
import TDInputTemplateBr from "../../../../Components/TDInputTemplateBr"
import BranchTable from "../../../../Components/Master/BranchTable"
import Radiobtn from "../../../../Components/Radiobtn"
// import BranchTable from "../../../../Components/Master/PoliceStationTable"
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

function BranchMaster() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [loanApplications, setLoanApplications] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("U")

	// const [radioBranchTyp, setRadioBranchTyp] = useState(params?.id > 0 ? masterDetails?.branch_type : "P")
	const [radioBranchTyp, setRadioBranchTyp] = useState("P")
	
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
		setLoading(true)

		// const creds = {
		// 	prov_grp_code: 0,
		// 	user_type: userDetails?.id,
		// 	branch_code: userDetails?.brn_code,
		// }

			const tokenValue = await getLocalStoreTokenDts(navigate);
		console.log({dist_id: dist_id, tenant_id: userDetails[0]?.tenant_id , branch_id: 0}, 'userDetailsuserDetailsuserDetails');
		
			await axios.get(`${url_bdccb}/master/branch_list`, {
					params: {
					dist_id: dist_id, tenant_id: userDetails[0]?.tenant_id ,branch_id: 0
					},
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
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


	const setSearch = (word) => {
		const searchText = word?.toLowerCase() || ""

		setLoanApplications(
			copyLoanApplications?.filter(
				(e) =>
					e?.branch_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase())
					// 	 ||
					// e?.loan_acc_no
					// 	?.toString()
					// 	?.toLowerCase()
					// 	?.includes(word?.toLowerCase())
			)
		)
	}


	useEffect(() => {
		console.log(userDetails[0]?.tenant_id, 'userDetailsuserDetailsuserDetails', userDetails[0]);
		
	}, [])
	

	const handleChangeMaster = (e) => {
	const { name, value } = e.target
	if (value > 0) {
	fetchLoanApplications(value)
	} else {
	setLoanApplications([])
	setCopyLoanApplications([])
	}
	}

	const onChange2 = (e) => {
	console.log("radio1 checked", e)
	setRadioBranchTyp(e)
	}

	useEffect(() => {
	if (radioBranchTyp) {
		const filteredData = copyLoanApplications.filter(
			(item) => item.branch_type === radioBranchTyp
		)
		setLoanApplications(filteredData)
	}
}, [radioBranchTyp, copyLoanApplications])


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
					{/* {JSON.stringify(loanApplications[0], null, 2)} */}
					<BranchTable
						// flag="BM"
						flagRadion={radioBranchTyp}
						loanAppData={loanApplications}
						title="Branch Master"
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

export default BranchMaster
