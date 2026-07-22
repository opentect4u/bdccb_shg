import React, { useEffect, useState } from "react"
import "../../LoanForm/LoanForm.css"
import { useParams } from "react-router"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { Message } from "../../../Components/Message"
import { url } from "../../../Address/BaseUrl"
import { Spin } from "antd"
import { LoadingOutlined, SaveOutlined } from "@ant-design/icons"
import DialogBox from "../../../Components/DialogBox"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"
import DynamicTailwindTable from "../../../Components/Reports/DynamicTailwindTable"
import { useSocket } from "../../../Context/SocketContext"
import { routePaths } from "../../../Assets/Data/Routes"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import Radiobtn from "../../../Components/Radiobtn"
import DynamicTailwindTable_OpenClose from "../../../Components/Reports/DynamicTailwindTable_OpenClose"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
// import useCheckOpenCloseDate from "../../../Components/useCheckOpenCloseDate"

const options1 = [
	{
		label: "Close Branch",
		value: "C",
	},
	{
		label: "Open Branch",
		value: "O",
	}
	
]

function MonthOpenForm() {
	const params = useParams()
	const location = useLocation()
	const navigate = useNavigate()
	const { socket, connectSocket } = useSocket()
	const userMasterDetails = location.state || {}
	const userDetails = JSON.parse(localStorage.getItem("user_details"))
	const [loading, setLoading] = useState(false)
	const [data, setData] = useState([])
	const [searchQuery, setSearchQuery] = useState("")
	const [visible, setVisible] = useState(false)
	const [visible_Revert, setVisible_Revert] = useState(false)
	const [topAlertMessage, setTopAlertMessage] = useState("")
	const [selectedRowIndices, setSelectedRowIndices] = useState([])
	const [searchType2, setSearchType2] = useState(() => "")
	const [dayOpenFld, setdayOpenFld] = useState()
	const [revertOpenDate, setRevertOpenDate] = useState("")
	const [revertBrnCode, setRevertBrnCode] = useState("")

	// Add effect to ensure socket connection
	useEffect(() => {
		if (!socket && userDetails?.emp_id) {
			console.log("Initializing socket connection...")
			connectSocket(userDetails.emp_id)
		}
	}, [socket, userDetails, connectSocket])

	// Debug socket status changes
	useEffect(() => {
		console.log("Socket connection status:", socket ? "Connected" : "Disconnected")
	}, [socket])


	const handleCheckUnapproveTransaction = async (array) => {

		// if (selectedData.length === 0) return

		

		// const payload__ = {
		// 				month_end_dtls: array.map((item) => ({
		// 					branch_code: item.branch_code,
		// 					closed_date: formatDateToYYYYMMDD(item.closed_date),
		// 				})),
		// 			}

		

		// console.log(array, 'arrayarrayarrayarray', payload__);
		

		// const result = array
		// .map(item => item.branch_code)   // extract only branch_code
		// .sort((a, b) => b - a);          // sort descending

		// console.log(result);
		

		
		// return

		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		// const payload = {
		// 		'branch_code': result 
		// 	}

		const payload = {
		'branch_dtls': array
		// .sort((a, b) => b.branch_code - a.branch_code)
		.map(item => ({
		'branch_code': item.branch_code,
		'closed_date': formatDateToYYYYMMDD(item.closed_date),
		})),
		};

		try {
			

			 

			// return;

			const res = await axios.post(
				`${url}/admin/check_unapprove_transaction`, payload, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})

		

		if(res?.data?.suc === 0){

		navigate(routePaths.LANDING)
		localStorage.clear()
		// Message('error', res?.data?.msg)

		} else {
		
		// console.log(res?.data, 'xxxxxxxxxxxxxxxxxxxxx', payload__);
		
		const result = array.map(item => {

		const match = res?.data?.branches?.find(
		c => Number(c.branch_code) === item.branch_code
		);

		return {
		...item,
		unapprove_flag: match ? match.unapprove_flag : "N"
		};

		});

		setData(result || [])
		// console.log(result.length, 'Unapproved Transactions Response',  'kkkk', 'match', payload);

		}
			
		} catch (err) {
			// console.error(err)
			// Message("error", "Some error occurred while checking unapproved loans")
		}
		setLoading(false)
	}

	const handleFetchMonthOpen = async () => {
		setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {


			const payload = {
				openClose_upto: searchType2,
			}
			
			const res = await axios.post(
				`${url}/admin/fetch_brnwise_end_details_fr_ho`, payload, {
		headers: {
		Authorization: `${tokenValue?.token}`, // example header
		"Content-Type": "application/json", // optional
		},
		})

		console.log(payload, 'payloadpayloadpayload', res?.data?.day_end_data_ho?.msg);

		if(res?.data?.suc === 0){

		navigate(routePaths.LANDING)
		localStorage.clear()
		Message('error', res?.data?.msg)

		} else {
			
			// setData(res?.data?.day_end_data_ho?.msg || [])
			handleCheckUnapproveTransaction(res?.data?.day_end_data_ho?.msg)
		}
		} catch (err) {
			console.error(err, 'errerrerrerr');
			Message("error", "Some error occurred while fetching Month End Details == test")
		}
		// setLoading(false)
	}

	const handleFetchBranches = async () => {
			setLoading(true)
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.get(`${url}/admin/fetch_brnwise_end_details_fr_ho`, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
				.then((res) => {

				if(res?.data?.suc === 0){

				navigate(routePaths.LANDING)
				localStorage.clear()
				// Message('error', res?.data?.msg)

				} else {
				// console.log(res, 'gggggggggggggg');
				
				setData(res?.data?.day_end_data_ho?.msg || [])
				}
	
				})
				.catch((err) => {
				console.error(err)
				Message("error", "Some error occurred while fetching Month End Details")
				})
	
			setLoading(false)
		}

	useEffect(() => {
		// console.log(data, 'datadatadatadatadatadata');
		
		setSelectedRowIndices([])
		console.log(searchType2.length, 'searchType2');

		if(searchType2.length === 0){
			setLoading(false)
		} else {
			handleFetchMonthOpen()
		}
		
	}, [searchType2])

	const filteredData_ = data.filter((item) =>{
			item['checkOnce'] = true
			return item.branch_name.toLowerCase().includes(searchQuery.toLowerCase())
		}
	)

		const filteredData = filteredData_
		.map((item) => ({
		...item,
		disabled: item.closed_date !== item.opened_date, // ⛔ disable selection
		}))
		.filter((item) =>
		item.branch_name.toLowerCase().includes(searchQuery.toLowerCase())
		);

	

	useEffect(() => {
		setSelectedRowIndices((prevIndices) => {
			
			
			const pruned = prevIndices.filter(
				(idx) => idx >= 0 && idx < filteredData.length
			)
			if (pruned.length !== prevIndices.length) {
				return pruned
			}
			return prevIndices
		})

		console.log(filteredData, 'filteredDatafilteredDatafilteredData' );
		
	}, [filteredData])

	const onTableSelectionChange = (newSelectedIndices) => {
		
		setSelectedRowIndices(newSelectedIndices)
	}

	const selectedData = selectedRowIndices.map((idx) => filteredData[idx])

	

	// useEffect(() => {
	// 	console.log(selectedData, 'Unapproved Transactions Response');
	// 	handleCheckUnapproveTransaction(selectedData)
	// }, [selectedRowIndices])

	// const { checkOpenDtCloseDt, openDtCloseDt } = useCheckOpenCloseDate(userDetails)

	const handleUpdateForm = async () => {
		console.log('submittttttttttt', 'testxxx');
		// return
		setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);

		try {

// 			{
//   "branch_code" : ["114,115,116"],
//   "opened_date" : "",
//   "user_name" : ""
// }

			const payload = {
				user_name: userDetails?.emp_id,
				opened_date: formatDateToYYYYMMDD(dayOpenFld),
				// closed_by: userDetails?.emp_id,
				branch_code: selectedData.map(item => String(item.branch_code)) 
			}

			// console.log(payload, 'payloadpayloadpayload', JSON.parse(localStorage.getItem("user_details"))?.emp_id);
			

			// return

			const res = await axios.post(
				`${url}/admin/ho_open_new_date`, payload, {
				headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
				},
				})
			
			// console.log(res?.data, 'RESSSSS======>>>>');

			if(res?.data?.suc === 0){

			navigate(routePaths.LANDING)
			localStorage.clear()
			Message('error', res?.data?.msg)

			} else {

			// if (!socket) {
			// console.warn("Socket not connected, attempting to reconnect...")
			// const newSocket = connectSocket(userDetails?.emp_id)
			// if (newSocket) {					
			// newSocket.emit('month_end_process', {
			// data: res?.data?.req_data
			// })
			// } else {
			// console.error("Failed to establish socket connection")
			// }
			// } else {
			// console.log(res?.data, 'RESSSSS======>>>>');
			// socket.emit('month_end_process', {
			// data: res?.data?.req_data
			// })
			// }

			Message("success", "Day Open updated successfully")
			handleFetchMonthOpen()

			// checkOpenDtCloseDt()

			setSelectedRowIndices([])
			setTopAlertMessage("")


		}


			// if(res?.data?.suc > 0){

			// 	if (!socket) {
			// 		console.warn("Socket not connected, attempting to reconnect...")
			// 		const newSocket = connectSocket(userDetails?.emp_id)
			// 		if (newSocket) {					
			// 			newSocket.emit('month_end_process', {
			// 				data: res?.data?.req_data
			// 			})
			// 		} else {
			// 			console.error("Failed to establish socket connection")
			// 		}
			// 	} else {
			// 		console.log(res?.data, 'RESSSSS======>>>>');
			// 		socket.emit('month_end_process', {
			// 			data: res?.data?.req_data
			// 		})
			// 	}
			// 	Message("success", "Month end details updated successfully")
			// 	handleFetchMonthOpen()
	
			// 	setSelectedRowIndices([])
			// 	setTopAlertMessage("")
			// }else{
			// 	Message("error", "Some error occurred while updating Month End Details")
			// }

			// Message("success", "Month end details updated successfully")
			// handleFetchMonthOpen()

			// setSelectedRowIndices([])
			// setTopAlertMessage("")

		} catch (err) {
			console.error(err)
			Message("error", "Some error occurred while updating Month End Details")
		}
		setLoading(false)
	}

	const handleRevertForm = async () => {
		// alert('Revert Back clicked')
		setLoading(true)
		const tokenValue = await getLocalStoreTokenDts(navigate);

		try {



			const payload = {
				user_name: userDetails?.emp_id,
				opened_date: revertOpenDate,
				// closed_by: userDetails?.emp_id,
				branch_code: [String(revertBrnCode)]
			}

			console.log(payload, 'payloadpayloadpayload', JSON.parse(localStorage.getItem("user_details"))?.emp_id);
			

			// return

			const res = await axios.post(
				`${url}/admin/ho_revert_date`, payload, {
				headers: {
				Authorization: `${tokenValue?.token}`, // example header
				"Content-Type": "application/json", // optional
				},
				})
			
			// console.log(res?.data, 'RESSSSS======>>>>');

			if(res?.data?.suc === 0){

		navigate(routePaths.LANDING)
		localStorage.clear()
		Message('error', res?.data?.msg)

		} else {


			Message("success", "Revert Back successfully")
			handleFetchMonthOpen()
			setRevertOpenDate('')
			setRevertBrnCode('')
			setSelectedRowIndices([])
			setTopAlertMessage("")

		}

		} catch (err) {
			console.error(err)
			Message("error", "Some error occurred while updating Month End Details")
		}
		setLoading(false)
	}

	const onSubmit = (e) => {
		e.preventDefault()
		setVisible(true)
	}


	const onChange2 = (e) => {
		console.log("radio1 checked", e)
		setSearchType2(e)
	}

