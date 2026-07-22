// FOR BDCCB 
import React, { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Button } from "antd"
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons"
import GroupsTableViewBr from "../../Components/GroupsTableViewBr"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { routePaths } from "../../Assets/Data/Routes"
import { useNavigate } from "react-router"
import MemberTableViewBr from "../../Components/MemberGroupTableViewBr.jsx__BDCCB"
import MemberGroupTableViewBr from "../../Components/MemberGroupTableViewBr.jsx__BDCCB"
import SahayikaTableViewBr from "../../Components/SahayikaTableViewBr"


function SearchSahayikaBM() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState(() => "")
	const [groups, setGroups] = useState(() => [])
	const [copyLoanApplications, setCopyLoanApplications] = useState(() => [])

	const [approvalStatus, setApprovalStatus] = useState("S")
	const navigate = useNavigate()
	

	const fetchSahayikaList = async () => {
		setGroups([])
		setLoading(true)

		// const creds = {
		// 	tenant_id: userDetails[0]?.tenant_id,
		// }
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/trans/sahayika_list`, {
		params: {
		tenant_id: userDetails[0]?.tenant_id,
		},
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		}
		})
			.then((res) => {
					console.log(res?.data?.msg, 'fetchSahayikaList', res?.data?.data);
					if(res?.data?.success){
					setGroups(res?.data?.data)
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



	useEffect(()=>{
		fetchSahayikaList()
	}, [])

	const setSearch = (word) => {
		console.log(word, "wordwordwordword", copyLoanApplications)
		setGroups(
			copyLoanApplications?.filter(
				(e) =>
					e?.sahayika_name
						?.toString()
						?.toLowerCase()
						.includes(word?.toLowerCase()) ||
					e?.sahayika_name
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
					
					{/* <div className="mt-20">
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
								placeholder="Search by Group Code/Group Name"
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
					</div> */}
					{/* {JSON.stringify(groups, 2)} */}
					<SahayikaTableViewBr
						flag="BM"
						loanAppData={groups}
						setSearch={(data) => setSearch(data)}
						title="Sahayika"
						showSearch={true}
					/>
					
				</main>
			</Spin>
		</div>
	)
}

export default SearchSahayikaBM
