import React, { useEffect, useState } from "react"
import { routePaths } from "../Assets/Data/Routes"
import { Link } from "react-router-dom"
import Tooltip from "@mui/material/Tooltip"
import { Paginator } from "primereact/paginator"
import { motion } from "framer-motion"
import {
	CheckCircleOutlined,
	ClockCircleOutlined,
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

function RefinaceDisburseTable_BDCCB({
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
	const [AmountTd_, setAmountTd_] = useState(0)

	const onPageChange = (event) => {
		setFirst(event.first)
		setRows(event.rows)
	}

	useEffect(()=>{
		// setAmountTd_(loanAppData.reduce((sum, r) => sum + parseFloat(r.disb_amt || 0), 0).toFixed(2));
		setAmountTd_(0)

		if (loanAppData && loanAppData.length > 0) {
		const total = loanAppData.reduce(
		(sum, row) => sum + Number(row.disb_amt || 0),
		0
		);
		setAmountTd_(total.toFixed(2));
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
										header="CCB Loan ID"
										footer={<span style={{ fontWeight: "bold" }}>Total</span>}
									></Column>
				
									
									<Column
										field="loan_acc_no"
										header="Loan Account No. "
										
									></Column>
									<Column
										field="loan_to_name"
										header="Society Name"
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
				
									{/* {disbursementStatus === "U" && ( */}

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
										`/homepacs/refinace/${rowData?.loan_id}`,
										{ state: rowData }
										);
										}}
										style={{ background: "transparent", border: "none", cursor: "pointer" }}
										>

										{disbursementStatus === "U" ? (
										<EditOutlined className="text-md text-slate-800" />
										) : disbursementStatus === "A" ? (
										<EyeOutlined className="text-md text-slate-800" />
										) : 
										<EyeOutlined className="text-md text-slate-800" />
										}
											
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

export default RefinaceDisburseTable_BDCCB
