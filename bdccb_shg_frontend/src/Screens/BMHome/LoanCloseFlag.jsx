import React, { useState } from "react";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import { url_bdccb } from "../../Address/BaseUrl";
import { Message } from "../../Components/Message";
import { Spin } from "antd";
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts";
import { useNavigate } from "react-router";
import { routePaths } from "../../Assets/Data/Routes";
import ViewBranchSHGLoanTableBr from "../../Components/ViewBranchSHGLoanTableBr";

function LoanCloseFlag() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || "";
	const [loading, setLoading] = useState(false);
	const [searchKeywords, setSearchKeywords] = useState("");
	const [groups, setGroups] = useState([]);
	const navigate = useNavigate();

	const fetchSearchedGroups = async () => {
		setLoading(true);
		const creds = {
			branch_code: userDetails?.[0]?.brn_code || userDetails?.brn_code,
			tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id,
			group_name_view: searchKeywords,
			branch_type: userDetails?.[0]?.branch_type || userDetails?.branch_type || (window.location.pathname.includes('/homepacs') ? 'P' : 'B'),
			...(window.location.pathname.includes('/homepacs') && { user_type: 'P' })
		};

		const tokenValue = await getLocalStoreTokenDts(navigate);

		try {
			const res = await axios.post(`${url_bdccb}/loanclose/search_loan_close_grp`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.success) {
				setGroups(res?.data?.data);
			} else {
				navigate(routePaths.LANDING);
				localStorage.clear();
			}
		} catch (err) {
			Message("error", "Some error occurred while searching...");
			console.log("ERR", err);
		}
		setLoading(false);
	};

	return (
		<div className="mx-auto max-w-7xl pb-10">
			<Spin
				indicator={<LoadingOutlined spin style={{ fontSize: 24 }} />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				{/* Clean Search Section */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-shadow hover:shadow-md">
					<div className="w-full md:w-1/3">
						<h1 className="text-2xl font-bold text-gray-800 tracking-tight mb-1">
							{window.location.pathname.includes('/homepacs') ? "Society Loan Close" : "Branch Loan Close"}
						</h1>
						<p className="text-gray-500 text-sm">
							{window.location.pathname.includes('/homepacs')
								? "Search by Group Name, Group Code, or Society A/C Number"
								: "Search by Group Name, Group Code, or CCB A/C Number"}
						</p>
					</div>

					<div className="w-full md:w-2/3 flex items-center relative">
						<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<SearchOutlined className="text-gray-400 text-lg" />
						</div>
						<input
							type="search"
							className="w-full pl-12 pr-32 py-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-inner"
							placeholder="Enter Search Criteria..."
							onChange={(e) => setSearchKeywords(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && searchKeywords && fetchSearchedGroups()}
						/>
						<button
							className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#DA4167] text-white hover:bg-[#c03558] transition-colors duration-300 font-medium rounded-lg px-6 py-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={fetchSearchedGroups}
							disabled={!searchKeywords || loading}
						>
							Search
						</button>
					</div>
				</div>

				{/* Results Table Section */}
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl duration-300">
					<ViewBranchSHGLoanTableBr
						flag="LOAN_CLOSE"
						loanAppData={groups}
						title="Search Results"
						showSearch={false}
					/>
				</div>
			</Spin>
		</div>
	);
}

export default LoanCloseFlag;
