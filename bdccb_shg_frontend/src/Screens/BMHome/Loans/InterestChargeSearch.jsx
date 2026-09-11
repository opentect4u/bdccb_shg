import React, { useState } from "react";
import axios from "axios";
import { url } from "../../../Address/BaseUrl";
import { Message } from "../../../Components/Message";
import { Spin } from "antd";
import { LoadingOutlined, SearchOutlined, SaveOutlined } from "@ant-design/icons";
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts";
import { useNavigate } from "react-router-dom";

function InterestChargeSearch() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || "";
	const [loading, setLoading] = useState(false);
	const [searchKeywords, setSearchKeywords] = useState("");
	const [fetchedData, setFetchedData] = useState(null);
    
    // Form States
    const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
    const [interestAmount, setInterestAmount] = useState("");

	const navigate = useNavigate();

	const fetchSearchedGroups = async () => {
		setLoading(true);
        setFetchedData(null);
        setInterestAmount("");
		const creds = {
			branch_code: userDetails?.[0]?.brn_code || userDetails?.brn_code,
			tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id || 1,
			ccb_loan_ac_no: searchKeywords,
		};

		const tokenValue = await getLocalStoreTokenDts(navigate);

		try {
			const res = await axios.post(`${url}/interestcharge/search_ccb_loan`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.success && res?.data?.data?.length > 0) {
				setFetchedData(res.data.data[0]);
			} else {
                setFetchedData(null);
                Message("error", res?.data?.msg || "No data found");
			}
		} catch (err) {
			Message("error", "Some error occurred while searching...");
			console.log("ERR", err);
		}
		setLoading(false);
	};

    const handleFormSubmit = async () => {
        if (!interestAmount || isNaN(interestAmount)) {
            Message("error", "Please enter a valid interest amount.");
            return;
        }
        if (!chargeDate) {
            Message("error", "Please select a date.");
            return;
        }
        
        setLoading(true);
        const creds = {
            trans_dt: chargeDate,
            tenant_id: userDetails?.[0]?.tenant_id || userDetails?.tenant_id || 1,
            branch_shg_id: fetchedData.branch_shg_id,
            loan_id: fetchedData.loan_id,
            loan_ac_no: searchKeywords,
            dr_amt: interestAmount,
            curr_prn: fetchedData.curr_prn || 0,
            curr_intt: fetchedData.curr_intt || 0,
            group_code: fetchedData.group_code,
            user_id: userDetails?.[0]?.emp_id || userDetails?.emp_id || "admin",
        };

        const tokenValue = await getLocalStoreTokenDts(navigate);

        try {
            const res = await axios.post(`${url}/interestcharge/submit_charge`, creds, {
                headers: {
                    Authorization: `${tokenValue?.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res?.data?.success) {
                Message("success", "Interest charge submitted successfully.");
                navigate('/homebm/interestcharge');
            } else {
                Message("error", res?.data?.msg || "Failed to submit charge");
            }
        } catch (err) {
            Message("error", "Some error occurred while submitting charge...");
            console.log("ERR", err);
        }
        setLoading(false);
    };

    const calculateTotal = () => {
        if (!fetchedData) return 0;
        const currentPrincipal = parseFloat(fetchedData.curr_prn || 0);
        const currentInterest = parseFloat(fetchedData.curr_intt || 0);
        const chargeAmt = parseFloat(interestAmount || 0);
        return (currentPrincipal + currentInterest + chargeAmt).toFixed(2);
    };

    // Get today's date in YYYY-MM-DD format to set max date on the date picker
    const today = new Date().toISOString().split('T')[0];

	return (
		<div className="mx-auto max-w-7xl pb-10">
			<Spin
				indicator={<LoadingOutlined spin style={{ fontSize: 24 }} />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				{/* Search View */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col gap-6 transition-shadow hover:shadow-md">
					<div className="flex items-center gap-4">
						<div>
							<h1 className="text-lg font-bold text-gray-800 tracking-tight mb-1">Interest Charge</h1>
							<p className="text-gray-500 text-sm">
								Search by CCB Loan A/C No to view group details
							</p>
						</div>
					</div>

					<div className="w-full flex items-center relative mt-4">
						<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<SearchOutlined className="text-gray-400 text-lg" />
						</div>
						<input
							type="search"
							className="w-full pl-12 pr-32 py-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-inner"
							placeholder="Enter CCB Loan A/C No..."
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

				{/* Search Results Details & Form */}
                {fetchedData && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all hover:shadow-xl duration-300">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">Group & Loan Details</h2>
                        
                        {/* Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 gap-x-12 mb-10 text-base bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex flex-col border-b border-slate-200 pb-2">
                                <span className="text-gray-500 font-medium mb-1">Group Name & Code</span>
                                <span className="text-gray-900 font-semibold">{fetchedData.group_name} ({fetchedData.group_code})</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-200 pb-2">
                                <span className="text-gray-500 font-medium mb-1">Loan ID</span>
                                <span className="text-gray-900 font-semibold">{fetchedData.loan_id}</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-200 pb-2">
                                <span className="text-gray-500 font-medium mb-1">Current Principal</span>
                                <span className="text-gray-900 font-semibold text-blue-700">₹ {parseFloat(fetchedData.curr_prn || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-200 pb-2">
                                <span className="text-gray-500 font-medium mb-1">Current Interest</span>
                                <span className="text-gray-900 font-semibold text-[#DA4167]">₹ {parseFloat(fetchedData.curr_intt || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Form Section */}
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">Interest Charge Application</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-8 text-base">
                            <div className="flex flex-col">
                                <label className="text-gray-700 font-bold mb-2">Transaction Date</label>
                                <input 
                                    type="date"
                                    className="border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DA4167]"
                                    max={today}
                                    value={chargeDate}
                                    onChange={(e) => setChargeDate(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-700 font-bold mb-2">Interest Amount to Charge (₹)</label>
                                <input 
                                    type="number"
                                    className="border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DA4167]"
                                    placeholder="Enter Amount"
                                    min="0"
                                    step="0.01"
                                    value={interestAmount}
                                    onChange={(e) => setInterestAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6">
                            <div className="flex flex-col mb-4 md:mb-0">
                                <span className="text-gray-600 font-bold uppercase tracking-wider text-sm">Total</span>
                                <span className="text-3xl font-black text-gray-900">₹ {calculateTotal()}</span>
                                <span className="text-xs text-gray-500 mt-1">(Principal + Current Interest + New Charge)</span>
                            </div>
                            <button
                                className="bg-[#DA4167] text-white hover:bg-[#c03558] transition-colors duration-300 font-bold text-base rounded-lg px-6 py-2 shadow-md flex items-center gap-2"
                                onClick={handleFormSubmit}
                            >
                                <SaveOutlined /> Submit
                            </button>
                        </div>
                    </div>
                )}
			</Spin>
		</div>
	);
}

export default InterestChargeSearch;
