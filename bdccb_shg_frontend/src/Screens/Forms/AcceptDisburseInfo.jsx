// FOR BDCCB 
import React, { useEffect, useRef, useState } from "react"
import "../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import BtnComp from "../../Components/BtnComp"
import VError from "../../Components/VError"
import TDInputTemplate from "../../Components/TDInputTemplate"
import { useNavigate } from "react-router-dom"
import { ErrorMessage, Field, FieldArray, Form, Formik, useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import { Message } from "../../Components/Message"
import { url, url_bdccb } from "../../Address/BaseUrl"
import {
	Spin,
	Button,
	Popconfirm,
	Tag,
	Timeline,
	Divider,
	Typography,
	List,
	Select,
	Modal,
} from "antd"
import {
	LoadingOutlined,
	InfoCircleFilled,
	CheckCircleOutlined,
	UsergroupAddOutlined,
	UserOutlined,
} from "@ant-design/icons"
import FormHeader from "../../Components/FormHeader"
import { routePaths } from "../../Assets/Data/Routes"
import { useLocation } from "react-router"
import Sidebar from "../../Components/Sidebar"
import DialogBox from "../../Components/DialogBox"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import TimelineComp from "../../Components/TimelineComp"
import {
	PendingActionsOutlined,
	DeleteOutline,
	InfoOutlined,
} from "@mui/icons-material"
import { Checkbox } from "antd"
import { DataTable } from "primereact/datatable"
import Column from "antd/es/table/Column"
import { Toast } from "primereact/toast"
import AlertComp from "../../Components/AlertComp"
import { Map } from "lucide-react"
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
// import { format } from "date-fns"
import { saveMasterData } from "../../services/masterService"
import Radiobtn from "../../Components/Radiobtn"
import { formatDateToYYYYMMDD } from "../../Utils/formateDate"



function AcceptDisburseInfo({ groupDataArr }) {

	const params = useParams()
	const [loading, setLoading] = useState(false)
	const [visible, setVisible] = useState(() => false)
	const location = useLocation()
	const loanAppData = location.state || {}
	const navigate = useNavigate()
	const userDetails = JSON.parse(localStorage.getItem("user_details"))
	const [groupMemberTotal, setGroupMemberTotal] = useState();

	// const  loanAppData  = location.state || {}



	const getClientIP = async () => {
		const res = await fetch("https://api.ipify.org?format=json")
		const data = await res.json()
		return data.ip
	}

	const approveDisbursement = async () => {

				setLoading(true)

				const ip = await getClientIP()

				const creds = {
				tenant_id: userDetails[0]?.tenant_id,
				branch_id: userDetails[0]?.brn_code,
				voucher_dt: formatDateToYYYYMMDD(new Date()),
				voucher_id: 0,
				trans_id: loanAppData?.trans_id,
				voucher_type: "J",
				acc_code: "23101",
				trans_type: loanAppData?.trans_type,
				loan_to: loanAppData?.loan_to,
				pacs_shg_id: loanAppData?.branch_shg_id,
				dr_amt: loanAppData?.disb_amt,
				cr_amt: loanAppData?.disb_amt,
				loan_id: loanAppData?.loan_id,
				// tot_grp: loanAppData?.tot_grp,
				// tot_memb: loanAppData?.tot_memb,
				created_by: userDetails[0]?.emp_id,
				ip_address: ip,
			}


				console.log(creds, 'formDataformDataformDataformData');

				await saveMasterData({
				endpoint: "account/save_loan_voucher",
				creds,
				navigate,
				successMsg: "Transaction Accepted",
				onSuccess: () => navigate(-1),

				// 🔥 fully dynamic failure handling
				failureRedirect: routePaths.LANDING,
				clearStorage: true,
				})

				console.log(creds, 'formDataformDataformDataformData');

				setLoading(false)
				}


		// useEffect(() => {
		// fetchTotalGroupMember()
		// }, [])
	
		const fetchTotalGroupMember = async ()=>{
	
	
			setLoading(true)
			const creds = {
			branch_code : userDetails[0]?.brn_code,
			tenant_id : userDetails[0]?.tenant_id,
			}
	
			const tokenValue = await getLocalStoreTokenDts(navigate);
	
			await axios.post(`${url_bdccb}/loan/fetch_tot_grp_memb`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
	
			if(res?.data?.success){
			setGroupMemberTotal(res?.data?.data)
			console.log(res?.data?.data, 'searchAmtsearchAmtsearchAmtsearchAmt');
	
			} else {
			// navigate(routePaths.LANDING)
			// localStorage.clear()
			}
			})
			.catch((err) => {
			Message("error", "Some error occurred while fetching group form")
			})
	
			setLoading(false)
			
	
		}
	

	return (
		<>
			{/* {
			isOverdue === 'Y' && <AlertComp 
			
			msg={<p className="text-2xl font-normal"><span className="text-lg ">Loan Overdue Amount is </span>{formatINR(overDueAmt)}</p>} />
		} */}
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				{/* {(userDetails.id == 4 || userDetails.id == 3 || userDetails.id == 2 || userDetails.id == 13) && 
				<Button htmlType="button" type="primary" icon={<Map />} onClick={() => showModal()} className="my-3">View Distance</Button>} */}

				{/* <form > */}
				<div className="flex justify-start gap-5">
					<div className={"grid gap-4 sm:grid-cols-3 sm:gap-6 w-full mb-3"}>
						{/* {JSON.stringify(loanAppData, null, 2)} */}


						<div>
							<TDInputTemplateBr
								type="text"
								label="Transaction ID"
								formControlName={loanAppData?.tran_id} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>
							<TDInputTemplateBr
								type="text"
								label="Transaction Date"
								formControlName={new Date(loanAppData?.trans_dt).toLocaleDateString("en-GB")} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>
						<div>

							<TDInputTemplateBr
								type="text"
								label="Loan Account No. "
								formControlName={loanAppData?.loan_acc_no} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								label={userDetails[0]?.user_type == 'P'? 'Pacs' : 'SHG'}
								// label={'Sector'}
								formControlName={loanAppData?.branch_name} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
								label="Period (In Month)"
								formControlName={loanAppData?.period} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
								label="Current ROI"
								formControlName={loanAppData?.curr_roi} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>
						

						<div>
								
								<TDInputTemplateBr
									type="text"
									// label={loanAppData?.loan_to == 'P'? 'Pacs' : 'SHG'}
									label="Ovd ROI"
									formControlName={loanAppData?.penal_roi} // Default to SHG
									mode={1}
									disabled={true}
								/>
							</div>

						<div>

							<TDInputTemplateBr
								type="text"
								label="Disburse Date"
								formControlName={new Date(loanAppData?.disb_dt).toLocaleDateString("en-GB")} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								label="Disburse Amount"
								formControlName={loanAppData?.disb_amt} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>
						

						<div>

							<TDInputTemplateBr
								type="text"
								label="Loan Id"
								formControlName={loanAppData?.loan_id} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								label="Total Group"
								formControlName={loanAppData?.tot_grp} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						<div>

							<TDInputTemplateBr
								type="text"
								label="Total Member"
								formControlName={loanAppData?.tot_memb} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div>

						{/* <div>
							<TDInputTemplateBr
								type="text"
								label="Pay Mode"
								formControlName={loanAppData?.pay_mode} // Default to SHG
								mode={1}
								disabled={true}
							/>
						</div> */}

						{/* <div className="pt-6">
						
						<div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-lg shadow-sm">
						<span className="text-sm font-medium" style={{fontSize: 12}}>
						<UsergroupAddOutlined />Total Group:</span> <span className="text-base font-semibold" style={{fontSize: 12}}>{groupMemberTotal?.tot_grp}</span>
						<span className="text-sm font-medium" style={{fontSize: 12}}>
						<UserOutlined />  Member:</span> <span className="text-base font-semibold" style={{fontSize: 12}}>{groupMemberTotal?.tot_memb}</span>
						</div>
					
						</div> */}


					</div>
				</div>






				{/* {userDetails?.id != 3 &&  */}
				{/* <BtnComp mode="A" param={params?.id} /> */}
				<div className="flex justify-center">
					<button
						className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
						onClick={async () => {
							// await checkingBeforeApprove()
							setVisible(true)
						}}
					>
						<CheckCircleOutlined /> <span className={`ml-2`}>Accept Transaction</span>
					</button>
				</div>
				{/* } */}
				{/* </form> */}

				<DialogBox
					flag={4}
					onPress={() => setVisible(!visible)}
					visible={visible}
					onPressYes={async () => {
						await approveDisbursement()
							.then(() => {
							})
							.catch((err) => {
								console.log("Err in RecoveryCoApproveTable.jsx", err)
							})
						setVisible(!visible)
					}}
					onPressNo={() => {
						setVisible(!visible)
					}}
				/>

			</Spin>



			{/* <DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				 onPressYes={() => {
    if (pendingValues) {
      if(params?.id > 0) {
			editMember(pendingValues);
		} else {
			saveMemberData(pendingValues) 
		}   // 🔥 pass values here
    }
    setVisible(false);
  }}
				onPressNo={() => setVisible(!visible)}
			/> */}








		</>
	)
}

export default AcceptDisburseInfo
