import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import FormHeader from "../../Components/FormHeader";
import ViewBranchSHGLoanForm from "../Forms/ViewBranchSHGLoanForm";

function LoanCloseFlagGroupLevelDetails() {
	const params = useParams();
	const [loading, setLoading] = useState(false);
	const location = useLocation();

	return (
		<section className="dark:bg-[#001529] flex justify-center align-middle pb-10">
			<div className="w-full max-w-7xl rounded-3xl">
				<div className="w-auto my-4">
					<FormHeader text={`View Group Details for Close Loan`} mode={2} />
				</div>
				<Spin
					indicator={<LoadingOutlined spin />}
					size="large"
					className="text-blue-800 dark:text-gray-400"
					spinning={loading}
				>
					<div className="card border-2 p-5 bg-white shadow-lg rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
						<ViewBranchSHGLoanForm />
					</div>
				</Spin>
			</div>
		</section>
	);
}

export default LoanCloseFlagGroupLevelDetails;
