// import React, { useState } from "react"
import React, { useState, useEffect, useRef } from "react"
import { routePaths } from "../Assets/Data/Routes"
import { Link } from "react-router-dom"
import Tooltip from "@mui/material/Tooltip"
import { Paginator } from "primereact/paginator"
import { motion } from "framer-motion"
import {
	CheckCircleOutlined,
	LoadingOutlined,
	ClockCircleOutlined,
	EditOutlined,
	FileTextOutlined,
	SyncOutlined,
	CloseCircleOutlined,
	ArrowRightOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { Tag, Spin, Divider, Collapse, Popconfirm } from "antd"
import axios from "axios"
import DialogBox from "./DialogBox"
import { url, url_bdccb } from "../Address/BaseUrl"
// import Panel from "antd/es/splitter/Panel"
// import { Collapse } from "antd";
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Toast } from "primereact/toast"
import { Message } from "./Message"
import TDInputTemplateBr from "./TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../Utils/formateDate"
import moment from "moment"
import { getLocalStoreTokenDts } from "./getLocalforageTokenDts"

const { Panel } = Collapse

function UnapprovedDisbursTable_BDCCB({
	// loanAppData,
	// setSearch_Group,
	// title,
	// flag,
	// showSearch = true,
	// isForwardLoan = false,
	// isRejected = false,
	// loanType = "R",
	// fetchLoanApplications,
	// fetchLoanApplicationsDate,

	loanAppData,
	setSearch,
	title,
	flag,
	showSearch = true,
	isForwardLoan = false,
	isRejected = false,
	loanType = "M",
	fetchLoanApplications,
	fetchLoanApplicationsDate,
	onRefresh
}) {
	const navigate = useNavigate()

	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""

	const [visible, setVisible] = useState(() => false)
	const [visible_Reject, setVisible_Reject] = useState(() => false)

	const [loading, setLoading] = useState(() => false)
	// const [cachedPaymentId, setCachedPaymentId] = useState("")
	const [cachedPaymentId, setCachedPaymentId] = useState(() => [])

	// acordian start
	// const [products, setProducts] = useState([]);
	const [expandedRows, setExpandedRows] = useState(null)
	const toast = useRef(null)
	const isMounted = useRef(false)
	// const [rowClick, setRowClick] = useState(true);
	// const productService = new ProductService();
	const [selectedProducts, setSelectedProducts] = useState(null)
	const [currentPage, setCurrentPage] = useState(0)
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [LoanGroupMember, setLoanGroupMember] = useState(() => [])
	const [TotalEMI, setTotalEMI] = useState(0)
	const [CreditAmount, setCreditAmount] = useState(0)
	const [AmountTd_, setAmountTd_] = useState(0)
	const [Outstanding, setOutstanding] = useState(0)
	const [ShowApprov, setShowApprov] = useState(false)

	// const [useData, setSetData] = useState([])

	const [getloanAppData, setLoanAppData] = useState([])
	const [remarksForDelete, setRemarksForDelete] = useState("")
	const [RejectcachedPaymentId, setRejectCachedPaymentId] = useState(() => [])
	const [checkBeforeApproveData, setCheckBeforeApproveData] = useState(() => [])

	// useEffect(() => {
	// 	if (loanAppData.length > 0) {
	// 		setLoanAppData(loanAppData)
	// 	}
	// }, [loanAppData])

	// useEffect(() => {
	// 	console.log(getloanAppData, 'ffffffffffffffffff');

	// 	// // setSetData(loanAppData)
	// 	// if (isMounted.current) {
	// 	// 	const summary = expandedRows !== null ? 'All Rows Expanded' : 'All Rows Collapsed';
	// 	// 	toast.current.show({ severity: 'success', summary: `${summary}`, life: 3000 });
	// 	// }
	// }, [expandedRows]);

	useEffect(()=>{
		// setAmountTd_(loanAppData.reduce((sum, r) => sum + parseFloat(r.disb_amt || 0), 0).toFixed(2));

		if (loanAppData && loanAppData.length > 0) {
		const total = loanAppData.reduce(
		(sum, row) => sum + Number(row.disb_amt || 0),
		0
		);
		setAmountTd_(total.toFixed(2));
		}
		
	}, [loanAppData])

	const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}

	const handleSelectionChange = async (e) => {
		// Update the selected products

		// console.log(e.value, "e.value")
		// Perform any additional logic here, such as enabling a button or triggering another action
		
		// setSelectedProducts(e.value)
		const rows = e.value || [];

		setSelectedProducts(rows);

		// if (e.value) {
		if (rows.length > 0) {

			// setTotalEMI(rows.reduce((sum, r) => sum + parseFloat(r.tot_emi || 0), 0).toFixed(2));
			// setAmountTd_(rows.reduce((sum, r) => sum + parseFloat(r.disb_amt || 0), 0).toFixed(2));
			// setOutstanding(rows.reduce((sum, r) => sum + parseFloat(r.outstanding || 0), 0).toFixed(2));

			
			const ip = await getClientIP()

			const dat = rows.map((item) => {
				return {
					// trans_id: item?.trans_id,
					// loan_id: item?.loan_id,
					// payment_date: formatDateToYYYYMMDD(item?.transaction_date),

					tenant_id : userDetails[0]?.tenant_id,
					branch_id : userDetails[0]?.brn_code,
					voucher_dt : formatDateToYYYYMMDD(new Date()),
					voucher_id: 0,
					trans_id: item?.trans_id,
					voucher_type: "J",
					acc_code: "23101",
					trans_type: item?.trans_type,
					loan_to: item?.loan_to,
					pacs_shg_id : item?.branch_shg_id,
					dr_amt: item?.disb_amt,
					cr_amt: item?.disb_amt,
					loan_id: item?.loan_id,
					created_by : userDetails[0]?.emp_id,
					ip_address : ip,
				}
			})

			

			// setCachedPaymentId(group_Data)
			setCheckBeforeApproveData(dat[0])
			setShowApprov(true)
			// console.log(dat[0], "You selected  rows", cachedPaymentId, ">>>", rows)
		} else {
			setShowApprov(false)
			// setTotalEMI(0)
			// setAmountTd_(0)
			// setOutstanding(0)
			console.log("No rows selected")
		}
	}



	



	const approveDisbursement = async (cachedPaymentId) => {
		
		// console.log(cachedPaymentId, 'cachedPaymentIdcachedPaymentIdcachedPaymentId');
		setLoading(true)
		// const creds = {
		// 	approved_by: userDetails?.emp_id,
		// 	membdt: cachedPaymentId,
		// }
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url_bdccb}/account/save_loan_voucher`, cachedPaymentId, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {

				if(res?.data?.success){

					onRefresh();
					setSelectedProducts(null)
					// setTotalEMI(0)
					setAmountTd_(0)
					// setOutstanding(0)
					setLoading(false)

				} else {
				navigate(routePaths.LANDING)
				localStorage.clear()
				}

				
				// Message(res?.data?.suc == 1 ? 'success' : 'error',res?.data?.suc == 1 ? 'Approve successfully' : 'We are unable to process your request!!')
				
			})
			.catch((err) => {
				console.log("ERRR approveDisbursement", err);
				setLoading(false);
				Message('err','Not able to approve transactions')
			})
		setLoading(false)
	}


	return (
		<Spin
			indicator={<LoadingOutlined spin />}
			size="large"
			className="text-blue-800 dark:text-gray-400"
			spinning={loading}
		>
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
			>
				<div
					className={`flex flex-col p-1 bg-slate-800 dark:bg-slate-800  rounded-lg my-3 md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-1.5`}
				>
					<div className="w-full">
						<div className="flex items-center justify-between">
							<motion.h2
								initial={{ opacity: 0, y: -50 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 1, type: "just" }}
								className="text-xl w-48 capitalize text-nowrap font-bold text-white dark:text-white sm:block hidden mx-4"
							>
								{title}
							</motion.h2>

							<label htmlFor="simple-search" className="sr-only">
								Search
							</label>
							{showSearch && (
								<div className="relative w-full -right-12 2xl:-right-12">
									<div className="absolute inset-y-0 left-0 flex items-center md:ml-4 pl-3 pointer-events-none">
										<svg
											aria-hidden="true"
											className="w-5 h-5 text-gray-500 dark:text-gray-400"
											fill="currentColor"
											viewBox="0 0 20 20"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												fillRule="evenodd"
												d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<motion.input
										type="text"
										id="simple-search"
										initial={{ opacity: 0, width: 0 }}
										animate={{ opacity: 1, width: "92%" }}
										transition={{ delay: 1.1, type: "just" }}
										className={`bg-white border rounded-lg border-slate-700 text-gray-800 block w-full h-12 pl-10 dark:bg-gray-800 md:ml-4 duration-300 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-lg focus:border-blue-600`}
										placeholder="Search By Loan Account No."
										required=""
										onChange={(text) => setSearch(text.target.value)}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</motion.section>
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
			>
				<Toast ref={toast} />

				
					{/* {JSON.stringify(loanAppData, 2)} */}
				<DataTable
					value={loanAppData?.map((item, i) => [{ ...item, id: i }]).flat()}
					selectionMode="checkbox"
					
					selection={selectedProducts}
					// onSelectionChange={(e) => handleSelectionChange(e)}
					 scrollable scrollHeight="400px"
					
					tableStyle={{ minWidth: "50rem" }}
					dataKey="id"
					tableClassName="w-full text-sm text-left rtl:text-right shadow-lg text-green-900dark:text-gray-400 table_Custome table_Custome_1st" // Apply row classes
				>
					<Column
						header="Sl No."
						body={(rowData) => (
							<span style={{ fontWeight: "bold" }}>{rowData?.id + 1}</span>
						)}
					></Column>
					{/* <Column
						// selectionMode="single"
						selectionMode="multiple"
						headerStyle={{ width: "3rem" }}
					></Column> */}

					<Column
						field="trans_id"
						header="Transaction ID"
						footer={<span style={{ fontWeight: "bold" }}>Total</span>}
					></Column>

					<Column
						field="trans_dt"
						header="Transaction Date"
						body={(rowData) =>
							new Date(rowData?.trans_dt).toLocaleDateString("en-GB")
						}
						// footer={<span style={{ fontWeight: "bold" }}>{Outstanding}</span>}
					></Column>

					<Column
						field="loan_id"
						header="Loan Id"
					></Column>

					
					<Column
						field="loan_acc_no"
						header="Loan Account No. "
						// body={(rowData) =>
						// 	new Date(rowData?.loan_acc_no).toLocaleDateString("en-GB")
						// }
					></Column>
						<Column
						field="disb_dt"
						header="Disburse Date"
						body={(rowData) =>
							new Date(rowData?.disb_dt).toLocaleDateString("en-GB")
						}
						// footer={<span style={{ fontWeight: "bold" }}>{Outstanding}</span>}
					></Column>

					<Column
						field="disb_amt"
						header="Disburse Amount"
						footer={
							<span style={{ fontWeight: "bold", color: "#0694A2" }}>
								{AmountTd_}
							</span>
						}
					></Column>

					<Column
						// field="curr_prn"
						header="Action"
						body={(rowData) => (
						<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<button
						type="button"
						onClick={() => {
						console.log("ROW DATA:", rowData);
						navigate(
						`/homepacs/approvedisbursed/${rowData?.loan_id}`,
						{ state: rowData }
						);
						}}
						style={{ background: "transparent", border: "none", cursor: "pointer" }}
						>
						<CheckCircleOutlined className="text-md text-slate-800" />
						</button>
						</div>
						)}
					></Column>
				
				</DataTable>
				{/* <>{JSON.stringify(cachedPaymentId, null, 2)}</> */}

				{/* <div className="grid-cols-2 h-3 gap-5 mt-3 items-center text-left">
					{(ShowApprov && userDetails?.id != 3) && (
						<>
							<motion.section
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
							>
								<button
									className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
									onClick={async () => {
										// await checkingBeforeApprove()
										setVisible(true)
									}}
								>
									<CheckCircleOutlined /> <span className={`ml-2`}>Approve</span>
								</button>
							</motion.section>
						</>
					)}
				</div> */}
			</motion.section>

			<DialogBox
				flag={4}
				onPress={() => setVisible(!visible)}
				visible={visible}
				onPressYes={async () => {
					await approveDisbursement(checkBeforeApproveData)
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
	)
}

export default UnapprovedDisbursTable_BDCCB
