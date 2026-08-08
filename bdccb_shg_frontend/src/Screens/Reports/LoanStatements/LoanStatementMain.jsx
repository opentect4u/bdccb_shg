import React, { useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin, Button, Modal, Tooltip, DatePicker } from "antd"
import { useNavigate } from "react-router"

import {
	LoadingOutlined,
	SearchOutlined,
	PrinterOutlined,
	FileExcelOutlined,
	CheckCircleOutlined,
	FileSearchOutlined,
	CalendarOutlined,
	FilterOutlined,
	EyeOutlined,
	FileTextOutlined,
} from "@ant-design/icons"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { printTableLoanStatement } from "../../../Utils/printTableLoanStatement"
import {
	loanStatementHeader,
	loanStatementHeaderGroupwise,
} from "../../../Utils/Reports/headerMap"
import { exportToExcel } from "../../../Utils/exportToExcel"
import DynamicTailwindTable from "../../../Components/Reports/DynamicTailwindTable"
import { printTableReport } from "../../../Utils/printTableReport"
import moment from "moment"
import { MultiSelect } from "primereact/multiselect"
import ExcelJS from "exceljs"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
// import { saveAs } from "file-saver"
// const { RangePicker } = DatePicker
// const dateFormat = "YYYY/MM/DD"

const options = [
	{
		label: "CCB",
		value: "C",
	},
	{
		label: "Society",
		value: "S",
	},
]

// Branchwise And Divisionwise options
const brnchwis_divwise = [
	{
		label: "Branchwise",
		value: "B",
	},
	{
		label: "Divisionwise",
		value: "D",
	},
]

