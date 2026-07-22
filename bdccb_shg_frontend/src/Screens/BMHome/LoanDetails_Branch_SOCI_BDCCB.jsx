import React, { useState } from "react"
import Sidebar from "../../Components/Sidebar"
import Payroll from "../Admin/Payroll/Payroll.jsx___"
import LoanDetails from "../Admin/LoanDetails/LoanDetails"
import LoanDetailsBranch from "../Admin/LoanDetailsBranchSOCI/LoanDetailsBranchSOCI"
import LoanDetailsBranchSHG from "../Admin/LoanDetailsBranchSHG/LoanDetailsBranchSHG"
import LoanDetailsBranchSOCI from "../Admin/LoanDetailsBranchSOCI/LoanDetailsBranchSOCI"
import FormHeader from "../../Components/FormHeader"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"

function LoanDetails_Branch_SOCI_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""

	return (
		<div>
			<Sidebar mode={2} />
			
			<section className="dark:bg-[#001529] flex justify-center align-middle p-5">

				<div className=" p-5 w-full min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader
							text={`Loan Recovery Of Society`}
							mode={2}
						/>
					</div>
					{/* <Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					> */}
						<div className="card bg-white border-2 p-5 mx-16 shadow-lg rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
							{/* {JSON.stringify(loanAppData, null, 2)} ccccccccccc */}
							<LoanDetailsBranchSOCI />
						</div>
					{/* </Spin> */}
				</div>
			</section>
		</div>
	)
}

export default LoanDetails_Branch_SOCI_BDCCB
