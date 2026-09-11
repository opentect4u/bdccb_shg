import React, { useState, useEffect } from "react";
import { Spin, message } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { url } from "../../../Address/BaseUrl";
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts";
import ViewBranchSHGLoanTableBr from "../../../Components/ViewBranchSHGLoanTableBr";

function InterestCharge() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || "";
	const [loading, setLoading] = useState(false);
	const [chargedLoans, setChargedLoans] = useState([]);
	const navigate = useNavigate();

	const fetchChargedLoans = async () => {
		setLoading(true);
		const creds = {
			branch_code: userDetails?.[0]?.brn_code || userDetails?.brn_code,
			tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id || 1,
		};

		const tokenValue = await getLocalStoreTokenDts(navigate);

		try {
			const res = await axios.post(`${url}/interestcharge/list_charged_loans`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.success) {
				setChargedLoans(res.data.data);
			} else {
				setChargedLoans([]);
			}
		} catch (err) {
			message.error("Some error occurred while fetching the list...");
			console.log("ERR", err);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchChargedLoans();
	}, []);

	return (
		<div className="mx-auto max-w-7xl pb-10">
			<Spin
				indicator={<LoadingOutlined spin style={{ fontSize: 24 }} />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				{/* Initial List View */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-shadow hover:shadow-md">
					<div className="w-full md:w-2/3">
						<h1 className="text-lg font-bold text-gray-800 tracking-tight mb-1">Interest Charge</h1>
						<p className="text-gray-500 text-sm">
							List of loans that have been charged for interest.
						</p>
					</div>
					<div className="w-full md:w-1/3 flex justify-end">
						<button
							className="bg-[#DA4167] text-white hover:bg-[#c03558] transition-colors duration-300 font-medium rounded-lg px-6 py-2 shadow-sm flex items-center gap-2"
							onClick={() => navigate("search")}
						>
							<PlusOutlined /> Interest Charge
						</button>
					</div>
				</div>

				{/* Results Table Section */}
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl duration-300">
					<ViewBranchSHGLoanTableBr
						flag="INTEREST_CHARGE_LIST"
						loanAppData={chargedLoans}
						title="Loans with Interest Charged"
						showSearch={true}
					/>
				</div>
			</Spin>
		</div>
	);
}

export default InterestCharge;
