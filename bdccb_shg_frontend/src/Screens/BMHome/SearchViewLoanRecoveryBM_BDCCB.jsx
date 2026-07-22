import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button } from "antd"
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons"
import GroupsTableViewBr from "../../Components/GroupsTableViewBr"
import ViewLoanTableBr from "../../Components/ViewLoanTableBr_BDCCB"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import ViewLoanTableRecovery_BDCCB from "../../Components/ViewLoanTableRecovery_BDCCB"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"

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

function SearchViewLoanRecoveryBM_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	const [loanType, setLoanType] = useState("U")

	const today = new Date().toISOString().split("T")[0];

	const [fromDate, setFromDate] = useState(today);
	const [toDate, setToDate] = useState(today);

	// const initialValues = {
	
	// 		sanction_dt: "",
			
	// 	}
	// 	const [formValues, setValues] = useState(initialValues)

	// 	const validationSchema = Yup.object({
	// 			sanction_dt: Yup.mixed(),
		
	// 		})
	

	const fetchSearchedGroups = async () => {
		setLoading(true)
		const creds = {
			branch_id: userDetails[0]?.brn_code ,
			tenant_id: userDetails[0]?.tenant_id,
			// from_dt: fromDate,
			// to_dt: toDate,
			from_dt: '',
			to_dt: '',
			approval_status: loanType
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/recov/fetch_society_recov_dtls`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				console.log(res?.data, 'dataaaaaaaaaaaaaaa', creds);
				

				if(res?.data?.success){
				setGroups(res?.data?.data)
				setCopyLoanApplications(res?.data?.data)

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

	useEffect(()=>{
	fetchSearchedGroups()
	}, [])

		const setSearch = (word) => {
		console.log(word, "wordwordwordword", copyLoanApplications)
		setGroups(
			copyLoanApplications?.filter(
				(e) =>
					e?.group_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.group_code
						?.toString()
						?.toLowerCase()
						?.includes(word?.toLowerCase())
			)
		)
	}

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
					{/* <div className="flex flex-row gap-3 mt-20">
					<div>
					<TDInputTemplateBr
					type="date"
					label="From Date"
					name="from_dt"
					formControlName={fromDate}
					handleChange={(e) => setFromDate(e.target.value)}
					mode={1}
					/>
					</div>

					<div>
					<TDInputTemplateBr
					type="date"
					label="To Date"
					name="to_dt"
					formControlName={toDate}
					handleChange={(e) => setToDate(e.target.value)}
					mode={1}
					/>
					</div>

<button
	type="button"
	onClick={fetchSearchedGroups}
	className="bg-slate-700 text-white hover:bg-slate-800 p-5 mt-7 text-sm border-none rounded-lg w-30 h-10 flex justify-center items-center gap-2"
>
	<SearchOutlined />
	Search
</button>
										
					</div> */}
					

					<div className="mt-5">
						<label
							for="default-search"
							className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
						>
							Search
						</label>
						<div className="relative mt-0">
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
								className="block mt-0 w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-slate-500 focus:border-slate-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-slate-500 dark:focus:border-slate-500"
								placeholder="Search Loans by Group Name / Code"
								// onChange={(e) => setSearchKeywords(e.target.value)}
								onChange={(text) => setSearch(text.target.value)}
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
					{/* {JSON.stringify(fromDate, 2)} */}

					{/* {JSON.stringify(toDate, 2)} */}

					{/* {JSON.stringify(groups[0], 2)} */}


					<ViewLoanTableRecovery_BDCCB
						flag="BM"
						loanAppData={groups}
						title="Find Recovery Loans by Society"
						showSearch={false}
						setSearch={(data) => setSearch(data)}
						refreshData={fetchSearchedGroups}
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

export default SearchViewLoanRecoveryBM_BDCCB
