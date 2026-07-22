// FOR BDCCB 
import React, { useState } from "react"
import "../../../LoanForm/LoanForm.css"
import "../../../BMHome/EditLoanFormBMStyles.css"
import { useParams } from "react-router"
import { useNavigate } from "react-router-dom"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import FormHeader from "../../../../Components/FormHeader"
import { useLocation } from "react-router"
import Sidebar from "../../../../Components/Sidebar"
import BankMasterForm from "../../../Forms/Master/BankMasterForm"
import DesignationMasterForm from "../../../Forms/Master/DesignationMasterForm"
import DistrictMasterForm from "../../../Forms/Master/DistrictMasterForm"
import PoliceStationForm from "../../../Forms/Master/PoliceStationForm"
// import PostMasterForm from "../../../Forms/Master/PostMasterForm"

function EditPoliceStationMaster() {
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const { loanAppData } = location.state || {}
	const navigate = useNavigate()

	return (
		<>
			<Sidebar mode={2} />
			<section className="dark:bg-[#001529] flex justify-center align-middle p-5">
				{/* {params.id>0 && data && <PrintComp toPrint={data} title={'Department'}/>} */}
				{/* <HeadingTemplate
				text={params.id > 0 ? "Update vendor" : "Add vendor"}
				mode={params.id > 0 ? 1 : 0}
				title={"Vendor"}
				data={params.id && data ? data : ""}
			/> */}
				{/* {JSON.stringify(loanAppData)} */}
				<div className="px-1 py-5 w-4/5 min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader text="Add/Edit Police Station Master" mode={2} />
					</div>
					<Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					>
						<div className="card shadow-lg bg-white border-2 p-5 mx-16  rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
							<PoliceStationForm />
						</div>
					</Spin>
				</div>
			</section>

			
		</>
	)
}

export default EditPoliceStationMaster
