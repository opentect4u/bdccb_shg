// FOR BDCCB 
import React, { useEffect, useState } from "react"
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
import axios from "axios"
import { url_bdccb } from "../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { Message } from "../../Components/Message"

function EditGroupFormBM() {
	const params = useParams()
	const [loading, setLoading] = useState(false)
	const [canEdit, setCanEdit] = useState(true)
	const [existLoan, setExistLoan] = useState(false)
	const location = useLocation()
	const loanAppData = location.state || {}
	const navigate = useNavigate()

	const fetchGroupOutstanding = async () => {
		const groupCode =
			params?.id && params?.id !== "0"
				? params?.id
				: loanAppData?.group_code
				? String(loanAppData.group_code)
				: ""

		if (!groupCode) {
			setCanEdit(true)
			setExistLoan(false)
			return
		}

		setLoading(true)
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const headers = { "Content-Type": "application/json" }
			if (tokenValue?.token) {
				headers.Authorization = `${tokenValue?.token}`
			}

			const res = await axios.post(
				`${url_bdccb}/group/fetch_grp_outstanding`,
				{
					group_code: String(groupCode),
				},
				{ headers }
			)

			if (res?.data?.success) {
				if (res?.data?.exist_loan) {
					setCanEdit(false)
					setExistLoan(true)
					Message(
						"warning",
						"This group has an outstanding loan balance and cannot be edited."
					)
				} else {
					setCanEdit(true)
					setExistLoan(false)
				}
			} else {
				setCanEdit(true)
				setExistLoan(false)
			}
		} catch (error) {
			console.error("Error fetching group outstanding:", error)
			setCanEdit(true)
			setExistLoan(false)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchGroupOutstanding()
	}, [params?.id])

	return (
		<>
			<Sidebar mode={2} />
			<section className="dark:bg-[#001529] flex justify-center align-middle p-5">
				<div className=" p-5 w-full min-h-screen rounded-3xl">
					<div className="w-auto mx-14 my-4">
						<FormHeader
							text={`${
								params?.id == 0
									? "Add Group"
									: existLoan
									? "Preview Group"
									: "Edit/Preview Group"
							}`}
							mode={2}
						/>
					</div>

					<Spin
						indicator={<LoadingOutlined spin />}
						size="large"
						className="text-blue-800 dark:text-gray-400"
						spinning={loading}
					>
						<div className="card bg-white border-2 p-5 mx-16 shadow-lg rounded-3xl surface-border border-round surface-ground flex-auto font-medium">
							{/* {JSON.stringify(loanAppData, null, 2)} ccccccccccc */}
							<GroupExtendedForm
								groupDataArr={loanAppData}
								canEdit={canEdit}
								existLoan={existLoan}
							/>
						</div>
					</Spin>
				</div>
			</section>
		</>
	)
}

export default EditGroupFormBM
