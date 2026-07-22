import React, { useState } from "react"
import Sidebar from "../../Components/Sidebar"
import LoanDetailsBranchGroup from "../Admin/LoanDetailsBranchGroup/LoanDetailsBranchGroup"
import FormHeader from "../../Components/FormHeader"

function LoanDetails_Branch_Group_BDCCB() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""

	return (
		<div>
			<Sidebar mode={2} />

			<section className="dark:bg-[#001529] flex justify-center align-middle p-5">

				<div className=" p-5 w-full min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader
							text={`Loan Recovery Of Group`}
							mode={2}
						/>
					</div>
					<div className="card bg-white border-2 p-5 mx-16 shadow-lg rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
						<LoanDetailsBranchGroup />
					</div>
				</div>
			</section>

		</div>
	)
}

export default LoanDetails_Branch_Group_BDCCB
