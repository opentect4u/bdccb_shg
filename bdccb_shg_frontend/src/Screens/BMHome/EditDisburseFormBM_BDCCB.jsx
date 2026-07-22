import React, { useState } from "react"
import "../LoanForm/LoanForm.css"
import "./EditLoanFormBMStyles.css"
import { useParams } from "react-router"
import { useNavigate } from "react-router-dom"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import FormHeader from "../../Components/FormHeader"
import { useLocation } from "react-router"
import Sidebar from "../../Components/Sidebar"
import GroupExtendedForm from "../Forms/GroupExtendedForm"
import DisbursmentForm from "../Forms/DisbursmentForm"
import DisbursmentForm_BDCCB from "../Forms/DisbursmentForm_BDCCB"
import BrnPacsDisbursmentForm_BDCCB from "../Forms/BrnPacsDisbursmentForm_BDCCB"

function EditDisburseFormBM_BDCCB() {
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const { loanAppData } = location.state || {}
	const navigate = useNavigate()

	return (
		<>
			<Sidebar mode={2} />
			{/* <section className=" dark:bg-[#001529] flex justify-center align-middle p-5">
				
				
				<div className="p-5 w-4/5 min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader text={`${params?.id == 0 ? "Loan Disburse Form" : "Edit/Preview Loan Disburse Form"}`} mode={2} />
					</div>
					<Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					>
						<div className="card shadow-lg bg-white border-2 p-5 mx-16 rounded-3xl surface-border border-round surface-ground flex-auto font-medium"> */}
							<BrnPacsDisbursmentForm_BDCCB flag="BM"/>
						{/* </div>
					</Spin>
				</div>
			</section> */}

			
		</>
	)
}

export default EditDisburseFormBM_BDCCB
