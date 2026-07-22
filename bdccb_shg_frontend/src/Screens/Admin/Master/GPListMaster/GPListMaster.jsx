// FOR BDCCB 
import React, { useEffect, useState } from "react"
import Sidebar from "../../../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../../../Address/BaseUrl"
import { Message } from "../../../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import DistrictTable from "../../../../Components/Master/DistrictTable"
import PostTable from "../../../../Components/Master/PostTable"
import { getLocalStoreTokenDts } from "../../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../../Assets/Data/Routes"
import { useNavigate } from "react-router"
import TDInputTemplateBr from "../../../../Components/TDInputTemplateBr"
import GPListTable from "../../../../Components/Master/GPListTable"
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

function GPListMaster() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [loanApplications, setLoanApplications] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("U")

	// const [masterData, setMasterData] = useState({
	// 		value: "",
	// 		// block_id: "",
	// 	})

	const [masterData, setMasterData] = useState({
	dist_id: "", block_id: "",
	})

	const [districts, setDistricts] = useState(
		userDetails[0]?.district_list?.map((item, i) => ({
		code: item?.dist_code,
		name: item?.dist_name,
		}))
	)
	const [blocks, setBlocks] = useState(() => [])
	
	const navigate = useNavigate()

	// const [value2, setValue2] = useState("S")

	const fetchLoanApplications = async (dist_id, block_id) => {
		setLoading(true)

		// const creds = {
		// 	prov_grp_code: 0,
		// 	user_type: userDetails?.id,
		// 	branch_code: userDetails?.brn_code,
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/master/gp_list`, {
			params: {
		dist_id: dist_id, block_id: block_id
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

	const fetchBlock = async (dist_id) => {
		setBlocks([])
		setLoading(true)


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
			
			if(res?.data?.success){
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

	// useEffect(() => {
	// 	// fetchLoanApplications("U")
	// }, [])

	const setSearch = (word) => {
		const searchText = word?.toLowerCase() || ""
		setLoanApplications(
			copyLoanApplications?.filter((e) =>
				e?.gp_name?.toString()?.toLowerCase().includes(word?.toLowerCase())
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

	// const handleChangeMaster = (e) => {
	// const { name, value } = e.target
	// console.log(e.target, 'eeeeeee', name, value);
	// fetchBlock(value)
	// //   setMasterData((prev) => ({
	// //     ...prev,
	// //     [name]: value,
	// //   }))
	// }

	// useEffect(() => {
	// 	// fetchBlock(value)
	// }, [masterData])

	const handleChangeMaster = (e) => {
  const { name, value } = e.target

  setMasterData((prev) => {
    const updated = {
      ...prev,
      [name]: value,
    }

    // when district changes
    if (name === "dist_id") {
	
	if(value.length > 0){
		fetchBlock(value)
	} else {
		setBlocks([])
		setLoanApplications([])
		setCopyLoanApplications([])
	}
	updated.block_id = ""
    }

    // when block changes → call API with latest values
    if (name === "block_id") {
	if(updated.dist_id.length > 0 && value.length > 0){
	fetchLoanApplications(updated.dist_id, value)
	} else {
	setLoanApplications([])
	setCopyLoanApplications([])
	}
      
    }

    return updated
  })
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
					
					{/* {JSON.stringify(masterData, null, 2)} */}
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

					<GPListTable
						// flag="BM"
						flag=""
						loanAppData={loanApplications}
						title="GP List Master"
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

export default GPListMaster
