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

function DepositTableApprove_BDCCB({
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
	const [AmountDr_Amt, setAmountDr_Amt] = useState(0)
	const [AmountCr_Amt, setAmountCr_Amt] = useState(0)

	const onPageChange = (event) => {
		setFirst(event.first)
		setRows(event.rows)
	}

	useEffect(() => {
		// setAmountTd_(loanAppData.reduce((sum, r) => sum + parseFloat(r.disb_amt || 0), 0).toFixed(2));
		// setAmountDr_Amt(0)

		if (loanAppData && loanAppData.length > 0) {
			const total_dr_amt = loanAppData.reduce(
				(sum, row) => sum + Number(row.dr_amt || 0),
				0
			);



			const total_cr_amt = loanAppData.reduce(
				(sum, row) => sum + Number(row.cr_amt || 0),
				0
			);

			console.log(total_cr_amt, "Total Debit Amount:", total_dr_amt);


			setAmountDr_Amt(total_dr_amt.toFixed(2));
			setAmountCr_Amt(total_cr_amt.toFixed(2));
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


					<Column
						field="group_name"
						header="Group Name"

					></Column>

					<Column
						field="acc_no"
						header="SB Account No."
						footer={<span style={{ fontWeight: "bold" }}>Total</span>}
					></Column>

					<Column
						field="trans_dt"
						header="Transaction Date"
					// body={(rowData) => {
					// const date = new Date(rowData.trans_dt);
					// return date.toISOString().split("T")[0];
					// }}
					></Column>

					<Column
						field="dep_with_flag"
						header="Deposit / Withdrawal"
						body={(rowData) => {
							if (rowData.dep_with_flag === "D") {
								return (
									<div className="deposit_div">
										<SyncOutlined style={{ color: "#fff", marginRight: 6 }} />
										Deposit
									</div>
								);
							} else {
								return (
									<div className="withdraw_div">
										<CloseCircleOutlined style={{ color: "#fff", marginRight: 6 }} />
										Withdrawal
									</div>
								);
							}
						}}
					/>


					{/* <Column
						field="cr_amt"
						header="Credit Amount"
						// footer={<span style={{ fontWeight: "bold" }}>{`rowData.dep_with_flag === "D" ? AmountCr_Amt : AmountDr_Amt`}</span>}
						footer={<span style={{ fontWeight: "bold" }}>{AmountCr_Amt}</span>}
					></Column> */}

					<Column
	field={disbursementStatus=== "D" ? "cr_amt" : "dr_amt"}
	header={disbursementStatus === "D" ? "Credit Amount" : "Withdrawal Amount"}
	footer={
		<span style={{ fontWeight: "bold" }}>
			{disbursementStatus === "D" ? AmountCr_Amt : AmountDr_Amt}
		</span>
	}
/>

					<Column
						field="approval_flag"
						header="Status"
						body={(rowData) => {
							if (rowData.approval_flag === "U") {
								return (
									<div className="pending_dis_2">
										<SyncOutlined style={{ color: "#fff", marginRight: 6 }} />
										Unapproved
									</div>
								);
							} else if (rowData.approval_flag === "A") {
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

					<Column
						// field="curr_prn"
						header="Action"
						body={(rowData) => (
							<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

								<button
									type="button"
									onClick={() => {
										// console.log("ROW DATA:", rowData);
										navigate(
											`/homebm/deposit-approve/${rowData?.shg_id}`,
											{ state: rowData }
										);
									}}
									style={{ background: "transparent", border: "none", cursor: "pointer" }}
								>
									{/* <EditOutlined className="text-md text-slate-800" /> */}
									{rowData.approval_flag === "U" ? (
										<CheckCircleOutlined className="text-md text-slate-800" />
									) : rowData.approval_flag === "A" ? (
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

export default DepositTableApprove_BDCCB
