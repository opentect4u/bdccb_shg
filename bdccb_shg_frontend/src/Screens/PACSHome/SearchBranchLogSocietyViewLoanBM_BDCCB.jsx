import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button, Select } from "antd"
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons"
import GroupsTableViewBr from "../../Components/GroupsTableViewBr"
import ViewLoanTableBr from "../../Components/ViewLoanTableBr"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import ViewSocietyLoanTableBr from "../../Components/ViewSocietyLoanTableBr"
import { useFormik } from "formik"
import * as Yup from "yup"

function SearchBranchLogSocietyViewLoanBM_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	const [PACS_SHGList, setPACS_SHGList] = useState([]);
	const [selectedPacs, setSelectedPacs] = useState("");


	const fetchSearchedGroups = async () => {
		setLoading(true)
		const creds = {
			branch_code: selectedPacs,
			tenant_id: userDetails[0]?.tenant_id,
			group_name_view: searchKeywords,
		}

		// {
		// "tenant_id" : "",
		// "branch_code" : "",
		// "group_name_view" : "group_code/group_name/society_acc_no"
		// }

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/search_grp_view`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				console.log(res?.data?.data, 'gaaaaaaaaaaaaaaaaaaaaaa');
				
				if(res?.data?.success){
				setGroups(res?.data?.data)
				// setCopyLoanApplications(res?.data?.data)

				} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
				}
				
			})
			.catch((err) => {
				Message("error", "Some error occurred while searching...")
				console.log("ERR", err)
			})
		setLoading(false)
	}


	const handleSearchPacsChange = async (value) => {
	setPACS_SHGList([])
	setGroups([])
	setLoading(true)

	const creds = {
	loan_to: 'P',
	branch_code: userDetails[0]?.brn_code,
	branch_shg_id: '',
	tenant_id: userDetails[0]?.tenant_id,
	}

	const tokenValue = await getLocalStoreTokenDts(navigate);

	await axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
	headers: {
	Authorization: `${tokenValue?.token}`, // example header
	"Content-Type": "application/json", // optional
	},
	})
	.then((res) => {

	if (res?.data?.success) {

	console.log(creds, 'credscredscredscreds', res?.data?.data);


	if (userDetails[0]?.user_type == 'B') {
	setPACS_SHGList(res?.data?.data?.map((item, i) => ({
	code: item?.branch_id,
	name: item?.branch_name,
	})))
	}

	} else {
	navigate(routePaths.LANDING)
	localStorage.clear()
	}
	})
	.catch((err) => {
	Message("error", "Some error occurred while fetching group form")
	})

	setLoading(false)
	};

	useEffect(() => {
	handleSearchPacsChange()
	}, [selectedPacs]);


	return (
		<div>
			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="px-4 h-auto my-10 mx-32">
				<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-4"}>

				<div>
				{/* {JSON.stringify(formValues, 2)} */}

				<label for="loan_to" class="block mb-2 text-sm capitalize font-bold text-slate-800
				dark:text-gray-100">
				Select PACS *
				{/* Select PACS/SHG * */}
				</label>

				<Select
				showSearch
				value={selectedPacs}
				style={{ width: "100%" }}
				optionFilterProp="children"
				onChange={(value) => {
					setSelectedPacs(value)
				}}
				filterOption={(input, option) =>
					option?.children?.toLowerCase().includes(input.toLowerCase())
				}
				>
				<Select.Option value="" disabled>
					Choose PACS
				</Select.Option>

				{PACS_SHGList?.map((data) => (
					<Select.Option key={data.code} value={data.code}>
					{data.name}
					</Select.Option>
				))}
				</Select>


				{/* {formik.errors.branch_shg_id && formik.touched.branch_shg_id ? (
				<VError title={formik.errors.branch_shg_id} />
				) : null} */}




				</div>
				</div>

					

					<div className="mt-0">
						<label
							for="default-search"
							className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
						>
							Search
						</label>
						<div className="relative mt-10">
							<div className="absolute inset-y-0  start-0 flex items-center ps-3 pointer-events-none">
								<svg
									className="w-4 h-4 text-gray-500 dark:text-gray-400"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 20 20"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
									/>
								</svg>
							</div>
							<input
								type="search"
								id="default-search"
								className="block mt-10 w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-slate-500 focus:border-slate-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-slate-500 dark:focus:border-slate-500"
								placeholder="Search Loans by Group Name / Code / Society A/C Number"
								onChange={(e) => setSearchKeywords(e.target.value)}
							/>
							<button
								type="submit"
								className="text-white absolute end-2.5 disabled:bg-[#ee7c98] bottom-2.5 bg-[#DA4167] hover:bg-[#DA4167] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-md text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								onClick={fetchSearchedGroups}
								disabled={!searchKeywords}
							>
								Search
							</button>
						</div>
					</div>
						{/* {JSON.stringify(groups, 2)} */}
					<ViewSocietyLoanTableBr 
						flag="SOC"
						loanAppData={groups}
						selectedPacs={selectedPacs}
						title="Find Loans by Group"
						showSearch={false}
					// setSearch={(data) => setSearch(data)}
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

export default SearchBranchLogSocietyViewLoanBM_BDCCB
