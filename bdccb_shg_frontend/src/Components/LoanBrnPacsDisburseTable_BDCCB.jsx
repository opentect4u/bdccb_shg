import React, { useEffect, useState } from "react"
import { routePaths } from "../Assets/Data/Routes"
import { Link } from "react-router-dom"
import Tooltip from "@mui/material/Tooltip"
import { Paginator } from "primereact/paginator"
import { motion } from "framer-motion"
import {
	CheckCircleFilled,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	EditOutlined,
	EyeOutlined,
	FileTextOutlined,
	PlusOutlined,
	SyncOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { Tag } from "antd"
import { Message } from "./Message"
import Column from "antd/es/table/Column"
import { DataTable } from "primereact/datatable"

function LoanBrnPacsDisburseTable_BDCCB({
	loanAppData,
	setSearch,
	title,
	flag,
	showSearch = true,
	isForwardLoan = false,
	isRejected = false,
	disbursementStatus
}) {
	const navigate = useNavigate()

	const [first, setFirst] = useState(0)
	const [rows, setRows] = useState(10)
	const [AmountTd_dis, setAmountTd_dis] = useState(0)
	const [AmountTd_dis_Prn, setAmountTd_Prn] = useState(0)

	const onPageChange = (event) => {
		setFirst(event.first)
		setRows(event.rows)
	}

	useEffect(()=>{
		// setAmountTd_(loanAppData.reduce((sum, r) => sum + parseFloat(r.disb_amt || 0), 0).toFixed(2));
		setAmountTd_dis(0)

		if (loanAppData && loanAppData.length > 0) {
		const total = loanAppData.reduce(
		(sum, row) => sum + Number(row.disb_amt || 0),
		0
		);

		const total_prn = loanAppData.reduce(
		(sum, row) => sum + Number(row.curr_prn || 0),
		0
		);

		
		setAmountTd_dis(total.toFixed(2));
		setAmountTd_Prn(total_prn.toFixed(2));
		}
		
	}, [loanAppData])

	return (
		<>
			
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
			>
				{/* {JSON.stringify(disbursementStatus, 2)}  */}
				{/* {JSON.stringify(loanAppData, 2)}  */}
				

									<DataTable
									value={loanAppData?.map((item, i) => [{ ...item, id: i }]).flat()}
									selectionMode="checkbox"

									// selection={selectedProducts}
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
				
									{/* <Column
										field="sanction_no"
										header="Sanction No."
										footer={<span style={{ fontWeight: "bold" }}>Total</span>}
									></Column>
				
									<Column
										field="sanction_dt"
										header="Sanction Date"
									></Column> */}

									<Column
										field="loan_id"
										header="Loan Id"
										
									></Column>

									<Column
										field="loan_acc_no"
										header="Loan Account No."
										footer={<span style={{ fontWeight: "bold" }}>Total</span>}
									></Column>

									<Column
										field="group_name"
										header="SHG Name"
									></Column>
				
									{/* <Column
										field="loan_to_name"
										header="Group Name "
										// body={(rowData) =>
										// 	new Date(rowData?.loan_acc_no).toLocaleDateString("en-GB")
										// }
									></Column> */}
									<Column
										field="disb_dt"
										header="Disburse Date"
									></Column>
									<Column
										field="disb_amt"
										header="Disburse Amount"
										footer={<span style={{ fontWeight: "bold" }}>{AmountTd_dis}</span>}
									></Column>

									<Column
									field="approval_status"
									header="Status"
									body={(rowData) => {
										if (rowData.approval_status === "U") {
										return (
											<div className="pending_dis_2">
											<SyncOutlined style={{ color: "#fff", marginRight: 6 }} />
											Unapproved
											</div>
										);
										} else if (rowData.approval_status === "A") {
										return (
											<div className="accept_dis_2">
											<CheckCircleFilled style={{ color: "#fff", marginRight: 6 }} />
											Approved
											</div>
										);
										} else {
										return (
											<div className="pending_dis_2">
											<CloseCircleOutlined style={{ color: "#fff", marginRight: 6 }} />
											Rejected
											</div>
										);
										}
									}}
									/>

				
										{/* <Column
										field="disb_amt"
										header="Disburse Amount"
										footer={
											<span style={{ fontWeight: "bold", color: "#0694A2" }}>
												{AmountTd_}
											</span>
										}
									></Column> */}
				

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
										`/homebm/disburseloan/${rowData?.loan_id?.toString().split(",")[0].trim()}`,
										{ state: rowData }
										);
										}}
										style={{ background: "transparent", border: "none", cursor: "pointer" }}
										>

										{disbursementStatus === "U" ? (
										<EditOutlined className="text-md text-slate-800" />
										) : disbursementStatus === "A" ? (
										<EyeOutlined className="text-md text-slate-800" />
										) : null}
											
										</button>
										</div>
										)}
									></Column>

									{/* )} */}
									
								
								</DataTable>
								
				<Paginator
					first={first}
					rows={rows}
					totalRecords={loanAppData?.length}
					rowsPerPageOptions={[3, 5, 10, 15, 20, 30, loanAppData?.length]}
					onPageChange={onPageChange}
				/>
			</motion.section>
		</>
	)
}

export default LoanBrnPacsDisburseTable_BDCCB