const handleRevertBack = (openDate, brnCode) => {
    console.log("Revert Back clicked for:", openDate)
	setVisible_Revert(true)
	setSelectedRowIndices([])
	setRevertOpenDate(openDate)
	setRevertBrnCode(brnCode)
    // 👉 Navigate to another screen
    // navigate(`/revert/${branchCode}`)

    // OR 👉 Call an API
    // axios.post("/api/revert", { branchCode })

    // OR 👉 Update a state
    // setSelectedBranch(branchCode)
}

const today = new Date().toISOString().split("T")[0];
	

	return (
		<>
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-blue-800 dark:text-gray-400"
				spinning={loading}
			>
				<form onSubmit={onSubmit}>
					<div>
						{topAlertMessage && (
							<div className="text-red-500 dark:text-red-400 text-lg py-2">
								● {topAlertMessage}
							</div>
						)}

						<div className="pb-4 bg-white dark:bg-gray-900">
							<label htmlFor="table-search" className="sr-only">
								Search
							</label>
							<div className="relative mt-1">
								<div className="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
									<svg
										className="w-4 h-4 text-gray-500 dark:text-gray-400"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 20 20"
									>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
										/>
									</svg>
								</div>
								<input
									type="text"
									id="table-search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="block pl-10 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
									placeholder="Search for branch"
								/>
							</div>
						</div>

						<div className="mb-2 flex justify-start gap-5 items-center">
												<div>
													<Radiobtn
														data={options1}
														val={searchType2}
														onChangeVal={(value) => {
															onChange2(value)
														}}
													/>
												</div>
												{/* <div>
													<Radiobtn
														data={options}
														val={searchType}
														onChangeVal={(value) => {
															onChange(value)
														}}
													/>
												</div> */}
											</div>

 {/* {JSON.stringify(filteredData.reverse(), null, 2)} */}
						<DynamicTailwindTable_OpenClose
							data={filteredData}
							showCheckbox={true}
							selectedRowIndices={selectedRowIndices}
							onRowSelectionChange={onTableSelectionChange}
							bordered={false}
							colRemove={[4, 5, 6, 7, 8, 9, 10]}
							headersMap={{
								branch_code: "Branch Code",
								branch_name: "Branch Name",
								closed_date: "Closed Upto",
								opened_date: "Open Upto",
							}}
							isFooterAvailable={false}
							dateTimeExceptionCols={[2]}
							onRevertBack={handleRevertBack}

						/>

						{/* <div className="flex justify-center"> */}
						{searchType2 === "C" && (
							<div className="grid grid-cols-4 gap-5 mt-5 items-end">
						<div>
						{/* <TDInputTemplateBr
						placeholder="Day Open"
						type="date"
						label="Day Open"
						name="dayopen"
						formControlName={dayOpenFld}
						handleChange={(e) => setdayOpenFld(e.target.value)}
						min={"1900-12-31"}
						mode={1}
						/> */}

						<TDInputTemplateBr
						placeholder="Day Open"
						type="date"
						label="Day Open"
						name="dayopen"
						formControlName={dayOpenFld}
						handleChange={(e) => setdayOpenFld(e.target.value)}
						min={today}
						mode={1}
						/>

						</div>
						<div>
							<button
								type="submit"
								className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white border border-teal-500 bg-teal-500 hover:bg-green-600 hover:border-green-600 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-950 rounded-full transition duration-300"
								disabled={selectedRowIndices.length === 0 || !dayOpenFld}
							>
								<SaveOutlined className="mr-2" />
								Submit
							</button>
						</div>
						</div>
						)}
						
					</div>
				</form>
			</Spin>

			<DialogBox
				flag={4}
				visible={visible}
				onPress={() => setVisible(false)}
				onPressYes={async () => {
					setVisible(false)
					// await handleFetchUnapprovedLoanBranches()
					await handleUpdateForm()
				}}
				onPressNo={() => setVisible(false)}
			/>

			<DialogBox
				flag={4}
				visible={visible_Revert}
				onPress={() => setVisible_Revert(false)}
				onPressYes={async () => {
					setVisible_Revert(false)
					// await handleFetchUnapprovedLoanBranches()
					await handleRevertForm()
				}}
				onPressNo={() => setVisible_Revert(false)}
			/>
		</>
	)
}

export default MonthOpenForm
