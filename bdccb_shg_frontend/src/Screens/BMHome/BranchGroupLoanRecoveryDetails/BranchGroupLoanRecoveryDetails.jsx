import React, { useEffect, useState } from "react"
import axios from "axios"
import { url_bdccb } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin } from "antd"
import { LoadingOutlined, SearchOutlined, SaveOutlined } from "@ant-design/icons"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { useNavigate, useLocation } from "react-router"
import { routePaths } from "../../../Assets/Data/Routes"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { useFormik } from "formik"
import FormHeader from "../../../Components/FormHeader"

function BranchGroupLoanRecoveryDetails() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [loanDetails, setLoanDetails] = useState([])
	const navigate = useNavigate()
	const location = useLocation()
	const data_Receive = location.state

	const initialValues = {
		transaction_date: data_Receive?.trans_dt || "",
		principal_amount: "",
		interest_amount: "",
		members: [],
	}

	const [formValues, setValues] = useState(initialValues)

	const formik = useFormik({
		initialValues: formValues,
		onSubmit: () => {},
		enableReinitialize: true,
	})

	const fetchDetails = async () => {
		setLoading(true)

		const creds = {
			tenant_id: userDetails[0]?.tenant_id,
			branch_id: userDetails[0]?.brn_code,
			group_code: data_Receive?.group_code,
			loan_id: data_Receive?.loan_id,
			trans_dt: data_Receive?.trans_dt,
			approval_status: data_Receive?.approval_status
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url_bdccb}/recov/fetch_group_mem_recov_dtls`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`,
				"Content-Type": "application/json",
			},
		})
		.then((res) => {
			if (res?.data?.success) {
				setLoanDetails(res?.data?.data || [])

				const members = (res?.data?.data[0]?.members || []).map(item => ({
					...item,
					loan_id: item.mem_loan_id,
					member_name: item.member_name,
					mem_outstanding: item.principal_amt,
					loan_amt: item.cr_amt,
					sb_amt: item.sb_amt
				}))

				setValues({
					...formValues,
					transaction_date: data_Receive?.trans_dt,
					members: members || []
				})
			} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
			}
		})
		.catch((err) => {
			Message("error", "Some error occurred while fetching group form")
		})
		setLoading(false)
	}

	useEffect(() => {
		if (data_Receive) {
			fetchDetails()
		} else {
			navigate(-1)
		}
	}, [])

	return (
		<section className=" dark:bg-[#001529] flex justify-center align-middle p-5">
			<div className="p-5 w-4/5 min-h-screen rounded-3xl">
				<div className="w-auto my-4">
					<FormHeader text={`Loan Recovery Of Group Details`} mode={2} />
				</div>
				<Spin indicator={<LoadingOutlined spin />} size="large" className="text-slate-800 dark:text-gray-400" spinning={loading}>
					<main className="p-5 bg-slate-50 rounded-lg shadow-lg h-auto my-0">
					
					<div className="grid grid-cols-4 gap-5 mt-0">
						<div className="sm:col-span-2">
							<TDInputTemplateBr
								placeholder="Type group name / group code"
								type="text"
								label="Type group name / group code"
								name="soci_loan_no"
								formControlName={`${data_Receive?.group_name} (${data_Receive?.group_code})`}
								disabled={true}
								mode={1}
							/>
						</div>
						<div className="mt-7 sm:col-span-1">
						</div>
					</div>

					<>
						<div className="grid grid-cols-4 gap-3 mt-5">
							<div>
								<TDInputTemplateBr placeholder="Disburse Date" type="text" label="Disburse Date" name="disburse_date" formControlName={loanDetails[0]?.disb_dt || ""} disabled={true} mode={1} />
							</div>
							<div>
								<TDInputTemplateBr placeholder="Period (In Month)" type="number" label="Period (In Month)" name="period_month" formControlName={loanDetails[0]?.period || ""} disabled={true} mode={1} />
							</div>
							<div>
								<TDInputTemplateBr placeholder="Current ROI" type="number" label="Current ROI" name="current_roi" formControlName={loanDetails[0]?.curr_roi || ""} disabled={true} mode={1} />
							</div>
							<div>
								<TDInputTemplateBr placeholder="Ovd ROI" type="number" label="Ovd ROI" name="ovd_roi" formControlName={loanDetails[0]?.penal_roi || ""} disabled={true} mode={1} />
							</div>
							<div>
								<TDInputTemplateBr placeholder="Total Disbursed Amount" type="number" label="Total Disbursed Amount" name="disbursed_amount" formControlName={loanDetails[0]?.disb_amt || ""} disabled={true} mode={1} />
							</div>
							<div>
								<TDInputTemplateBr placeholder="Transaction Date" type="text" label="Transaction Date" name="transaction_date" formControlName={formik.values.transaction_date || ""} disabled={true} mode={1} />
							</div>
						</div>

						{formik.values.members?.length > 0 && (
							<>
								<div className="text-[#DA4167] text-lg font-bold mb-0 mt-5">Members</div>
								<div className="grid grid-cols-4 gap-5 mt-2">
									<div><label className="block mb-0 text-sm capitalize font-bold text-slate-800"> Member Loan ID</label></div>
									<div><label className="block mb-0 text-sm capitalize font-bold text-slate-800"> Member Name</label></div>
									<div><label className="block mb-0 text-sm capitalize font-bold text-slate-800"> Outstanding Amount</label></div>
									<div><label className="block mb-0 text-sm capitalize font-bold text-slate-800"> Collect Amount</label></div>
									{/* <div><label className="block mb-0 text-sm capitalize font-bold text-slate-800"> SB Amount</label></div> */}
								</div>

								{formik.values.members.map((member, index) => (
									<div key={index} className="grid grid-cols-4 gap-5 mt-0">
										<div><TDInputTemplateBr placeholder="Member Loan ID" type="text" name={`members.${index}.loan_id`} formControlName={member.loan_id} disabled={true} mode={1} /></div>
										<div><TDInputTemplateBr placeholder="Member Name" type="text" name={`members.${index}.member_name`} formControlName={member.member_name} disabled={true} mode={1} /></div>
										<div><TDInputTemplateBr placeholder="Outstanding Amount" type="number" name={`members.${index}.mem_outstanding`} formControlName={member.mem_outstanding} disabled={true} mode={1} /></div>
										<div><TDInputTemplateBr placeholder="Collect Amount" type="number" name={`members.${index}.loan_amt`} formControlName={formik.values.members[index].loan_amt} disabled={true} mode={1} /></div>
										{/* <div><TDInputTemplateBr placeholder="SB Amount" type="number" name={`members.${index}.sb_amt`} formControlName={formik.values.members[index].sb_amt} disabled={true} mode={1} /></div> */}
									</div>
								))}

								<div className="grid grid-cols-4 gap-2 mt-2 bg-slate-100 p-2 rounded-lg bg-slate-200">
									<div className="text-black font-semibold text-base col-span-3 text-center pr-10">Total</div>
									<div className="pl-3 text-base">
										{Math.round(formik.values.members.reduce((sum, item) => sum + Number(item.loan_amt || 0), 0))}
									</div>
									{/* <div className="pl-3 text-base">
										{Math.round(formik.values.members.reduce((sum, item) => sum + Number(item.sb_amt || 0), 0))}
									</div> */}
								</div>


							</>
						)}
					</>
				</main>
				</Spin>
			</div>
		</section>
	)
}

export default BranchGroupLoanRecoveryDetails