function LoanStatementMain() {
	const [selectedColumns, setSelectedColumns] = useState(null);
	const [md_columns, setColumns] = useState([]);
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [openModal, setOpenModal] = useState(false)
	// const [approvalStatus, setApprovalStatus] = useState("S")
	const [searchType, setSearchType] = useState(() => "C")

	const [fromDate, setFromDate] = useState()
	const [toDate, setToDate] = useState()
	const [reportData, setReportData] = useState(() => [])
	const [reportTxnData, setReportTxnData] = useState(() => [])
	// const [tot_sum, setTotSum] = useState(0)
	const [search, setSearch] = useState("")

	const [metadataDtls, setMetadataDtls] = useState(() => null)
	const [groupLoanList, setGroupLoanList] = useState(() => [])
	const [selectedGroup, setSelectedGroup] = useState(() => null)
	const [transactionModalOpen, setTransactionModalOpen] = useState(false)
	const [loanTxnList, setLoanTxnList] = useState(() => [])
	const [selectedLoanId, setSelectedLoanId] = useState(null)
	const [branches, setBranches] = useState(() => [])
	const [societies, setSocieties] = useState(() => [])
	const [society, setSociety] = useState(() => "")
	const [branchesDiv, setBranchesDiv] = useState(() => [])
	const userBrnCode = userDetails?.brn_code || userDetails?.[0]?.brn_code;
	const userBrnName = userDetails?.branch_name || userDetails?.[0]?.branch_name || "";

	const [branch, setBranch] = useState(() =>
		userBrnCode && +userBrnCode !== 112
			? `${userBrnCode},${userBrnName}`
			: ""
	)

	// Branchwise And Divisionwise options
	const [searchBrnchDiv, setSearchBrnchDiv] = useState(() => "B")

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setSearchType(e)
		if (e === "S" || e === "P") {
			const selectedBrnCode = branch ? branch.split(",")[0] : "";
			handleFetchSocietyList(selectedBrnCode);
		} else {
			handleFetchBranchList();
		}
	}

	// Branchwise And Divisionwise options
	const onChange3BrnDiv = (e) => {
		setSearchBrnchDiv(e)
	}

	const navigate = useNavigate()

	const handleFetchBranchList = async () => {
		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {
			const res = await axios.post(`${url}/fetch_branch_society_list`, {
				branch_type: "B",
				tenant_id: userDetails?.tenant_id || 1,
			}, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1) {
				setBranches(res?.data?.msg || []);
			} else {
				setBranches([]);
			}
		} catch (err) {
			console.error("Fetch branch list error:", err);
			setBranches([]);
		}
	};

	const handleFetchSocietyList = async (branchCode) => {
		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {
			const payload = {
				branch_type: "P",
				tenant_id: userDetails?.tenant_id || 1,
			};
			if (branchCode) payload.branch_code = branchCode;
			const res = await axios.post(`${url}/fetch_branch_society_list`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1) {
				setSocieties(res?.data?.msg || []);
			} else {
				setSocieties([]);
			}
		} catch (err) {
			console.error("Fetch society list error:", err);
			setSocieties([]);
		}
	};

	useEffect(() => {
		if (searchType === "S" || searchType === "P") {
			handleFetchSocietyList();
		} else {
			handleFetchBranchList();
		}
	}, [searchType]);

	const handleFetchGroupLoanMaster = async (groupCode) => {
		setLoading(true);
		setGroupLoanList([]);
		const tokenValue = await getLocalStoreTokenDts(navigate);

		const isSociety = (searchType === "S" || searchType === "P");
		const payload = {
			group_code: groupCode,
			loan_to: isSociety ? "P" : "B",
			tenant_id: userDetails?.tenant_id || 1,
		};
		if (fromDate) payload.from_date = formatDateToYYYYMMDD(fromDate);
		if (toDate) payload.to_date = formatDateToYYYYMMDD(toDate);

		try {
			const res = await axios.post(`${url}/fetch_group_loan_master_dtls`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1) {
				const list = res.data.msg || [];
				setGroupLoanList(list);
				setLoanTxnList([]);
				setSelectedLoanId(null);
			} else {
				Message('error', res?.data?.msg || "No loan master details found for this group");
				setGroupLoanList([]);
				setLoanTxnList([]);
				setSelectedLoanId(null);
			}
		} catch (err) {
			console.error("Fetch group loan master error:", err);
			Message('error', "Error fetching loan master details");
			setGroupLoanList([]);
		}

		setLoading(false);
	};

	const handleFetchLoanTxnDetails = async (loanId) => {
		setLoading(true);
		setLoanTxnList([]);
		setSelectedLoanId(loanId);
		const tokenValue = await getLocalStoreTokenDts(navigate);

		const isSociety = (searchType === "S" || searchType === "P");
		const payload = {
			loan_id: loanId,
			loan_to: isSociety ? "P" : "B",
			tenant_id: userDetails?.tenant_id || 1,
		};
		if (fromDate) payload.from_date = formatDateToYYYYMMDD(fromDate);
		if (toDate) payload.to_date = formatDateToYYYYMMDD(toDate);

		try {
			const res = await axios.post(`${url}/fetch_loan_transaction_details`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1) {
				setLoanTxnList(res.data.msg || []);
				setTransactionModalOpen(true);
			} else {
				Message('error', res?.data?.msg || "No transaction records found");
				setLoanTxnList([]);
			}
		} catch (err) {
			console.error("Fetch loan transactions error:", err);
			Message('error', "Error fetching transaction details");
			setLoanTxnList([]);
		}

		setLoading(false);
	};

	const handleExcelExportGroupList = () => {
		if (!reportData || reportData.length === 0) return;

		const exportData = reportData.map((item, idx) => ({
			"Sl. No.": idx + 1,
			"Group Code": item?.group_code,
			"Group Name": item?.group_name,
			"Branch Name": item?.branch_name || "N/A",
			...(searchType === "S" ? { "Society Name": item?.society_name || item?.pacs_name || item?.branch_shg_name || "N/A" } : {}),
		}));

		const worksheet = XLSX.utils.json_to_sheet(exportData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Group List");

		const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
		const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
		saveAs(data, `Group_List_${moment().format("DDMMYYYY")}.xlsx`);
	};

	const handlePrintGroupList = () => {
		if (!reportData || reportData.length === 0) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const printHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Loan Statement Report - Group List</title>
				<style>
					@page { size: landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; background: #fff; }
					.header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
					.header h1 { margin: 0; font-size: 20px; color: #0f766e; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
					table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
					th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
					th { background-color: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 10px; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.text-center { text-align: center; }
					.font-mono { font-family: monospace; font-weight: 600; }
				</style>
			</head>
			<body>
				<div class="header">
					<h1>LOAN STATEMENT REPORT</h1>
				</div>

				<table>
					<thead>
						<tr>
							<th style="width: 50px;" class="text-center">Sl. No.</th>
							<th>Group Code</th>
							<th>Group Name</th>
							<th>Branch Name</th>
							${searchType === "S" ? `<th>Society Name</th>` : ""}
						</tr>
					</thead>
					<tbody>
						${reportData.map((item, idx) => `
							<tr>
								<td class="text-center">${idx + 1}</td>
								<td class="font-mono">${item?.group_code || ""}</td>
								<td><strong>${item?.group_name || ""}</strong></td>
								<td>${item?.branch_name || "N/A"}</td>
								${searchType === "S" ? `<td>${item?.society_name || item?.pacs_name || item?.branch_shg_name || "N/A"}</td>` : ""}
							</tr>
						`).join("")}
					</tbody>
				</table>
			</body>
			</html>
		`;

		printWindow.document.write(printHTML);
		printWindow.document.close();
		printWindow.focus();
		setTimeout(() => {
			printWindow.print();
		}, 500);
	};

	const handleExcelExportGroupLoanMaster = () => {
		if (!groupLoanList || groupLoanList.length === 0) return;

		const exportData = groupLoanList.map((loan, idx) => ({
			"Sl. No.": idx + 1,
			"Loan ID": loan.loan_id,
			"Loan A/C No": loan.loan_acc_no,
			"Period (M)": loan.period,
			"Curr ROI (%)": loan.curr_roi,
			"OVD ROI (%)": loan.ovd_roi,
			"Disbursement Date": loan.disb_date ? moment(loan.disb_date).format("DD/MM/YYYY") : "N/A",
			"Disbursement Amount": parseFloat(loan.disb_amt || 0),
			"Paymode": loan.paymode,
			"Start Date": loan.start_date ? moment(loan.start_date).format("DD/MM/YYYY") : "N/A",
			"End Date": loan.end_date ? moment(loan.end_date).format("DD/MM/YYYY") : "N/A",
			"Current Outstanding": parseFloat(loan.current_loan_outstanding || 0),
		}));

		const worksheet = XLSX.utils.json_to_sheet(exportData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Group Loan Master");

		const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
		const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
		saveAs(data, `Group_Loan_Master_${selectedGroup?.group_code}_${moment().format("DDMMYYYY")}.xlsx`);
	};

	const handlePrintGroupLoanMaster = () => {
		if (!groupLoanList || groupLoanList.length === 0) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const printHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Loan Statement Report - Group Loan Master Accounts</title>
				<style>
					@page { size: landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; background: #fff; }
					.header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
					.header h1 { margin: 0; font-size: 20px; color: #0f766e; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
					.meta-box { background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 14px; font-size: 12px; }
					table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
					th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
					th { background-color: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 10px; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.text-right { text-align: right; }
					.text-center { text-align: center; }
					.font-mono { font-family: monospace; font-weight: 600; }
				</style>
			</head>
			<body>
				<div class="header">
					<h1>LOAN STATEMENT REPORT</h1>
				</div>

				<div class="meta-box">
					<strong>Group:</strong> ${selectedGroup?.group_name} (${selectedGroup?.group_code}) | 
					<strong>Branch:</strong> ${selectedGroup?.branch_name || "N/A"}
				</div>

				<table>
					<thead>
						<tr>
							<th style="width: 40px;" class="text-center">Sl. No.</th>
							<th>Loan ID</th>
							<th>Loan A/C No</th>
							<th>Period (M)</th>
							<th>Curr ROI (%)</th>
							<th>OVD ROI (%)</th>
							<th>Disb Date</th>
							<th class="text-right">Disb Amount (₹)</th>
							<th>Paymode</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th class="text-right">Current Outstanding (₹)</th>
						</tr>
					</thead>
					<tbody>
						${groupLoanList.map((loan, idx) => `
							<tr>
								<td class="text-center">${idx + 1}</td>
								<td class="font-mono">${loan.loan_id}</td>
								<td class="font-mono">${loan.loan_acc_no}</td>
								<td>${loan.period}</td>
								<td>${loan.curr_roi}%</td>
								<td>${loan.ovd_roi}%</td>
								<td>${loan.disb_date ? moment(loan.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-right">${parseFloat(loan.disb_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
								<td>${loan.paymode}</td>
								<td>${loan.start_date ? moment(loan.start_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td>${loan.end_date ? moment(loan.end_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-right font-bold">${parseFloat(loan.current_loan_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</body>
			</html>
		`;

		printWindow.document.write(printHTML);
		printWindow.document.close();
		printWindow.focus();
		setTimeout(() => {
			printWindow.print();
		}, 500);
	};

	const handlePrintTxnDetails = () => {
		if (!loanTxnList || loanTxnList.length === 0) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const isSociety = (searchType === "S" || searchType === "P");
		const titleText = isSociety ? "SOCIETY LOAN TRANSACTION DETAILS" : "CCB LOAN TRANSACTION DETAILS";
		const formattedFromDt = fromDate ? moment(fromDate).format("DD/MM/YYYY") : "N/A";
		const formattedToDt = toDate ? moment(toDate).format("DD/MM/YYYY") : "N/A";

		const totalDebit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.debit_amt) || 0), 0);
		const totalCredit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.credit_amt) || 0), 0);
		const closingBal = loanTxnList.length > 0 ? loanTxnList[loanTxnList.length - 1].outstanding_amt : 0;

		const printHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${titleText} - ${selectedLoanId}</title>
				<style>
					@page { size: landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; background: #fff; }
					.header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
					.header h1 { margin: 0; font-size: 20px; color: #0f766e; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
					.meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 14px; font-size: 12px; }
					.meta-item { display: flex; flex-direction: column; }
					.meta-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
					.meta-val { font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px; }
					table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
					th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
					th { background-color: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.text-right { text-align: right; }
					.text-center { text-align: center; }
					.font-mono { font-family: monospace; font-weight: 600; }
					.debit { color: #dc2626; font-weight: 600; }
					.credit { color: #16a34a; font-weight: 600; }
					.outstanding { font-weight: 700; color: #0f172a; }
					.status-approved { color: #15803d; font-weight: 700; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; }
					.status-unapproved { color: #b45309; font-weight: 700; background: #fffbeb; padding: 2px 6px; border-radius: 4px; }
					.footer-summary { display: flex; justify-content: flex-end; margin-top: 14px; font-size: 12px; }
					.summary-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 8px; width: 320px; }
					.summary-row { display: flex; justify-content: space-between; padding: 3px 0; }
					.summary-row.total { border-top: 1px solid #94a3b8; font-weight: 800; font-size: 13px; color: #0f766e; margin-top: 4px; padding-top: 6px; }
				</style>
			</head>
			<body>
				<div class="header">
					<h1>${titleText}</h1>
				</div>

				<div class="meta-grid">
					<div class="meta-item">
						<span class="meta-label">Group Name & Code</span>
						<span class="meta-val">${selectedGroup?.group_name || "N/A"} (${selectedGroup?.group_code || "N/A"})</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Branch / Society Name</span>
						<span class="meta-val">${selectedGroup?.branch_name || "N/A"} ${selectedGroup?.society_name ? `/ ${selectedGroup?.society_name}` : ""}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Loan Account ID</span>
						<span class="meta-val font-mono">${selectedLoanId}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Statement Period</span>
						<span class="meta-val">${formattedFromDt} to ${formattedToDt}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Total Transactions</span>
						<span class="meta-val">${loanTxnList.length}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Printed Date & Time</span>
						<span class="meta-val">${moment().format("DD/MM/YYYY hh:mm A")}</span>
					</div>
				</div>

				<table>
					<thead>
						<tr>
							<th style="width: 40px;" class="text-center">Sl. No.</th>
							<th>Loan ID</th>
							<th>Trans ID</th>
							<th>Trans Date</th>
							<th>Trans Type</th>
							<th class="text-right">Debit Amt (₹)</th>
							<th class="text-right">Credit Amt (₹)</th>
							<th class="text-right">Outstanding (₹)</th>
							<th>Approved By</th>
							<th>Approved Date</th>
							<th class="text-center">Approval Status</th>
						</tr>
					</thead>
					<tbody>
						${loanTxnList.map((txn, idx) => `
							<tr>
								<td class="text-center">${idx + 1}</td>
								<td class="font-mono">${txn.loan_id}</td>
								<td class="font-mono">${txn.trans_id}</td>
								<td>${txn.trans_date ? moment(txn.trans_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td>${txn.tr_type === 'D' ? 'Disbursement' : (txn.tr_type === 'R' ? 'Recovery' : (txn.tr_type === 'I' ? 'Interest' : txn.tr_type))}</td>
								<td class="text-right debit">${parseFloat(txn.debit_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
								<td class="text-right credit">${parseFloat(txn.credit_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
								<td class="text-right outstanding">${parseFloat(txn.outstanding_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
								<td>${txn.approved_by || 'N/A'}</td>
								<td>${txn.approved_dt ? moment(txn.approved_dt).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-center">
									<span class="${txn.approval_status === 'A' ? 'status-approved' : 'status-unapproved'}">
										${txn.approval_status === 'A' ? 'Approved' : (txn.approval_status === 'U' ? 'Unapproved' : txn.approval_status)}
									</span>
								</td>
							</tr>
						`).join("")}
					</tbody>
				</table>

				<div class="footer-summary">
					<div class="summary-box">
						<div class="summary-row"><span>Total Debit Amount:</span> <strong>₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
						<div class="summary-row"><span>Total Credit Amount:</span> <strong>₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
						<div class="summary-row total"><span>Closing Outstanding:</span> <span>₹${parseFloat(closingBal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
					</div>
				</div>
			</body>
			</html>
		`;

		printWindow.document.write(printHTML);
		printWindow.document.close();
		printWindow.focus();

		printWindow.onafterprint = () => {
			try { printWindow.close(); } catch (e) {}
		};

		setTimeout(() => {
			printWindow.print();
			setTimeout(() => {
				try { if (printWindow && !printWindow.closed) printWindow.close(); } catch (e) {}
			}, 1000);
		}, 500);
	};

	const handlePrintFullReport = () => {
		if (!selectedGroup || (!groupLoanList.length && !loanTxnList.length)) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const isSociety = (searchType === "S" || searchType === "P");
		const titleText = isSociety ? "SOCIETY LOAN STATEMENT REPORT" : "CCB LOAN STATEMENT REPORT";
		const masterTitle = isSociety ? "Society Loan Details" : "CCB Loan Details";
		const txnTitle = isSociety ? "Society Loan Transaction Details" : "CCB Loan Transaction Details";
		const formattedFromDt = fromDate ? moment(fromDate).format("DD/MM/YYYY") : "N/A";
		const formattedToDt = toDate ? moment(toDate).format("DD/MM/YYYY") : "N/A";

		const totalDisb = groupLoanList.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0);
		const totalDebit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.debit_amt) || 0), 0);
		const totalCredit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.credit_amt) || 0), 0);
		const closingBal = loanTxnList.length > 0 ? loanTxnList[loanTxnList.length - 1].outstanding_amt : (groupLoanList.length > 0 ? groupLoanList[0].current_loan_outstanding : 0);

		const printHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${titleText} - ${selectedGroup?.group_name || ""}</title>
				<style>
					@page { size: landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; background: #fff; }
					.header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
					.header h1 { margin: 0; font-size: 20px; color: #0f766e; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
					.meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; font-size: 12px; }
					.meta-item { display: flex; flex-direction: column; }
					.meta-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
					.meta-val { font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px; }
					.section-title { font-size: 13px; font-weight: 800; color: #0f766e; margin-top: 14px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1.5px solid #0f766e; text-transform: uppercase; }
					table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 16px; font-size: 11px; }
					th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
					th { background-color: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.text-right { text-align: right; }
					.text-center { text-align: center; }
					.font-mono { font-family: monospace; font-weight: 600; }
					.debit { color: #dc2626; font-weight: 600; }
					.credit { color: #16a34a; font-weight: 600; }
					.outstanding { font-weight: 700; color: #0f172a; }
					.status-approved { color: #15803d; font-weight: 700; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; }
					.status-unapproved { color: #b45309; font-weight: 700; background: #fffbeb; padding: 2px 6px; border-radius: 4px; }
					.footer-summary { display: flex; justify-content: flex-end; margin-top: 16px; font-size: 12px; }
					.summary-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px 18px; border-radius: 8px; width: 340px; }
					.summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
					.summary-row.total { border-top: 1.5px solid #0f766e; font-weight: 800; font-size: 13px; color: #0f766e; margin-top: 6px; padding-top: 6px; }
				</style>
			</head>
			<body>
				<div class="header">
					<h1>${titleText}</h1>
				</div>

				<div class="meta-grid">
					<div class="meta-item">
						<span class="meta-label">Group Name & Code</span>
						<span class="meta-val">${selectedGroup?.group_name || "N/A"} (${selectedGroup?.group_code || "N/A"})</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Branch / Society Name</span>
						<span class="meta-val">${selectedGroup?.branch_name || "N/A"} ${selectedGroup?.society_name ? `/ ${selectedGroup?.society_name}` : ""}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Selected Loan Account ID</span>
						<span class="meta-val font-mono">${selectedLoanId || "N/A"}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Statement Period</span>
						<span class="meta-val">${formattedFromDt} to ${formattedToDt}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Total Loan Master Accounts</span>
						<span class="meta-val">${groupLoanList.length}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Printed Date & Time</span>
						<span class="meta-val">${moment().format("DD/MM/YYYY hh:mm A")}</span>
					</div>
				</div>

				${groupLoanList.length > 0 ? `
					<div class="section-title">${masterTitle}</div>
					<table>
						<thead>
							<tr>
								<th>Loan ID</th>
								<th>Loan A/C No</th>
								<th>Period (M)</th>
								<th>Curr ROI (%)</th>
								<th>OVD ROI (%)</th>
								<th>Disb Date</th>
								<th class="text-right">Disb Amt (₹)</th>
								<th>Paymode</th>
								<th>Start Date</th>
								<th>End Date</th>
								<th class="text-right">Current Outstanding (₹)</th>
							</tr>
						</thead>
						<tbody>
							${groupLoanList.map(loan => `
								<tr>
									<td class="font-mono">${loan.loan_id}</td>
									<td class="font-mono">${loan.loan_acc_no}</td>
									<td>${loan.period}</td>
									<td>${loan.curr_roi}%</td>
									<td>${loan.ovd_roi}%</td>
									<td>${loan.disb_date ? moment(loan.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
									<td class="text-right">${parseFloat(loan.disb_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
									<td>${loan.paymode}</td>
									<td>${loan.start_date ? moment(loan.start_date).format("DD/MM/YYYY") : "N/A"}</td>
									<td>${loan.end_date ? moment(loan.end_date).format("DD/MM/YYYY") : "N/A"}</td>
									<td class="text-right outstanding">${parseFloat(loan.current_loan_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
								</tr>
							`).join("")}
						</tbody>
					</table>
				` : ''}

				${loanTxnList.length > 0 ? `
					<div class="section-title">${txnTitle} (Loan ID: ${selectedLoanId})</div>
					<table>
						<thead>
							<tr>
								<th style="width: 40px;" class="text-center">Sl. No.</th>
								<th>Loan ID</th>
								<th>Trans ID</th>
								<th>Trans Date</th>
								<th>Trans Type</th>
								<th class="text-right">Debit Amt (₹)</th>
								<th class="text-right">Credit Amt (₹)</th>
								<th class="text-right">Outstanding (₹)</th>
								<th>Approved By</th>
								<th>Approved Date</th>
								<th class="text-center">Approval Status</th>
							</tr>
						</thead>
						<tbody>
							${loanTxnList.map((txn, idx) => `
								<tr>
									<td class="text-center">${idx + 1}</td>
									<td class="font-mono">${txn.loan_id}</td>
									<td class="font-mono">${txn.trans_id}</td>
									<td>${txn.trans_date ? moment(txn.trans_date).format("DD/MM/YYYY") : "N/A"}</td>
									<td>${txn.tr_type === 'D' ? 'Disbursement' : (txn.tr_type === 'R' ? 'Recovery' : (txn.tr_type === 'I' ? 'Interest' : txn.tr_type))}</td>
									<td class="text-right debit">${parseFloat(txn.debit_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
									<td class="text-right credit">${parseFloat(txn.credit_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
									<td class="text-right outstanding">${parseFloat(txn.outstanding_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
									<td>${txn.approved_by || 'N/A'}</td>
									<td>${txn.approved_dt ? moment(txn.approved_dt).format("DD/MM/YYYY") : "N/A"}</td>
									<td class="text-center">
										<span class="${txn.approval_status === 'A' ? 'status-approved' : 'status-unapproved'}">
											${txn.approval_status === 'A' ? 'Approved' : (txn.approval_status === 'U' ? 'Unapproved' : txn.approval_status)}
										</span>
									</td>
								</tr>
							`).join("")}
						</tbody>
					</table>
				` : ''}

				<div class="footer-summary">
					<div class="summary-box">
						<div class="summary-row"><span>Total Disbursement:</span> <strong>₹${totalDisb.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
						<div class="summary-row"><span>Total Debit Amount:</span> <strong>₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
						<div class="summary-row"><span>Total Credit Amount:</span> <strong>₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
						<div class="summary-row total"><span>Closing Outstanding:</span> <span>₹${parseFloat(closingBal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
					</div>
				</div>
			</body>
			</html>
		`;

		printWindow.document.write(printHTML);
		printWindow.document.close();
		printWindow.focus();

		printWindow.onafterprint = () => {
			try { printWindow.close(); } catch (e) {}
		};

		setTimeout(() => {
			printWindow.print();
			setTimeout(() => {
				try { if (printWindow && !printWindow.closed) printWindow.close(); } catch (e) {}
			}, 1000);
		}, 500);
	};

	const handleExcelExportFullReport = async () => {
		if (!selectedGroup || (!groupLoanList.length && !loanTxnList.length)) return;

		const isSociety = (searchType === "S" || searchType === "P");
		const titleText = isSociety ? "SOCIETY LOAN STATEMENT REPORT" : "CCB LOAN STATEMENT REPORT";
		const masterTitle = isSociety ? "SOCIETY LOAN DETAILS" : "CCB LOAN DETAILS";
		const txnTitle = isSociety ? "SOCIETY LOAN TRANSACTION DETAILS" : "CCB LOAN TRANSACTION DETAILS";
		const formattedFromDt = fromDate ? moment(fromDate).format("DD/MM/YYYY") : "N/A";
		const formattedToDt = toDate ? moment(toDate).format("DD/MM/YYYY") : "N/A";

		const totalDisb = groupLoanList.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0);
		const totalDebit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.debit_amt) || 0), 0);
		const totalCredit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.credit_amt) || 0), 0);
		const closingBal = loanTxnList.length > 0 ? (parseFloat(loanTxnList[loanTxnList.length - 1].outstanding_amt) || 0) : (groupLoanList.length > 0 ? (parseFloat(groupLoanList[0].current_loan_outstanding) || 0) : 0);

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Full Statement");

		worksheet.columns = [
			{ width: 10 },
			{ width: 18 },
			{ width: 22 },
			{ width: 16 },
			{ width: 18 },
			{ width: 18 },
			{ width: 18 },
			{ width: 20 },
			{ width: 20 },
			{ width: 16 },
			{ width: 18 },
		];

		const titleRow = worksheet.addRow([titleText]);
		worksheet.mergeCells("A1:K1");
		titleRow.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
		titleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
		titleRow.alignment = { horizontal: "center", vertical: "middle" };
		titleRow.height = 38;

		worksheet.addRow([]);

		const metaRows = [
			["Group Name & Code:", `${selectedGroup?.group_name || "N/A"} (${selectedGroup?.group_code || "N/A"})`, "", "Branch / Society Name:", `${selectedGroup?.branch_name || "N/A"} ${selectedGroup?.society_name ? `/ ${selectedGroup?.society_name}` : ""}`],
			["Selected Loan ID:", String(selectedLoanId || "N/A"), "", "Statement Period:", `${formattedFromDt} to ${formattedToDt}`],
			["Total Loan Master Accounts:", groupLoanList.length, "", "Generated On:", moment().format("DD/MM/YYYY hh:mm A")],
		];

		metaRows.forEach(r => {
			const row = worksheet.addRow([r[0], r[1], "", r[3], r[4]]);
			row.font = { name: "Segoe UI", size: 10 };
			row.getCell(1).font = { bold: true, color: { argb: "FF475569" } };
			row.getCell(2).font = { bold: true, color: { argb: "FF0F172A" } };
			row.getCell(4).font = { bold: true, color: { argb: "FF475569" } };
			row.getCell(5).font = { bold: true, color: { argb: "FF0F172A" } };
			row.height = 20;
		});

		worksheet.addRow([]);

		if (groupLoanList.length > 0) {
			const sec1Row = worksheet.addRow([masterTitle]);
			worksheet.mergeCells(`A${sec1Row.number}:K${sec1Row.number}`);
			sec1Row.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF0F766E" } };
			sec1Row.height = 24;

			const masterHeaders = ["Loan ID", "Loan A/C No", "Period (M)", "Curr ROI (%)", "OVD ROI (%)", "Disbursement Date", "Disbursement Amount (₹)", "Paymode", "Start Date", "End Date", "Current Outstanding (₹)"];
			const masterHeaderRow = worksheet.addRow(masterHeaders);
			masterHeaderRow.height = 24;
			masterHeaderRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
			masterHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };

			masterHeaderRow.eachCell((cell, colNumber) => {
				cell.alignment = { vertical: "middle", horizontal: [7, 11].includes(colNumber) ? "right" : "left" };
				cell.border = {
					top: { style: "thin", color: { argb: "FFCBD5E1" } },
					left: { style: "thin", color: { argb: "FFCBD5E1" } },
					bottom: { style: "medium", color: { argb: "FF0F766E" } },
					right: { style: "thin", color: { argb: "FFCBD5E1" } },
				};
			});

			groupLoanList.forEach((loan, idx) => {
				const rVals = [
					loan.loan_id || "",
					loan.loan_acc_no || "",
					loan.period || 0,
					`${loan.curr_roi}%`,
					`${loan.ovd_roi}%`,
					loan.disb_date ? moment(loan.disb_date).format("DD/MM/YYYY") : "N/A",
					parseFloat(loan.disb_amt || 0),
					loan.paymode || "N/A",
					loan.start_date ? moment(loan.start_date).format("DD/MM/YYYY") : "N/A",
					loan.end_date ? moment(loan.end_date).format("DD/MM/YYYY") : "N/A",
					parseFloat(loan.current_loan_outstanding || 0)
				];

				const dRow = worksheet.addRow(rVals);
				dRow.height = 22;
				dRow.font = { name: "Segoe UI", size: 10 };
				if (idx % 2 === 1) dRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

				dRow.getCell(7).numberFormat = "#,##0.00";
				dRow.getCell(11).numberFormat = "#,##0.00";
				dRow.getCell(11).font = { bold: true, color: { argb: "FF0F172A" } };

				dRow.eachCell((cell, colNumber) => {
					cell.alignment = { vertical: "middle", horizontal: [7, 11].includes(colNumber) ? "right" : "left" };
					cell.border = {
						top: { style: "thin", color: { argb: "FFE2E8F0" } },
						left: { style: "thin", color: { argb: "FFE2E8F0" } },
						bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
						right: { style: "thin", color: { argb: "FFE2E8F0" } },
					};
				});
			});

			worksheet.addRow([]);
		}

		if (loanTxnList.length > 0) {
			const sec2Row = worksheet.addRow([`${txnTitle} (LOAN ID: ${selectedLoanId})`]);
			worksheet.mergeCells(`A${sec2Row.number}:K${sec2Row.number}`);
			sec2Row.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF0F766E" } };
			sec2Row.height = 24;

			const headers = ["Sl. No.", "Loan ID", "Transaction ID", "Transaction Date", "Transaction Type", "Debit Amount (₹)", "Credit Amount (₹)", "Outstanding (₹)", "Approved By", "Approved Date", "Approval Status"];
			const headerRow = worksheet.addRow(headers);
			headerRow.height = 24;
			headerRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
			headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };

			headerRow.eachCell((cell, colNumber) => {
				cell.alignment = { vertical: "middle", horizontal: [6, 7, 8].includes(colNumber) ? "right" : [1, 11].includes(colNumber) ? "center" : "left" };
				cell.border = {
					top: { style: "thin", color: { argb: "FFCBD5E1" } },
					left: { style: "thin", color: { argb: "FFCBD5E1" } },
					bottom: { style: "medium", color: { argb: "FF0F766E" } },
					right: { style: "thin", color: { argb: "FFCBD5E1" } },
				};
			});

			loanTxnList.forEach((txn, idx) => {
				const trTypeStr = txn.tr_type === 'D' ? 'Disbursement' : (txn.tr_type === 'R' ? 'Recovery' : (txn.tr_type === 'I' ? 'Interest' : txn.tr_type));
				const appStatusStr = txn.approval_status === 'A' ? 'Approved' : (txn.approval_status === 'U' ? 'Unapproved' : txn.approval_status);

				const rowValues = [
					idx + 1,
					txn.loan_id || "",
					txn.trans_id || "",
					txn.trans_date ? moment(txn.trans_date).format("DD/MM/YYYY") : "N/A",
					trTypeStr,
					parseFloat(txn.debit_amt || 0),
					parseFloat(txn.credit_amt || 0),
					parseFloat(txn.outstanding_amt || 0),
					txn.approved_by || "N/A",
					txn.approved_dt ? moment(txn.approved_dt).format("DD/MM/YYYY") : "N/A",
					appStatusStr
				];

				const dataRow = worksheet.addRow(rowValues);
				dataRow.height = 22;
				dataRow.font = { name: "Segoe UI", size: 10 };
				if (idx % 2 === 1) dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

				dataRow.getCell(6).numberFormat = "#,##0.00";
				dataRow.getCell(7).numberFormat = "#,##0.00";
				dataRow.getCell(8).numberFormat = "#,##0.00";

				dataRow.getCell(6).font = { color: { argb: "FFDC2626" }, bold: true };
				dataRow.getCell(7).font = { color: { argb: "FF16A34A" }, bold: true };
				dataRow.getCell(8).font = { color: { argb: "FF0F172A" }, bold: true };

				dataRow.eachCell((cell, colNumber) => {
					cell.alignment = { vertical: "middle", horizontal: [6, 7, 8].includes(colNumber) ? "right" : [1, 11].includes(colNumber) ? "center" : "left" };
					cell.border = {
						top: { style: "thin", color: { argb: "FFE2E8F0" } },
						left: { style: "thin", color: { argb: "FFE2E8F0" } },
						bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
						right: { style: "thin", color: { argb: "FFE2E8F0" } },
					};
				});
			});

			worksheet.addRow([]);
		}

		const summaryRows = [
			["", "", "", "", "Total Disbursement Amount:", totalDisb],
			["", "", "", "", "Total Debit Amount:", totalDebit],
			["", "", "", "", "Total Credit Amount:", totalCredit],
			["", "", "", "", "Closing Outstanding:", closingBal],
		];

		summaryRows.forEach((sr, sIdx) => {
			const sRow = worksheet.addRow(["", "", "", "", sr[4], sr[5]]);
			sRow.height = 24;
			const labelCell = sRow.getCell(5);
			const valCell = sRow.getCell(6);

			labelCell.font = { name: "Segoe UI", size: 10, bold: true, color: sIdx === 3 ? { argb: "FF0F766E" } : { argb: "FF334155" } };
			valCell.font = { name: "Segoe UI", size: 11, bold: true, color: sIdx === 3 ? { argb: "FF0F766E" } : { argb: "FF0F172A" } };
			valCell.numberFormat = "#,##0.00";
			labelCell.alignment = { horizontal: "right", vertical: "middle" };
			valCell.alignment = { horizontal: "right", vertical: "middle" };

			if (sIdx === 3) {
				labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
				valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
			}
		});

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		const fileTypeStr = isSociety ? "Society" : "CCB";
		saveAs(blob, `${fileTypeStr}_Full_Loan_Statement_${selectedGroup?.group_code || ""}_${moment().format("DDMMYYYY")}.xlsx`);
	};

	const handleExcelExportTxnDetails = async () => {
		if (!loanTxnList || loanTxnList.length === 0) return;

		const isSociety = (searchType === "S" || searchType === "P");
		const titleText = isSociety ? "SOCIETY LOAN TRANSACTION DETAILS" : "CCB LOAN TRANSACTION DETAILS";
		const formattedFromDt = fromDate ? moment(fromDate).format("DD/MM/YYYY") : "N/A";
		const formattedToDt = toDate ? moment(toDate).format("DD/MM/YYYY") : "N/A";

		const totalDebit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.debit_amt) || 0), 0);
		const totalCredit = loanTxnList.reduce((acc, curr) => acc + (parseFloat(curr.credit_amt) || 0), 0);
		const closingBal = loanTxnList.length > 0 ? (parseFloat(loanTxnList[loanTxnList.length - 1].outstanding_amt) || 0) : 0;

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Loan Statement");

		worksheet.columns = [
			{ width: 10 },
			{ width: 18 },
			{ width: 22 },
			{ width: 16 },
			{ width: 18 },
			{ width: 18 },
			{ width: 18 },
			{ width: 20 },
			{ width: 20 },
			{ width: 16 },
			{ width: 18 },
		];

		const titleRow = worksheet.addRow([titleText]);
		worksheet.mergeCells("A1:K1");
		titleRow.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
		titleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
		titleRow.alignment = { horizontal: "center", vertical: "middle" };
		titleRow.height = 36;

		worksheet.addRow([]);

		const metaRows = [
			["Group Name & Code:", `${selectedGroup?.group_name || "N/A"} (${selectedGroup?.group_code || "N/A"})`, "", "Branch / Society Name:", `${selectedGroup?.branch_name || "N/A"} ${selectedGroup?.society_name ? `/ ${selectedGroup?.society_name}` : ""}`],
			["Loan Account ID:", String(selectedLoanId || "N/A"), "", "Statement Period:", `${formattedFromDt} to ${formattedToDt}`],
			["Total Transactions:", loanTxnList.length, "", "Generated On:", moment().format("DD/MM/YYYY hh:mm A")],
		];

		metaRows.forEach(r => {
			const row = worksheet.addRow([r[0], r[1], "", r[3], r[4]]);
			row.font = { name: "Segoe UI", size: 10 };
			row.getCell(1).font = { bold: true, color: { argb: "FF475569" } };
			row.getCell(2).font = { bold: true, color: { argb: "FF0F172A" } };
			row.getCell(4).font = { bold: true, color: { argb: "FF475569" } };
			row.getCell(5).font = { bold: true, color: { argb: "FF0F172A" } };
			row.height = 20;
		});

		worksheet.addRow([]);

		const headers = ["Sl. No.", "Loan ID", "Transaction ID", "Transaction Date", "Transaction Type", "Debit Amount (₹)", "Credit Amount (₹)", "Outstanding (₹)", "Approved By", "Approved Date", "Approval Status"];
		const headerRow = worksheet.addRow(headers);
		headerRow.height = 26;
		headerRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
		headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };

		headerRow.eachCell((cell, colNumber) => {
			cell.alignment = {
				vertical: "middle",
				horizontal: [6, 7, 8].includes(colNumber) ? "right" : [1, 11].includes(colNumber) ? "center" : "left"
			};
			cell.border = {
				top: { style: "thin", color: { argb: "FFCBD5E1" } },
				left: { style: "thin", color: { argb: "FFCBD5E1" } },
				bottom: { style: "medium", color: { argb: "FF0F766E" } },
				right: { style: "thin", color: { argb: "FFCBD5E1" } },
			};
		});

		loanTxnList.forEach((txn, idx) => {
			const trTypeStr = txn.tr_type === 'D' ? 'Disbursement' : (txn.tr_type === 'R' ? 'Recovery' : (txn.tr_type === 'I' ? 'Interest' : txn.tr_type));
			const appStatusStr = txn.approval_status === 'A' ? 'Approved' : (txn.approval_status === 'U' ? 'Unapproved' : txn.approval_status);

			const rowValues = [
				idx + 1,
				txn.loan_id || "",
				txn.trans_id || "",
				txn.trans_date ? moment(txn.trans_date).format("DD/MM/YYYY") : "N/A",
				trTypeStr,
				parseFloat(txn.debit_amt || 0),
				parseFloat(txn.credit_amt || 0),
				parseFloat(txn.outstanding_amt || 0),
				txn.approved_by || "N/A",
				txn.approved_dt ? moment(txn.approved_dt).format("DD/MM/YYYY") : "N/A",
				appStatusStr
			];

			const dataRow = worksheet.addRow(rowValues);
			dataRow.height = 22;
			dataRow.font = { name: "Segoe UI", size: 10 };

			if (idx % 2 === 1) {
				dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
			}

			dataRow.getCell(6).numberFormat = "#,##0.00";
			dataRow.getCell(7).numberFormat = "#,##0.00";
			dataRow.getCell(8).numberFormat = "#,##0.00";

			dataRow.getCell(6).font = { color: { argb: "FFDC2626" }, bold: true };
			dataRow.getCell(7).font = { color: { argb: "FF16A34A" }, bold: true };
			dataRow.getCell(8).font = { color: { argb: "FF0F172A" }, bold: true };

			dataRow.eachCell((cell, colNumber) => {
				cell.alignment = {
					vertical: "middle",
					horizontal: [6, 7, 8].includes(colNumber) ? "right" : [1, 11].includes(colNumber) ? "center" : "left"
				};
				cell.border = {
					top: { style: "thin", color: { argb: "FFE2E8F0" } },
					left: { style: "thin", color: { argb: "FFE2E8F0" } },
					bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
					right: { style: "thin", color: { argb: "FFE2E8F0" } },
				};
			});
		});

		worksheet.addRow([]);

		const summaryRows = [
			["", "", "", "", "Total Debit Amount:", totalDebit],
			["", "", "", "", "Total Credit Amount:", totalCredit],
			["", "", "", "", "Closing Outstanding:", closingBal],
		];

		summaryRows.forEach((sr, sIdx) => {
			const sRow = worksheet.addRow(["", "", "", "", sr[4], sr[5]]);
			sRow.height = 24;
			const labelCell = sRow.getCell(5);
			const valCell = sRow.getCell(6);

			labelCell.font = { name: "Segoe UI", size: 10, bold: true, color: sIdx === 2 ? { argb: "FF0F766E" } : { argb: "FF334155" } };
			valCell.font = { name: "Segoe UI", size: 11, bold: true, color: sIdx === 2 ? { argb: "FF0F766E" } : { argb: "FF0F172A" } };
			valCell.numberFormat = "#,##0.00";
			labelCell.alignment = { horizontal: "right", vertical: "middle" };
			valCell.alignment = { horizontal: "right", vertical: "middle" };

			if (sIdx === 2) {
				labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
				valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
			}
		});

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		const fileTypeStr = isSociety ? "Society" : "CCB";
		saveAs(blob, `${fileTypeStr}_Loan_Transaction_Statement_${selectedLoanId}_${moment().format("DDMMYYYY")}.xlsx`);
	};


	const handleFetchReportMemberwise = async () => {
		setLoading(true)

		var creds;

		if (searchBrnchDiv === "B") {
			creds = {
				memb: search,
				branch_code:
					+userDetails?.brn_code === 112
						? branch.split(",")[0]
						: userDetails?.brn_code,
			}
		}

		if (searchBrnchDiv === "D") {
			creds = {
				memb: search,
				branch_code: [branchesDiv],
			}
		}


		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_statement_memb_dtls`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				if (res?.data?.suc === 0) {
					// Message('error', res?.data?.msg)
					navigate(routePaths.LANDING)
					localStorage.clear()
				} else {
					setReportData(res?.data?.msg)
				}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

		setLoading(false)
	}

	const handleFetchReportGroupwise = async () => {
		setLoading(true)
		setReportData([])
		setGroupLoanList([])
		setLoanTxnList([])
		setSelectedGroup(null)
		setSelectedLoanId(null)
		let creds;

		const isSociety = (searchType === "S" || searchType === "P");
		const loanToVal = isSociety ? "P" : "B";
		const selectedBrn = isSociety
			? (society?.split(",")[0] || branch?.split(",")[0] || (+userDetails?.brn_code === 112 ? "" : userDetails?.brn_code))
			: (branch?.split(",")[0] || (+userDetails?.brn_code === 112 ? "" : userDetails?.brn_code));
		const branchType = userDetails?.branch_type || "H";

		creds = {
			grp: search,
			loan_to: loanToVal,
			branch_code: selectedBrn,
			tenant_id: userDetails?.tenant_id || 1,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url}/loan_statement_group_dtls`, creds, {
			headers: {
				Authorization: `${tokenValue?.token}`,
				"Content-Type": "application/json",
			},
		})
			.then((res) => {
				if (res?.data?.suc === 0) {
					Message('error', res?.data?.msg || "No records found")
					setReportData([])
				} else {
					setReportData(res?.data?.msg || [])
				}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
				Message('error', "Something went wrong while searching group")
				setReportData([])
			})

		setLoading(false)
	}

	const handleFetchLoanViewMemberwise = async (loanId) => {
		setLoading(true)
		const creds = {
			from_dt: formatDateToYYYYMMDD(fromDate),
			to_dt: formatDateToYYYYMMDD(toDate),
			loan_id: loanId || "",
			branch_id:
				+userDetails?.brn_code === 112
					? branch.split(",")[0]
					: userDetails?.brn_code,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_statement_report`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				if (res?.data?.suc === 0) {
					// Message('error', res?.data?.msg)
					navigate(routePaths.LANDING)
					localStorage.clear()
				} else {
					setReportTxnData(res?.data?.msg)
					populateColumns(res?.data?.msg, loanStatementHeader);

				}

				// setTotSum(res?.data?.msg.reduce((n, { credit }) => n + credit, 0))
			})
			.catch((err) => {
				console.log("ERRRR>>>>>>>", err)
			})

		setLoading(false)
	}

	const handleFetchLoanViewGroupwise = async (grpCode) => {
		setLoading(true)
		const creds = {
			from_dt: formatDateToYYYYMMDD(fromDate),
			to_dt: formatDateToYYYYMMDD(toDate),
			group_code: grpCode || "",
			branch_code:
				+userDetails?.brn_code === 112
					? branch.split(",")[0]
					: userDetails?.brn_code,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_statement_group_report`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`, // example header
					"Content-Type": "application/json", // optional
				},
			})
			.then((res) => {

				if (res?.data?.suc === 0) {
					// Message('error', res?.data?.msg)
					navigate(routePaths.LANDING)
					localStorage.clear()
				} else {
					setReportTxnData(res?.data?.msg)
					// setTotSum(res?.data?.msg.reduce((n, { credit }) => n + credit, 0))
					populateColumns(res?.data?.msg, loanStatementHeaderGroupwise);
				}

			})
			.catch((err) => {
				console.log("ERRRR>>>>>>>", err)
			})

		setLoading(false)
	}

	// useEffect(() => {
	// if (searchType === "M" && search.length > 2) {
	// 	handleFetchReportMemberwise()
	// } else if (searchType === "G" && search.length > 2) {
	// 	handleFetchReportGroupwise()
	// }
	// }, [searchType, search])



	const searchData = () => {
		if (searchType === "M" && search.length > 2) {
			handleFetchReportMemberwise()
		} else if ((searchType === "C" || searchType === "S" || searchType === "G") && search.length > 2) {
			handleFetchReportGroupwise()
		}
	}


	const populateColumns = (main_dt, headerExport) => {
		const columnToBeShown = Object.keys(main_dt[0]).map((key, index) => ({ header: headerExport[key], index }));
		setColumns(columnToBeShown);
		setSelectedColumns(columnToBeShown.map(el => el.index));
	}

	useEffect(() => {
		setReportData(() => [])
		setReportTxnData(() => [])
		setMetadataDtls(() => null)
		setGroupLoanList(() => [])
		setLoanTxnList(() => [])
		setSelectedGroup(() => null)
		setSelectedLoanId(null)
		setBranch("")
		setSociety("")
		setSearch("")
	}, [searchType])

	const fetchSearchTypeName = (searchType) => {
		if (searchType === "C") {
			return "CCB"
		} else if (searchType === "S") {
			return "Society"
		} else if (searchType === "M") {
			return "Memberwise"
		} else if (searchType === "G") {
			return "Groupwise"
		} else if (searchType === "F") {
			return "Fundwise"
		} else if (searchType === "B") {
			return "Branchwise"
		} else if (searchType === "D") {
			return "Disbursement"
		} else if (searchType === "R") {
			return "Recovery"
		}
	}

	const dataToExport = reportTxnData

	const headersToExport =
		(searchType === "C" || searchType === "M") ? loanStatementHeader : loanStatementHeaderGroupwise

	const fileName = `Loan_Statement_${fetchSearchTypeName(
		searchType
	)}_${new Date().toLocaleString("en-GB")}.xlsx`


	const branchOptions = React.useMemo(() => {
		const sorted = [...branches].sort((a, b) => {
			const codeA = parseInt(a.code || a.branch_code || a.branch_id || a.branch_assign_id || 0, 10);
			const codeB = parseInt(b.code || b.branch_code || b.branch_id || b.branch_assign_id || 0, 10);
			if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
				return codeA - codeB;
			}
			return String(a.name || a.branch_name || "").localeCompare(String(b.name || b.branch_name || ""));
		});

		return sorted.map(item => {
			const bCode = item.code || item.branch_code || item.branch_id;
			const bName = item.name || item.branch_name;
			return {
				code: bCode,
				name: bCode ? `${bCode} - ${bName}` : bName,
			};
		});
	}, [branches]);

	const societyOptions = React.useMemo(() => {
		const sorted = [...societies].sort((a, b) => {
			const codeA = parseInt(a.code || a.branch_code || a.branch_id || a.branch_assign_id || 0, 10);
			const codeB = parseInt(b.code || b.branch_code || b.branch_id || b.branch_assign_id || 0, 10);
			if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
				return codeA - codeB;
			}
			return String(a.name || a.branch_name || "").localeCompare(String(b.name || b.branch_name || ""));
		});

		return sorted.map(item => {
			const bCode = item.code || item.branch_code || item.branch_id;
			const bName = item.name || item.branch_name;
			return {
				code: bCode,
				name: bCode ? `${bCode} - ${bName}` : bName,
			};
		});
	}, [societies]);

	const handleBranchChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e;
		if (!value) {
			setBranch("");
			setSociety("");
			return;
		}
		const selected = branches.find(b => (b.code || b.branch_code || b.branch_id) == value);
		if (selected) {
			setBranch(`${selected.code || selected.branch_code || selected.branch_id},${selected.name || selected.branch_name || ""}`);
		} else {
			setBranch(value || "");
		}
		setSociety("");
	};

	const handleSocietyChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e;
		if (!value) {
			setSociety("");
			return;
		}
		const selected = societies.find(s => (s.code || s.branch_code || s.branch_id) == value);
		if (selected) {
			setSociety(`${selected.code || selected.branch_code || selected.branch_id},${selected.name || selected.branch_name || ""}`);
		} else {
			setSociety(value || "");
		}
	};

	return (
		<div>
			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="w-[95%] max-w-[1400px] mx-auto my-6 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white shadow-md shadow-teal-500/20">
								<FileSearchOutlined className="text-2xl" />
							</div>
							<div>
								<h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
									Loan Statement Report
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									Generate and view comprehensive memberwise and groupwise loan account statements
								</p>
							</div>
						</div>
					</div>

					{/* Filters Card */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6 space-y-4">
						<div className="flex flex-wrap items-center gap-6">
							<div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
								<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Search By:</span>
								<Radiobtn
									data={options}
									val={searchType}
									className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center"
									onChangeVal={(value) => {
										onChange(value)
									}}
								/>
							</div>

							{/* Render Select Society dropdown when Society ('S' or 'P') is selected, else Select Branch dropdown */}
							{(searchType === "S" || searchType === "P") ? (
								<div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 min-w-[240px]">
									<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap text-center">
										Select Society:
									</span>
									<div className="flex-1">
										<TDInputTemplateBr
											placeholder="Select Society..."
											type="text"
											label=""
											name="society"
											formControlName={(society && society !== "undefined" && society.split(",")[0] !== "undefined") ? society.split(",")[0] : ""}
											handleChange={handleSocietyChange}
											mode={2}
											data={societyOptions}
										/>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 min-w-[240px]">
									<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap text-center">
										Select Branch:
									</span>
									<div className="flex-1">
										<TDInputTemplateBr
											placeholder="Select Branch..."
											type="text"
											label=""
											name="branch"
											formControlName={(branch && branch !== "undefined" && branch.split(",")[0] !== "undefined") ? branch.split(",")[0] : ""}
											handleChange={handleBranchChange}
											mode={2}
											data={branchOptions}
										/>
									</div>
								</div>
							)}
						</div>

						<div className="flex flex-col sm:flex-row items-end gap-3 mt-4">
							<div className="flex-1 w-full">
								<TDInputTemplateBr
									placeholder="Search via Group Code or Group Name"
									type="text"
									label="Group Code / Group Name"
									name="search_val"
									handleChange={(txt) => setSearch(txt.target.value)}
									formControlName={search}
									mode={1}
								/>
							</div>
							<div className="pb-[1px]">
								{(() => {
									const isSocietyMode = (searchType === "S" || searchType === "P");
									const isBranchOrSocietySelected = isSocietyMode ? Boolean(society && society.trim()) : Boolean(branch && branch.trim());
									return (
										<button
											disabled={!isBranchOrSocietySelected}
											className={`h-[38px] inline-flex items-center justify-center px-4 text-xs font-semibold text-white rounded transition-all duration-200 shadow-sm gap-1.5 ${
												isBranchOrSocietySelected
													? "bg-teal-500 hover:bg-green-600 border border-teal-500 hover:border-green-600 cursor-pointer active:scale-95"
													: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
											}`}
											onClick={() => {
												searchData()
											}}
										>
											<SearchOutlined className="text-xs" />
											<span>Search</span>
										</button>
									);
								})()}
							</div>
						</div>
					</div>

					{reportData.length > 0 && (
						<div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mt-5">
							<div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase text-slate-500 tracking-wider">
								<CalendarOutlined className="text-teal-600" />
								<span>Select Date Range for Statement</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<TDInputTemplateBr
										placeholder="From Date"
										type="date"
										label="From Date"
										name="fromDate"
										formControlName={fromDate}
										handleChange={(e) => setFromDate(e.target.value)}
										min={"1900-12-31"}
										mode={1}
									/>
								</div>
								<div>
									<TDInputTemplateBr
										placeholder="To Date"
										type="date"
										label="To Date"
										name="toDate"
										formControlName={toDate}
										handleChange={(e) => setToDate(e.target.value)}
										min={"1900-12-31"}
										mode={1}
									/>
								</div>
							</div>
						</div>
					)}

					{/* For memberwise search */}
					{reportData.length > 0 && searchType === "M" && (
						<div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>Member Search Results</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										{reportData.length} Member(s) Found
									</p>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={handleExcelExportGroupList}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
									>
										<FileExcelOutlined className="text-sm" />
										<span>Export Excel</span>
									</button>
									<button
										onClick={handlePrintGroupList}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
									>
										<PrinterOutlined className="text-sm" />
										<span>Print Report</span>
									</button>
								</div>
							</div>
							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-96">
								<table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
									<thead className="text-xs uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Member Code</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Member Name</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Division Name</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Loan ID</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider text-center">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{reportData?.map((item, i) => (
											<tr
												key={i}
												className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150"
											>
												<td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{item?.member_code}</td>
												<td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{item?.client_name}</td>
												<td className="px-6 py-3.5">{item?.area_code}</td>
												<td className="px-6 py-3.5 font-mono text-teal-600 font-medium">{item?.loan_id}</td>
												<td className="px-6 py-3.5 text-center">
													<Tooltip title={(!fromDate || !toDate) ? "Please select both From Date and To Date" : ""}>
														<span>
															<button
																onClick={async () => {
																	await handleFetchLoanViewMemberwise(item?.loan_id)
																	setMetadataDtls(item)
																	setOpenModal(true)
																}}
																className="px-4 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-teal-50 cursor-pointer"
																disabled={!fromDate || !toDate}
															>
																View Statement
															</button>
														</span>
													</Tooltip>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* For Groupwise / CCB / Society search */}
					{reportData.length > 0 && (searchType === "S" || searchType === "C" || searchType === "G") && (
						<div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>Group Search Results</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										{reportData.length} Group(s) Found
									</p>
								</div>
							</div>
							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-96">
								<table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
									<thead className="text-xs uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Group Code</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Group Name</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Branch Name</th>
											{searchType === "S" && (
												<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Society Name</th>
											)}
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider text-center">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{reportData?.map((item, i) => (
											<tr
												key={i}
												className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150"
											>
												<td className="px-6 py-3.5 font-mono text-teal-600 font-medium">{item?.group_code}</td>
												<td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{item?.group_name}</td>
												<td className="px-6 py-3.5">{item?.branch_name}</td>
												{searchType === "S" && (
													<td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-100">
														{item?.society_name || item?.pacs_name || item?.branch_shg_name || item?.pacs_id || "N/A"}
													</td>
												)}
												<td className="px-6 py-3.5 text-center">
													<Tooltip title={(!fromDate || !toDate) ? "Please select both From Date and To Date" : ""}>
														<span>
															<button
																onClick={async () => {
																	await handleFetchGroupLoanMaster(item?.group_code);
																	setSelectedGroup(item);
																}}
																disabled={!fromDate || !toDate}
																className="px-4 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-teal-50 cursor-pointer"
															>
																View Statement
															</button>
														</span>
													</Tooltip>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Group Loan Master Table */}
					{groupLoanList.length > 0 && (
						<div className="mt-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>{(searchType === "S" || searchType === "P") ? "Society Loan Details" : "CCB Loan Details"}</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										Group: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedGroup?.group_name} ({selectedGroup?.group_code})</span>
									</p>
								</div>
							</div>

							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-96">
								<table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
									<thead className="uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th className="px-4 py-3 font-bold tracking-wider">Loan ID</th>
											<th className="px-4 py-3 font-bold tracking-wider">Loan A/C No</th>
											<th className="px-4 py-3 font-bold tracking-wider">Period (M)</th>
											<th className="px-4 py-3 font-bold tracking-wider">Curr ROI (%)</th>
											<th className="px-4 py-3 font-bold tracking-wider">OVD ROI (%)</th>
											<th className="px-4 py-3 font-bold tracking-wider">Disbursement Date</th>
											<th className="px-4 py-3 font-bold tracking-wider">Disbursement Amount</th>
											<th className="px-4 py-3 font-bold tracking-wider">Paymode</th>
											<th className="px-4 py-3 font-bold tracking-wider">Start Date</th>
											<th className="px-4 py-3 font-bold tracking-wider">End Date</th>
											<th className="px-4 py-3 font-bold tracking-wider">Current Outstanding</th>
											<th className="px-4 py-3 font-bold tracking-wider text-center">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{groupLoanList.map((loan, idx) => (
											<tr key={idx} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-4 py-3 font-mono text-teal-600 font-bold">{loan.loan_id}</td>
												<td className="px-4 py-3 font-mono font-medium">{loan.loan_acc_no}</td>
												<td className="px-4 py-3">{loan.period}</td>
												<td className="px-4 py-3 font-semibold text-emerald-600">{loan.curr_roi}%</td>
												<td className="px-4 py-3 font-semibold text-rose-500">{loan.ovd_roi}%</td>
												<td className="px-4 py-3">{loan.disb_date ? moment(loan.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{loan.disb_amt}</td>
												<td className="px-4 py-3">{loan.paymode}</td>
												<td className="px-4 py-3">{loan.start_date ? moment(loan.start_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3">{loan.end_date ? moment(loan.end_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{loan.current_loan_outstanding}</td>
												<td className="px-4 py-3 text-center">
													<Tooltip title={(!fromDate || !toDate) ? "Please select both From Date and To Date" : ""}>
														<span>
															<button
																onClick={() => handleFetchLoanTxnDetails(loan.loan_id)}
																disabled={!fromDate || !toDate}
																className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
															>
																View Transaction
															</button>
														</span>
													</Tooltip>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Transaction Details Table rendered directly below */}
					{loanTxnList.length > 0 && (
						<div className="mt-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<FileTextOutlined className="text-teal-600 text-lg" />
										<span>{(searchType === "S" || searchType === "P") ? "Society Loan Transaction Details" : "CCB Loan Transaction Details"}</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										Loan ID: <span className="font-semibold text-teal-600 font-mono">{selectedLoanId}</span>
									</p>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={handleExcelExportTxnDetails}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
									>
										<FileExcelOutlined className="text-sm" />
										<span>Export Excel</span>
									</button>
									<button
										onClick={handlePrintTxnDetails}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
									>
										<PrinterOutlined className="text-sm" />
										<span>Print Statement</span>
									</button>
								</div>
							</div>

							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-96">
								<table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
									<thead className="uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th className="px-4 py-3.5 font-bold">Sl. No.</th>
											<th className="px-4 py-3.5 font-bold">Loan Id</th>
											<th className="px-4 py-3.5 font-bold">Transaction ID</th>
											<th className="px-4 py-3.5 font-bold">Transaction Date</th>
											<th className="px-4 py-3.5 font-bold">Transaction Type</th>
											<th className="px-4 py-3.5 font-bold text-right">Debit Amount</th>
											<th className="px-4 py-3.5 font-bold text-right">Credit Amount</th>
											<th className="px-4 py-3.5 font-bold text-right">Outstanding Amount</th>
											<th className="px-4 py-3.5 font-bold">Approved By</th>
											<th className="px-4 py-3.5 font-bold">Approved Date</th>
											<th className="px-4 py-3.5 font-bold text-center">Approval Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{loanTxnList.map((txn, idx) => (
											<tr key={idx} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-4 py-3 font-semibold text-slate-500">{idx + 1}</td>
												<td className="px-4 py-3 font-mono text-teal-600 font-bold">{txn.loan_id}</td>
												<td className="px-4 py-3 font-mono font-medium">{txn.trans_id}</td>
												<td className="px-4 py-3">{txn.trans_date ? moment(txn.trans_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 font-semibold">
													{txn.tr_type === 'D' ? 'Disbursement' : (txn.tr_type === 'R' ? 'Recovery' : (txn.tr_type === 'I' ? 'Interest' : txn.tr_type))}
												</td>
												<td className="px-4 py-3 text-right font-bold text-rose-600">{txn.debit_amt}</td>
												<td className="px-4 py-3 text-right font-bold text-emerald-600">{txn.credit_amt}</td>
												<td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white">{txn.outstanding_amt}</td>
												<td className="px-4 py-3 font-medium">{txn.approved_by}</td>
												<td className="px-4 py-3">{txn.approved_dt ? moment(txn.approved_dt).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-center">
													<span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
														txn.approval_status === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (txn.approval_status === 'U' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200')
													}`}>
														{txn.approval_status === 'A' ? 'Approved' : (txn.approval_status === 'U' ? 'Unapproved' : txn.approval_status)}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Bottom Footer Bar for Full Statement Exports */}
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
								<div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
									Complete Statement Report (Loan Details & Transactions)
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={handleExcelExportFullReport}
										className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
									>
										<FileExcelOutlined className="text-sm" />
										<span>Export Full Excel</span>
									</button>
									<button
										onClick={handlePrintFullReport}
										className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
									>
										<PrinterOutlined className="text-sm" />
										<span>Print Full Report</span>
									</button>
								</div>
							</div>
						</div>
					)}

					{/* ///////////////////////////////////////////////////////////////// */}

					<Modal
						title="Loan Statement"
						centered
						open={openModal}
						onOk={() => {
							setOpenModal(false)
						}}
						onCancel={async () => {
							// await exportToExcel(reportTxnData)
							setOpenModal(false)
						}}
						width={1500}
						// okButtonProps={{
						// 	icon: <PrinterOutlined />,
						// }}
						okText={"OK"}
						cancelText={"Cancel"}
					// cancelButtonProps={{
					// 	icon: <FileExcelOutlined />,
					// }}
					// onClose={() => {
					// 	setOpenModal(false)
					// }}
					>
						<div id="loanupperText" className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 my-3">
							{searchType === "M" && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-200">
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Member</span>
										<span className="font-semibold">{metadataDtls?.client_name} ({metadataDtls?.member_code})</span>
									</div>
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Branch</span>
										<span className="font-semibold">{metadataDtls?.branch_name} ({metadataDtls?.branch_code})</span>
									</div>
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Group</span>
										<span className="font-semibold">{metadataDtls?.group_name} ({metadataDtls?.group_code})</span>
									</div>
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Statement Period</span>
										<span className="font-semibold text-teal-600 dark:text-teal-400">
											{new Date(fromDate)?.toLocaleDateString("en-GB")} to {new Date(toDate)?.toLocaleDateString("en-GB")}
										</span>
									</div>
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Loan ID</span>
										<span className="font-mono font-bold text-slate-800 dark:text-slate-100">{metadataDtls?.loan_id}</span>
									</div>
								</div>
							)}
							{searchType === "G" && (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-200">
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Group</span>
										<span className="font-semibold">{metadataDtls?.group_name} ({metadataDtls?.group_code})</span>
									</div>
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Branch</span>
										<span className="font-semibold">{metadataDtls?.branch_name} ({metadataDtls?.branch_code})</span>
									</div>
									<div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
										<span className="text-xs font-bold text-slate-400 uppercase block">Statement Period</span>
										<span className="font-semibold text-teal-600 dark:text-teal-400">
											{new Date(fromDate)?.toLocaleDateString("en-GB")} to {new Date(toDate)?.toLocaleDateString("en-GB")}
										</span>
									</div>
								</div>
							)}
						</div>
						{
							reportTxnData.length > 0 && <MultiSelect value={selectedColumns}
								onChange={(e) => {
									setSelectedColumns(e.value)
								}} options={md_columns} optionValue="index" optionLabel="header"
								filter placeholder="Choose Columns" maxSelectedLabels={3} className="w-full md:w-20rem mt-5" />
						}
						{/* For memberwise */}

						{searchType === "M" && reportTxnData.length > 0 && (
							<DynamicTailwindTable
								data={reportTxnData?.map(el => {
									el.tr_type = el.tr_type == 'D' ? 'Disbursement' : (el.tr_type == 'R' ? 'Recovery' : '');
									el.trans_date = moment(el.trans_date).format("DD/MM/YYYY");
									return el;
								})}
								dateTimeExceptionCols={[0]}
								// colRemove={[5]}
								columnTotal={[7, 8]}
								// colRemove={[0,1,2,3,4,6,10,11,13,14,15,16]}
								headersMap={loanStatementHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									if (!selectedColumns.includes(el.index)) {
										return el.index
									}
									return false
								}) : []}
								indexing
							/>
						)}

						{/* For Groupwise */}

						{searchType === "G" && reportTxnData.length > 0 && (
							<DynamicTailwindTable
								data={reportTxnData?.map(el => {
									el.tr_type = el.tr_type == 'D' ? 'Disbursement' : (el.tr_type == 'R' ? 'Recovery' : '');
									el.trans_date = moment(el.trans_date).format("DD/MM/YYYY");
									return el;
								})}
								dateTimeExceptionCols={[0]}
								columnTotal={[7, 8]}
								// colRemove={[0,1,2,3,4,6,10,11,13,14,15,16]}
								headersMap={loanStatementHeaderGroupwise}
								colRemove={selectedColumns ? md_columns.map(el => {
									if (!selectedColumns.includes(el.index)) {
										return el.index
									}
									return false
								}) : []}
								indexing
							/>
						)}
						{reportTxnData.length !== 0 && (
							<div className="flex gap-3 justify-end items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
								<Tooltip title="Export to Excel">
									<button
										onClick={async () => {
											const exportData = [...reportTxnData]
											const tot_debit_amt = exportData.reduce((sum, cur) => sum + Number(cur.debit), 0);
											const tot_credit_amt = exportData.reduce((sum, cur) => sum + Number(cur.credit), 0);
											if (searchType === "M") {
												exportData.push({
													trans_no: "Total",
													debit: tot_debit_amt,
													credit: tot_credit_amt,
												})
											}
											else {
												exportData.push({
													trans_no: "Total",
													debit: tot_debit_amt,
													credit: tot_credit_amt,
												})

											}
											const dt = md_columns.filter(el => selectedColumns.includes(el.index));
											let header_export = {};
											Object.keys(headersToExport).forEach(key => {
												if (dt.filter(ele => ele.header == headersToExport[key]).length > 0) {
													header_export = {
														...header_export,
														[key]: headersToExport[key]
													}
												}
											});

											const el = document.getElementById('loanupperText');
											const htmlText = el?.innerText || '';

											const workbook = new ExcelJS.Workbook();
											const worksheet = workbook.addWorksheet("Report");

											worksheet.getCell('A1').value = htmlText;
											worksheet.getCell('A1').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
											worksheet.getCell('A1').font = { bold: true };

											worksheet.mergeCells('A1:E1');

											worksheet.getRow(1).height = 100;
											worksheet.insertRow(2)

											const keys = Object.keys(header_export)
											worksheet.getRow(2).values = keys.map(key => header_export[key]);
											worksheet.getRow(2).eachCell((cell) => {
												cell.font = { bold: true };
												cell.fill = {
													type: "pattern",
													pattern: "darkGrid",
													fgColor: { argb: "FFFFFF00" },
												};
											});
											keys.forEach((key, index) => {
												worksheet.getColumn(index + 1).width = Math.max(header_export[key].length + 5, 15);
											});
											const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/


											let dataRowIndex = 3;
											exportData.forEach((rawRow) => {
												const row = { ...rawRow };
												keys.forEach((key, idx) => {
													const val = rawRow[key];
													if (typeof val === "string" && isoRegex.test(val)) {
														if ([0].includes(idx)) {
															row[key] = new Date(val).toLocaleDateString("en-GB");
														} else {
															row[key] = new Date(val).toLocaleString("en-GB");
														}
													}
												});

												worksheet.insertRow(dataRowIndex++, keys.map(k => row[k]));
											});

											worksheet.getRow(2).eachCell((cell) => {
												cell.font = { bold: true }
												cell.fill = {
													type: "pattern",
													pattern: "darkGrid",
													fgColor: { argb: "FFFFFF00" },
												}
											})

											// Export
											const buffer = await workbook.xlsx.writeBuffer();
											saveAs(new Blob([buffer]), "export.xlsx");
										}}
										className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
									>
										<FileExcelOutlined className="text-lg" />
										<span>Export Excel</span>
									</button>
								</Tooltip>
								<Tooltip title="Print Statement">
									<button
										onClick={() => {
											const exportData = [...reportTxnData]
											const tot_debit_amt = exportData.reduce((sum, cur) => sum + Number(cur.debit), 0);
											const tot_credit_amt = exportData.reduce((sum, cur) => sum + Number(cur.credit), 0);
											if (searchType === "M") {
												exportData.push({
													trans_no: "Total",
													debit: tot_debit_amt,
													credit: tot_credit_amt,
												})
											}
											else {
												exportData.push({
													trans_no: "Total",
													debit: tot_debit_amt,
													credit: tot_credit_amt,
												})

											}
											const dt = md_columns.filter(el => selectedColumns.includes(el.index));
											let header_export = {};
											Object.keys(headersToExport).forEach(key => {
												if (dt.filter(ele => ele.header == headersToExport[key]).length > 0) {
													header_export = {
														...header_export,
														[key]: headersToExport[key]
													}
												}
											});
											printTableReport(
												exportData,
												header_export,
												fileName?.split(",")[0],
												[0],
												true
											)

										}}
										className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
									>
										<PrinterOutlined className="text-lg" />
										<span>Print Report</span>
									</button>
								</Tooltip>
							</div>
						)}

						{reportTxnData.length === 0 && "No data found."}
					</Modal>
				</main>
			</Spin>
		</div>
	)
}

export default LoanStatementMain
